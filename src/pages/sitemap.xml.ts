import { SITE } from "../config";
const paths = ["", "/restaurantes", "/privacidad"];
const lastmod = new Date().toISOString().slice(0, 10);
export const GET = () =>
  new Response(
    `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths.map((p) => `<url><loc>${SITE.url}${p}</loc><lastmod>${lastmod}</lastmod></url>`).join("")}</urlset>`,
    { headers: { "Content-Type": "application/xml" } },
  );
