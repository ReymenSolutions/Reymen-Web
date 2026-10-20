import { SITE } from "../config";
import { STATIC_ROUTES } from "../routes";
import { allVerticals, products } from "../lib/catalog";

export const GET = async () => {
  const lastmod = new Date().toISOString().slice(0, 10);
  const verticals = (await allVerticals()).filter((v) => v.publication === "published" && !v.seo.noindex).map((v) => v.route);
  const pages = (await products()).filter((p) => p.page?.publication === "published").map((p) => p.page!.route);
  const paths = [...new Set([...STATIC_ROUTES, ...verticals, ...pages])];
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths.map((p) => `<url><loc>${SITE.url}${p}</loc><lastmod>${lastmod}</lastmod></url>`).join("")}</urlset>`,
    { headers: { "Content-Type": "application/xml" } },
  );
};
