import fs from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const outputDirectory = path.join(root, "dist");
const requiredPaths = [
  "index.html",
  "src",
  "assets/fonts.css",
  "assets/fonts",
  "assets/manifest.json",
  "assets/image-variants.json",
  "assets/images/optimized",
  "assets/images/4pg-mark-dark.png",
  "assets/images/4pg-wordmark-light.png"
];

const imageVariants = JSON.parse(
  await fs.readFile(path.join(root, "assets/image-variants.json"), "utf8")
);
const variantUrls = new Set();
for (const variants of Object.values(imageVariants)) {
  variantUrls.add(variants.src);
  for (const candidate of variants.srcset.split(",")) {
    variantUrls.add(candidate.trim().split(/\s+/)[0]);
  }
  variantUrls.add(variants.background.standard);
  variantUrls.add(variants.background.retina);
}

for (const url of variantUrls) {
  const file = path.resolve(root, decodeURIComponent(new URL(url, "http://localhost").pathname.slice(1)));
  if (!file.startsWith(`${path.join(root, "assets/images/optimized")}${path.sep}`)) {
    throw new Error(`Image variant is outside the optimized image directory: ${url}`);
  }
  await fs.access(file);
}

await fs.rm(outputDirectory, { recursive: true, force: true });
await fs.mkdir(outputDirectory, { recursive: true });

for (const relativePath of requiredPaths) {
  const source = path.join(root, relativePath);
  await fs.access(source);
  await fs.cp(source, path.join(outputDirectory, relativePath), { recursive: true });
}

console.log(`Prepared Vercel output with ${variantUrls.size} verified optimized image files.`);
