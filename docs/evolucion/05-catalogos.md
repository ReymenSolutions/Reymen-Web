# Catálogos del sitio (P1)

Todo lo comercial vive en `src/content/` como JSON validado al compilar (`src/lib/schemas.ts`). Las páginas solo componen.

| Colección | Qué es | Dónde se usa |
|---|---|---|
| `products/` | Reymen App, Reymen POS, Reymen AI Agents, Smart Cards | `/productos`, menú Productos, home, formulario de contacto |
| `verticals/` | Restaurantes, Realty, Clínicas y servicios… | `/restaurantes`, `[slug].astro` (verticales en preparación), menú Soluciones, sitemap, home |
| `capabilities/` | Las 3 capacidades de la home | «Qué hacemos» |
| `services/` | Los 4 servicios a la medida | Sección de servicios de la home |
| `pages/home.json` | Hero, datos de apoyo, seguridad, preguntas | Home |
| `src/data/ecosystem.ts` | Nodos y recorridos del mapa del ecosistema | `EcosystemMap` |

## Dos estados que no se mezclan
- **`publication`** (la página): `draft` no se compila ni aparece en menú ni sitemap · `unlisted` se compila con `noindex`, fuera de menú y sitemap · `published` se indexa.
- **`availability`** (el producto o la solución): `DRAFT`, `COMING_SOON`, `BETA`, `LIVE`. Manda el badge, el texto y el botón («Agendar demo», «Solicitar acceso», «Registrar interés»).
- Una vertical además declara `stages` (`code`, `tests`, `deployed`): implementación, pruebas y despliegue son cosas distintas de la disponibilidad comercial.

## Regla de evidencia (el build falla si no se cumple)
Cada función lleva `status` y `evidence { code[], tests, production }`:
- `live` → exige `code` **y** `production: true` (alguien del equipo confirmó que opera).
- `beta` → exige `code`.
- `planned` / `concept` → no pueden tener `production: true`.
- Un producto o vertical `LIVE` necesita al menos una función `live` (y una vertical `LIVE`, `stages.deployed`); `COMING_SOON` no puede declarar funciones `live`; una página publicada que no es `LIVE`/`BETA` debe llevar `seo.noindex`.
`evidence.code` apunta al repositorio y archivo o documento que respalda la función. `production` solo lo cambia una persona que lo haya verificado.

## Cómo
- **Activar Realty** cuando esté desplegado: en `verticals/realty.json`, `publication: "published"`, `availability: "BETA"` o `"LIVE"`, `stages.deployed: true`, pasar las funciones a `beta`/`live` con su evidencia y quitar `seo.noindex` si corresponde. La ruta `/realty`, el menú, el sitemap y los CTA salen solos.
- **Agregar una vertical:** un archivo en `verticals/` (con `layout: "coming-soon"` usa `[slug].astro`; con `custom` se crea su propio `src/pages/<ruta>.astro`).
- **Agregar un producto:** un archivo en `products/`. Mientras su `page.publication` no sea `published`, el menú y la home enlazan a su sección en `/productos`.
- **Estado de WhatsApp (Twilio):** `products/ai-agents.json`, función `whatsapp` (hoy `planned`). Sube a `beta` con integración verificada en pruebas y a `live` con pruebas de extremo a extremo y confirmación de producción. Ver `04-whatsapp-twilio.md`.

## Pendientes de confirmar (marcados en los datos)
- Reymen POS, Reymen App (CRM, Foods) están `live` porque operan en `pos.reymen.mx` y `app.reymen.mx`; confirmar función por función.
- Smart Cards y AI Agents están `BETA` con `reviewNote`: confirmar su disponibilidad real.
