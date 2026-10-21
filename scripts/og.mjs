// Genera una imagen Open Graph (1200×630) por página indexable a partir del HTML ya construido.
// Uso: npm run build && npm run og   → escribe public/og/<ruta>.png (se versionan; Base.astro las usa si existen).
import { readdirSync, readFileSync, mkdirSync, existsSync } from "node:fs";
import { chromium } from "@playwright/test";

const dist = new URL("../dist/", import.meta.url);
const out = new URL("../public/og/", import.meta.url);
mkdirSync(out, { recursive: true });
const font = readFileSync(new URL("../node_modules/@fontsource-variable/archivo/files/archivo-latin-wdth-normal.woff2", import.meta.url)).toString("base64");
const icon = readFileSync(new URL("../public/icon-192-v5.png", import.meta.url)).toString("base64");
const decode = (s) => s.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;|&#x27;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
const SKIP = new Set(["index", "404", "gracias", "privacidad"]);

const pages = readdirSync(dist).filter((f) => f.endsWith(".html") && !SKIP.has(f.slice(0, -5))).map((f) => {
  const html = readFileSync(new URL(f, dist), "utf8");
  if (/<meta name="robots" content="[^"]*noindex/.test(html)) return null;
  const title = decode(html.match(/<title>([^<]*)/)[1]);
  const desc = decode(html.match(/<meta name="description" content="([^"]*)"/)?.[1] ?? "");
  const [head, ...rest] = title.split(" · ");
  const sub = rest.length && !/^Reymen Solutions$/.test(rest.join(" · ")) ? rest.join(" · ") : desc;
  return { slug: f.slice(0, -5), head, sub: sub.length > 120 ? sub.slice(0, 117).replace(/\s+\S*$/, "") + "…" : sub };
}).filter(Boolean);

const css = `@font-face{font-family:A;src:url(data:font/woff2;base64,${font}) format("woff2");font-weight:100 900;font-stretch:62% 125%}
*{box-sizing:border-box;margin:0}body{width:1200px;height:630px;font-family:A,sans-serif;color:#e9eefc;position:relative;overflow:hidden;
background:radial-gradient(900px 520px at 85% 0%,rgb(61 99 255/.45),transparent 70%),radial-gradient(700px 420px at 0% 100%,rgb(255 106 19/.18),transparent 70%),#060e2b}
.brand{position:absolute;left:72px;top:60px;display:flex;align-items:center;gap:18px;font-size:30px;font-weight:700;font-stretch:112%}
.brand img{width:56px;height:56px;border-radius:14px}
.t{position:absolute;left:72px;right:72px;top:190px}
h1{font-size:92px;line-height:1.02;font-weight:760;font-stretch:108%;letter-spacing:-0.02em;text-wrap:balance}
h1 i{font-style:normal;color:#3d63ff}
p{margin-top:30px;font-size:34px;line-height:1.35;color:#aab7dc;max-width:960px;text-wrap:pretty}
.bar{position:absolute;left:72px;right:72px;bottom:56px;display:flex;justify-content:space-between;font-size:24px;color:#8ea6ff;font-stretch:106%;font-weight:600;border-top:1px solid #1d2a57;padding-top:22px}`;

const b = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM ?? (existsSync("/opt/pw-browsers/chromium") ? "/opt/pw-browsers/chromium" : undefined) });
const page = await b.newPage({ viewport: { width: 1200, height: 630 } });
for (const p of pages) {
  await page.setContent(`<style>${css}</style><div class="brand"><img src="data:image/png;base64,${icon}" alt="">Reymen Solutions</div><div class="t"><h1>${esc(p.head)}<i>.</i></h1><p>${esc(p.sub)}</p></div><div class="bar"><span>reymen.mx</span><span>Software · Agentes de IA · Automatización</span></div>`);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: new URL(`${p.slug}.png`, out).pathname });
  console.log("og", p.slug, "→", p.head);
}
await b.close();
