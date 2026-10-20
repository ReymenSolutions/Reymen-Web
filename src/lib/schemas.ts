// Esquemas de los catálogos del sitio (productos, verticales, capacidades, servicios y páginas).
// Son la regla ejecutable de «no inventar»: una función solo puede figurar como disponible si cita lo que la respalda y alguien confirmó
// que está en producción. El build falla si un archivo de datos no cumple.
import { z } from "astro/zod";

/** Estado editorial de la página: qué se compila y se indexa. */
export const publication = z.enum(["draft", "unlisted", "published"]);
/** Disponibilidad comercial real del producto o solución. */
export const availability = z.enum(["DRAFT", "COMING_SOON", "BETA", "LIVE"]);
/** Estado de una función. `live` = disponible y confirmada en producción; `beta` = verificada en código, sin confirmar en producción o con acceso limitado;
 *  `planned` = en desarrollo o sin desplegar; `concept` = idea ilustrativa. */
export const featureStatus = z.enum(["live", "beta", "planned", "concept"]);

/** Respaldo de una función: dónde está en el código, si tiene pruebas y si una persona del equipo confirmó que opera en producción. */
export const evidence = z.object({
  code: z.array(z.string()).default([]),
  tests: z.boolean().default(false),
  production: z.boolean().default(false),
});

export const feature = z
  .object({ id: z.string(), title: z.string().min(2), text: z.string().min(2), status: featureStatus, evidence: evidence.default({ code: [], tests: false, production: false }) })
  .superRefine((f, ctx) => {
    if (f.status === "live" && !(f.evidence.code.length > 0 && f.evidence.production)) {
      ctx.addIssue({ code: "custom", message: `«${f.id}»: una función \`live\` necesita evidence.code y evidence.production: true` });
    }
    if (f.status === "beta" && f.evidence.code.length === 0) {
      ctx.addIssue({ code: "custom", message: `«${f.id}»: una función \`beta\` necesita evidence.code` });
    }
    if ((f.status === "planned" || f.status === "concept") && f.evidence.production) {
      ctx.addIssue({ code: "custom", message: `«${f.id}»: \`${f.status}\` no puede tener production: true (si ya opera, cambia su estado)` });
    }
  });

const cta = z.object({ label: z.string(), href: z.string() });
const seo = z.object({ title: z.string().max(70), description: z.string().max(170), noindex: z.boolean().default(false) });
const capture = z.object({ file: z.string(), alt: z.string().min(8), demo: z.literal(true) });

/** Coherencia entre la disponibilidad declarada y sus funciones. */
function consistent(d: { availability: z.infer<typeof availability>; features: z.infer<typeof feature>[]; id: string }, ctx: z.RefinementCtx) {
  const live = d.features.filter((f) => f.status === "live").length;
  if (d.availability === "LIVE" && live === 0) ctx.addIssue({ code: "custom", message: `«${d.id}» está LIVE pero ninguna función es \`live\`` });
  if ((d.availability === "DRAFT" || d.availability === "COMING_SOON") && live > 0) ctx.addIssue({ code: "custom", message: `«${d.id}» es ${d.availability} pero declara funciones \`live\`` });
}

export const product = z
  .object({
    id: z.string(),
    name: z.string(),
    order: z.number(),
    tagline: z.string().max(90),
    description: z.string().max(240),
    /** platform = Reymen App · standalone = se contrata solo · module = módulo administrado desde Reymen App · connected = producto aparte conectado a Reymen App */
    model: z.enum(["platform", "standalone", "module", "connected"]),
    publication,
    availability,
    /** Enlace para entrar o abrir el producto (si existe). */
    href: z.string().url().optional(),
    /** Página propia del producto. Mientras su `publication` no sea `published`, los enlaces apuntan a la sección de /productos. */
    page: z.object({ route: z.string().startsWith("/"), publication }).optional(),
    features: z.array(feature),
    related: z.array(z.string()).default([]),
    glyph: z.enum(["agent", "automation", "software", "restaurant", "clinic", "property", "app", "pos", "card"]).default("software"),
    /** Nota interna para el equipo (no se muestra). */
    reviewNote: z.string().optional(),
  })
  .superRefine(consistent);

export const vertical = z
  .object({
    id: z.string(),
    name: z.string(),
    order: z.number(),
    route: z.string().startsWith("/"),
    description: z.string().max(200),
    publication,
    availability,
    /** Niveles distintos de avance (no son lo mismo que la disponibilidad comercial). */
    stages: z.object({ code: z.boolean(), tests: z.boolean(), deployed: z.boolean() }),
    audience: z.string(),
    products: z.array(z.string()).default([]),
    features: z.array(feature).default([]),
    benefits: z.array(z.string()).default([]),
    captures: z.array(capture).default([]),
    demos: z.array(z.string()).default([]),
    layout: z.enum(["custom", "coming-soon"]).default("coming-soon"),
    cta: z.object({ primary: cta, secondary: cta.optional() }),
    seo,
    /** Fila de «interés» en la home cuando la página aún no está publicada. */
    interest: z.object({ text: z.string(), cta: z.string(), glyph: z.string() }).optional(),
    related: z.array(z.string()).default([]),
    /** Contenido propio de la página (solo para layout custom). */
    hero: z.object({ title: z.string(), lede: z.string(), dot: z.string().default("") }).optional(),
    story: z.array(z.object({ when: z.string(), h: z.string(), p: z.string(), img: z.string(), alt: z.string().min(8), w: z.number(), h2: z.number(), pos: z.string().optional(), focus: z.array(z.number()).length(3).optional() })).default([]),
    faq: z.array(z.object({ q: z.string(), a: z.string() })).default([]),
  })
  .superRefine((v, ctx) => {
    consistent(v, ctx);
    if (v.publication === "published" && (v.availability === "DRAFT")) ctx.addIssue({ code: "custom", message: `«${v.id}» está publicada pero su disponibilidad es DRAFT` });
    if (v.availability === "LIVE" && !v.stages.deployed) ctx.addIssue({ code: "custom", message: `«${v.id}» es LIVE pero stages.deployed es false` });
    if (v.publication === "published" && v.availability !== "LIVE" && v.availability !== "BETA" && !v.seo.noindex) ctx.addIssue({ code: "custom", message: `«${v.id}»: una página ${v.availability} publicada debe llevar seo.noindex hasta tener contenido sustancial` });
    if (v.layout === "custom" && !v.hero) ctx.addIssue({ code: "custom", message: `«${v.id}»: layout custom necesita hero` });
  });

export const capability = z.object({ id: z.string(), order: z.number(), title: z.string(), text: z.string(), glyph: z.enum(["agent", "automation", "software"]), href: z.string() });
export const service = z.object({ id: z.string(), order: z.number(), title: z.string(), text: z.string() });

export const home = z.object({
  hero: z.object({ title: z.string(), lede: z.string(), tagline: z.string() }),
  facts: z.array(z.object({ title: z.string(), text: z.string() })),
  trust: z.array(z.object({ h: z.string(), p: z.string(), icon: z.enum(["layers", "archive", "shield"]) })),
  faq: z.array(z.object({ q: z.string(), a: z.string() })),
});
