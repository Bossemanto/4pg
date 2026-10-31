import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL(".", import.meta.url)));
const port = Number(process.env.PORT || 4173);
const types = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".png", "image/png"],
  [".svg", "image/svg+xml"],
  [".webp", "image/webp"],
  [".gif", "image/gif"],
  [".mp4", "video/mp4"],
  [".woff", "font/woff"],
  [".woff2", "font/woff2"],
  [".ttf", "font/ttf"],
  [".otf", "font/otf"]
]);

createServer(async (request, response) => {
  const pathname = new URL(request.url || "/", "http://localhost").pathname;
  let decodedPath;

  try {
    decodedPath = decodeURIComponent(pathname);
  } catch {
    response.writeHead(400).end("Bad request");
    return;
  }

  const requestedPath = resolve(root, `.${decodedPath}`);
  if (requestedPath !== root && !requestedPath.startsWith(`${root}${sep}`)) {
    response.writeHead(403).end("Forbidden");
    return;
  }

  let filePath = requestedPath;
  try {
    const details = await stat(filePath);
    if (details.isDirectory()) filePath = resolve(filePath, "index.html");
    const body = await readFile(filePath);
    response.writeHead(200, {
      "Content-Type": types.get(extname(filePath).toLowerCase()) || "application/octet-stream",
      "Cache-Control": "no-cache"
    });
    response.end(body);
  } catch (error) {
    if (error.code !== "ENOENT" && error.code !== "ENOTDIR") {
      response.writeHead(500).end("Unable to read requested file");
      return;
    }

    try {
      const body = await readFile(resolve(root, "index.html"));
      response.writeHead(200, { "Content-Type": types.get(".html"), "Cache-Control": "no-cache" });
      response.end(body);
    } catch {
      response.writeHead(500).end("Unable to load the site");
    }
  }
}).listen(port, () => {
  console.log(`4PG Record Label is available at http://localhost:${port}`);
});
