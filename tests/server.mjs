// Servidor de pruebas: sirve dist/ como lo haría nginx (try_files $uri $uri.html) y aplica los MISMOS encabezados de seguridad que
// deploy/nginx.conf (se leen de ahí, para que la prueba no se desincronice de producción).
import { createServer } from "node:http";
import { readFileSync, existsSync, statSync } from "node:fs";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(fileURLToPath(new URL("..", import.meta.url)), "dist");
const conf = readFileSync(join(fileURLToPath(new URL("..", import.meta.url)), "deploy/nginx.conf"), "utf8");
const headers = {};
for (const m of conf.matchAll(/^\s*add_header\s+(\S+)\s+("([^"]*)"|(\S+))\s+always;/gm)) headers[m[1]] = m[3] ?? m[4];

const types = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".webp": "image/webp", ".png": "image/png", ".svg": "image/svg+xml", ".xml": "application/xml", ".txt": "text/plain", ".woff2": "font/woff2", ".webmanifest": "application/manifest+json" };
const file = (p) => (existsSync(p) && statSync(p).isFile() ? p : null);

createServer((req, res) => {
  const path = normalize(decodeURIComponent(new URL(req.url, "http://x").pathname)).replace(/^(\.\.[/\\])+/, "");
  let f = file(join(root, path)) ?? file(join(root, `${path}.html`)) ?? (path === "/" ? file(join(root, "index.html")) : null);
  let status = 200;
  if (!f) { f = file(join(root, "404.html")); status = 404; }
  res.writeHead(status, { ...headers, "Content-Type": types[extname(f ?? "")] ?? "application/octet-stream" });
  res.end(f ? readFileSync(f) : "Not found");
}).listen(Number(process.env.PORT ?? 4322), "127.0.0.1");
