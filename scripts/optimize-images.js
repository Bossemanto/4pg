import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const imageDirectory = path.join(root, "assets/images");
const outputDirectory = path.join(imageDirectory, "optimized");
const variantsFile = path.join(root, "assets/image-variants.json");
const sourceManifest = JSON.parse(await fs.readFile(path.join(root, "assets/manifest.json"), "utf8"));
const dataDirectory = path.join(root, "src/data");
const imagePattern = /\.(?:avif|gif|jpe?g|png|webp)(?:[?#].*)?$/i;
const widths = [320, 640, 960, 1280, 1600, 2400];
const sources = new Set();
let previousVariants = {};

try {
  previousVariants = JSON.parse(await fs.readFile(variantsFile, "utf8"));
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}

function collectImageSources(value, key = "") {
  if (Array.isArray(value)) {
    value.forEach(item => collectImageSources(item, key));
  } else if (value && typeof value === "object") {
    Object.entries(value).forEach(([childKey, childValue]) => collectImageSources(childValue, childKey));
  } else if (key === "src" && typeof value === "string" && imagePattern.test(value)) {
    sources.add(value);
  }
}

for (const file of await fs.readdir(dataDirectory)) {
  if (file.endsWith(".json")) {
    collectImageSources(JSON.parse(await fs.readFile(path.join(dataDirectory, file), "utf8")));
  }
}

const appSource = await fs.readFile(path.join(root, "src/app.js"), "utf8");
const heroList = appSource.match(/const HERO_IMAGE_FILES = (\[[\s\S]*?\]);/);
if (!heroList) throw new Error("Unable to find HERO_IMAGE_FILES in src/app.js");
for (const file of JSON.parse(heroList[1])) {
  sources.add(`/assets/images/hero/${encodeURIComponent(file)}`);
}

for (const match of appSource.matchAll(/(["'])(\/assets\/images\/[^"']+\.(?:avif|gif|jpe?g|png|webp))\1/gi)) {
  sources.add(match[2]);
}

const stylesheet = await fs.readFile(path.join(root, "src/styles.css"), "utf8");
for (const match of stylesheet.matchAll(/url\((["']?)(\/assets\/images\/[^)"']+\.(?:avif|gif|jpe?g|png|webp))\1\)/gi)) {
  sources.add(match[2]);
}

function localSource(source) {
  if (source.startsWith("/")) return source;
  return sourceManifest[source] || "";
}

function imageFile(local) {
  const pathname = decodeURIComponent(new URL(local, "http://localhost").pathname);
  const file = path.resolve(root, pathname.slice(1));
  if (!file.startsWith(`${imageDirectory}${path.sep}`)) {
    throw new Error(`Image path is outside assets/images: ${local}`);
  }
  return file;
}

function chooseVariant(variants, targetWidth) {
  return variants.find(variant => variant.width >= targetWidth) || variants.at(-1);
}

const localImages = new Map();
for (const source of sources) {
  const local = localSource(source);
  if (local.startsWith("/assets/images/") && imagePattern.test(local)) {
    localImages.set(local, imageFile(local));
  }
}

await fs.mkdir(outputDirectory, { recursive: true });

const imageEntries = [...localImages.entries()];
const generated = {};
let sourceBytes = 0;
let outputBytes = 0;
let nextIndex = 0;

async function processImage(local, input) {
  const metadata = await sharp(input).metadata();
  if (!metadata.width || !metadata.height) {
    throw new Error(`Unable to read image dimensions: ${local}`);
  }
  if (metadata.pages && metadata.pages > 1) {
    console.warn(`Keeping animated image unchanged: ${local}`);
    return [local, null, 0, 0];
  }

  const displayWidth = metadata.orientation && metadata.orientation >= 5 && metadata.orientation <= 8
    ? metadata.height
    : metadata.width;
  const variantWidths = [...new Set([...widths.filter(width => width < displayWidth), Math.min(displayWidth, widths.at(-1))])].sort((a, b) => a - b);
  const digest = createHash("sha256").update(local).digest("hex").slice(0, 12);
  const variants = [];
  let bytes = 0;

  for (const width of variantWidths) {
    const output = path.join(outputDirectory, `${digest}-${width}.webp`);
    const result = await sharp(input)
      .rotate()
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 84, effort: 5, alphaQuality: 90 })
      .toFile(output);
    variants.push({
      width: result.width,
      url: `/assets/images/optimized/${digest}-${result.width}.webp`
    });
    bytes += result.size;
  }

  const stat = await fs.stat(input);
  const defaultVariant = chooseVariant(variants, 640);
  const standardVariant = chooseVariant(variants, 1600);
  const retinaVariant = chooseVariant(variants, 2400);
  return [local, {
    src: defaultVariant.url,
    srcset: variants.map(variant => `${variant.url} ${variant.width}w`).join(", "),
    background: {
      standard: standardVariant.url,
      retina: retinaVariant.url
    }
  }, stat.size, bytes];
}

async function worker() {
  while (nextIndex < imageEntries.length) {
    const [local, input] = imageEntries[nextIndex++];
    const [key, variants, originalSize, variantsSize] = await processImage(local, input);
    sourceBytes += originalSize;
    outputBytes += variantsSize;
    if (variants) generated[key] = variants;
  }
}

await Promise.all(Array.from({ length: Math.min(3, imageEntries.length) }, () => worker()));
function variantUrls(mapping) {
  return Object.values(mapping).flatMap(variants => [
    variants.src,
    ...variants.srcset.split(",").map(candidate => candidate.trim().split(/\s+/)[0]),
    variants.background.standard,
    variants.background.retina
  ]);
}

const currentUrls = new Set(variantUrls(generated));
for (const url of variantUrls(previousVariants)) {
  if (currentUrls.has(url)) continue;
  const pathname = new URL(url, "http://localhost").pathname;
  const staleFile = path.resolve(root, decodeURIComponent(pathname.slice(1)));
  if (!staleFile.startsWith(`${outputDirectory}${path.sep}`)) {
    throw new Error(`Refusing to remove generated image outside output directory: ${url}`);
  }
  await fs.rm(staleFile, { force: true });
}

await fs.writeFile(
  variantsFile,
  `${JSON.stringify(Object.fromEntries(Object.entries(generated).sort(([a], [b]) => a.localeCompare(b))), null, 2)}\n`
);

console.log(`Created ${Object.keys(generated).length} responsive image sets from ${imageEntries.length} local images.`);
console.log(`Original files: ${(sourceBytes / 1048576).toFixed(1)} MiB; generated variants: ${(outputBytes / 1048576).toFixed(1)} MiB.`);
