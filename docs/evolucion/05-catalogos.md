# Catálogos del sitio (P1)

Todo lo comercial vive en `src/content/` como JSON validado al compilar (`src/lib/schemas.ts`). Las páginas solo componen.

| Colección | Qué es | Dónde se usa |
|---|---|---|
| `products/` | Reymen App, Reymen POS, Reymen AI Agents, Smart Cards | `/productos`, menú Productos, home, formulario de contacto |
| `verticals/` | Restaurantes, Realty, Clínicas y servicios… | `/restaurantes`, `[slug].astro` (verticales en preparación), menú Soluciones, sitemap, home |
| `capabilities/` | Las 3 capacidades de la home | «Qué hacemos» |
| `services/` | Los 4 servicios a la medida | Sección de servicios de la home |
| `pages/home.json` | Hero, datos de apoyo, seguridad, preguntas | Home |
| `agents/` | Catálogo comercial de agentes por categoría, cada uno con su estado | `/ai-agents` (`AgentCatalog`) |
| `automations/` | Los 9 flujos reales de Reymen App: evento, condición, acción y resultado | `/automatizaciones` (`FlowModel`) |
| `landings/` | Páginas de capacidad y empresa: automatizaciones, servicios, seguridad | `/automatizaciones`, `/servicios`, `/seguridad`, menú |
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
- **Pasar Realty de BETA a LIVE** cuando esté desplegado (ya está publicada como BETA): en `verticals/realty.json`, `publication: "published"`, `availability: "BETA"` o `"LIVE"`, `stages.deployed: true`, pasar las funciones a `beta`/`live` con su evidencia y quitar `seo.noindex` si corresponde. La ruta `/realty`, el menú, el sitemap y los CTA salen solos.
- **Agregar una vertical:** un archivo en `verticals/` (con `layout: "coming-soon"` usa `[slug].astro`; con `custom` se crea su propio `src/pages/<ruta>.astro`).
- **Agregar un producto:** un archivo en `products/`. Mientras su `page.publication` no sea `published`, el menú y la home enlazan a su sección en `/productos`.
- **Estado de WhatsApp (Twilio):** `products/ai-agents.json`, función `whatsapp` (hoy `planned`). Sube a `beta` con integración verificada en pruebas y a `live` con pruebas de extremo a extremo y confirmación de producción. Ver `04-whatsapp-twilio.md`.

## Pendientes de confirmar (marcados en los datos)
- Reymen POS, Reymen App (CRM, Foods) están `live` porque operan en `pos.reymen.mx` y `app.reymen.mx`; confirmar función por función.
- Smart Cards y AI Agents están `BETA` con `reviewNote`: confirmar su disponibilidad real.

## P2
- **Páginas nuevas:** `/ai-agents` y `/smart-cards` (productos), `/automatizaciones`, `/servicios` y `/seguridad` (landings). El menú, el sitemap y los enlaces de la home las toman de los datos.
- **Realty** está **LIVE** (2026-10-27, confirmado por el equipo: en producción). `/realty` usa layout `custom` (`src/pages/realty.astro`) con capturas con datos de demostración. Funciones `live` (con `production: true`): propiedades, prospectos, matches, visitas y demanda observada. Siguen en `beta` la propuesta de perfil con IA, la rotación y las campañas hasta confirmar su despliegue.
- **Smart Cards** pasó a `LIVE` por confirmación del equipo (2026-10-20); AI Agents sigue en `BETA`. La página de Smart Cards publica solo lo verificado desde Reymen App; el panel, SSO, estadísticas, tema y enlaces viven en Reymen App y se publican; faltan capturas (requieren Supabase de Smart Cards).
- **Agentes:** solo «Atención de prospectos», «Seguimiento comercial», «Consulta de conocimiento» y «Escalamiento» son `beta`; el resto del catálogo es `concept`. Los equipos de agentes se muestran como concepto, sin orquestación real.
- **Automatizaciones:** los 9 flujos son `beta` (verificados en código); parten de eventos del POS, inventario y lealtad. Se dice expresamente que no hay constructor visual y que WhatsApp está en desarrollo.

## P3.1 · Capturas con datos de demostración (2026-10-20)
- Las capturas de Reymen App (bandeja con respuesta sugerida, seguimiento, inventario con stock bajo, lealtad) se recapturaron a 2× y se añadieron Automatizaciones, Agente IA (modo por canal) y Mi consumo de IA.
- Origen: base local desechable con un negocio ficticio («Café Norte», teléfonos +52 81 00xx, correos .test). No se usó producción y los scripts de siembra no se versionan.
- La clave de IA del entorno local era un valor ficticio; no se generó ningún borrador real. El borrador de la bandeja es texto sembrado.
- Smart Cards no tiene capturas: su panel depende de Supabase, que no se levantó.
- El hero ahora tiene dos actos: «Conversa y vende» (Mensaje, Agente IA, CRM) y «Opera» (POS, Inventario, Lealtad, Avisos).
