// Acceso tipado a los catálogos y reglas derivadas (qué se publica, a dónde enlaza cada cosa, cómo se llama cada estado).
import { getCollection } from "astro:content";
import type { z } from "astro/zod";
import type { product as productSchema, vertical as verticalSchema, capability as capabilitySchema, service as serviceSchema, home as homeSchema } from "./schemas";

export type Product = z.infer<typeof productSchema>;
export type Vertical = z.infer<typeof verticalSchema>;
export type Capability = z.infer<typeof capabilitySchema>;
export type Service = z.infer<typeof serviceSchema>;
export type Home = z.infer<typeof homeSchema>;
export type Feature = Product["features"][number];

export const AVAILABILITY_LABEL = { LIVE: "Disponible", BETA: "Beta", COMING_SOON: "Próximamente", DRAFT: "Borrador" } as const;
export const FEATURE_LABEL = { live: "Disponible", beta: "Beta", planned: "En desarrollo", concept: "Concepto" } as const;
export const MODEL_LABEL = {
  platform: "Plataforma",
  standalone: "Se contrata por separado",
  module: "Módulo de Reymen App",
  connected: "Producto conectado con Reymen App",
} as const;

const byOrder = <T extends { order: number }>(a: T, b: T) => a.order - b.order;
async function data(name: "products"): Promise<Product[]>;
async function data(name: "verticals"): Promise<Vertical[]>;
async function data(name: "capabilities"): Promise<Capability[]>;
async function data(name: "services"): Promise<Service[]>;
async function data(name: "products" | "verticals" | "capabilities" | "services") {
  return (await getCollection(name)).map((e) => e.data as { order: number }).sort(byOrder);
}

/** Productos que se muestran (los borradores no aparecen en ningún lugar). */
export const products = async () => (await data("products")).filter((p) => p.publication !== "draft");
/** Verticales con página pública y enlazable (publicadas). */
export const publishedVerticals = async () => (await data("verticals")).filter((v) => v.publication === "published");
/** Verticales cuya página aún no existe pero que reciben «registro de interés» en la home. */
export const interestVerticals = async () => (await data("verticals")).filter((v) => v.publication !== "published" && v.interest);
export const allVerticals = () => data("verticals");
export const getVertical = async (id: string) => { const v = (await data("verticals")).find((x) => x.id === id); if (!v) throw new Error(`Vertical «${id}» no existe`); return v; };
export const getProduct = async (id: string) => { const p = (await data("products")).find((x) => x.id === id); if (!p) throw new Error(`Producto «${id}» no existe`); return p; };
export const capabilities = () => data("capabilities");
export const services = () => data("services");
export const homeContent = async (): Promise<Home> => (await getCollection("pages")).find((e) => e.id === "home")!.data as Home;

/** Enlace de un producto: su página si ya está publicada; si no, su sección en /productos. */
export const productHref = (p: Product) => (p.page?.publication === "published" ? p.page.route : `/productos#${p.id}`);

/** Las relaciones entre catálogos deben apuntar a algo que existe; si no, el build falla. */
export async function assertCatalogIntegrity() {
  const ids = new Set((await data("products")).map((p) => p.id));
  for (const p of await data("products")) for (const r of p.related) if (!ids.has(r)) throw new Error(`Producto «${p.id}»: related «${r}» no existe`);
  const vids = new Set((await data("verticals")).map((v) => v.id));
  for (const v of await data("verticals")) {
    for (const r of v.products) if (!ids.has(r)) throw new Error(`Vertical «${v.id}»: producto «${r}» no existe`);
    for (const r of v.related) if (!vids.has(r)) throw new Error(`Vertical «${v.id}»: related «${r}» no existe`);
  }
}

/** Menú principal, generado desde los datos: solo aparece lo que tiene página publicada o sección real. */
export async function navGroups() {
  const verticals = await publishedVerticals();
  const prods = await products();
  return [
    {
      id: "soluciones",
      label: "Soluciones",
      items: [
        ...verticals.map((v) => ({ label: v.name, text: v.audience, href: v.route, badge: v.availability === "LIVE" ? null : AVAILABILITY_LABEL[v.availability] })),
        { label: "Otras industrias", text: "Cuéntanos tu caso y lo revisamos juntos.", href: "/contacto?interes=otra-industria", badge: null },
      ],
    },
    {
      id: "productos",
      label: "Productos",
      items: prods.map((p) => ({ label: p.name, text: p.tagline, href: productHref(p), badge: p.availability === "LIVE" ? null : AVAILABILITY_LABEL[p.availability] })),
      footer: { label: "Ver todos los productos", href: "/productos" },
    },
  ];
}
