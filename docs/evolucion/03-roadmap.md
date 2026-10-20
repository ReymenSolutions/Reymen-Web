# Reymen Solutions · Entregable 3 — Roadmap

> **Actualización 2026-10-20 (confirmada por el equipo):** Reymen Realty tiene implementación v1 en `main` de Reymen App, pero **no está desplegado en producción**. En la web: no se anuncia como disponible ni como beta pública, no se enlaza ninguna función inmobiliaria, y `/realty` se prepara en estado de borrador o «próximamente» con una arquitectura que permita activarla después sin rehacerla. Se distinguen cuatro niveles: implementación en código · pruebas · despliegue · disponibilidad comercial. La integración de WhatsApp será **Twilio** (ver `04-whatsapp-twilio.md`; no hay rastro de Twilio en los repos). Solo está aprobado el bloque **P0**.


Tamaños relativos: **S** (menos de un día de trabajo), **M** (1–3 días), **L** (más de 3 días). Cada bloque se entrega como un PR separado, con verificación y capturas comparativas, y nada se despliega sin que lo autorices.

## P0 — Correcciones y base (sin cambio de diseño)
| # | Trabajo | Tamaño | Depende de |
|---|---|---|---|
| P0.1 | Quitar código muerto: `CtaGroup`, `Window`, `legacy-index.html` | S | — |
| P0.2 | Cabeceras `Content-Security-Policy` y `Permissions-Policy` en nginx; probar que formulario, chat y Plausible siguen funcionando | S | — |
| P0.3 | Corregir afirmaciones sin respaldo (matriz de la auditoría §4): WhatsApp «al instante», recordatorios en «Clínicas», «cifradas» | S | Tu respuesta a la pregunta 5 |
| P0.4 | `typescript` + `@astrojs/check` y script `npm run check` | S | Pregunta 8 |
| P0.5 | Pruebas de humo en el repo (Playwright + axe): rutas, menú, formulario con API simulada, 8 anchuras | M | Pregunta 8 |
| P0.6 | Sitemap generado desde una lista única de rutas (puente hacia P1) | S | — |

## P1 — Arquitectura
| # | Trabajo | Tamaño | Depende de |
|---|---|---|---|
| P1.1 | Colecciones de contenido + esquemas Zod + validador de evidencia/estado (el build falla si `live` no tiene respaldo) | M | P0.4 |
| P1.2 | Migrar el contenido actual (home y restaurantes) a datos **sin cambiar lo que se ve** | M | P1.1 |
| P1.3 | `NavMenu` con desplegables accesibles + menú móvil en acordeón; `StatusBadge` | M | P1.1 |
| P1.4 | `/contacto` + `InterestForm` (`?interes=`, `source` y `vertical`) | S | P1.1 |
| P1.5 | `/productos`: hub, `ProductCard`, secciones de Reymen App y Reymen POS | M | P1.1, P1.3 |
| P1.6 | `EcosystemMap` y `FlowDiagram` (generalizar `ServicesCanvas`) con estados por arista/nodo | M | P1.1 |
| P1.7 | Home reordenada (8 bloques), hero nuevo y demo en dos actos | L | P1.2, P1.5, P1.6; copy (pregunta 5); capturas (P3.1) |
| P1.8 | Plantilla de datos estructurados (`JsonLd`, `Breadcrumbs`) y metadatos desde datos | S | P1.1 |

## P2 — Expansión comercial
| # | Trabajo | Tamaño | Depende de |
|---|---|---|---|
| P2.1 | `/ai-agents` (niveles 1–3, control, catálogo con estados) | L | P1.1, P1.6, capturas del Agente IA |
| P2.2 | `/automatizaciones` (modelo, biblioteca de 9 flujos, control, integraciones) | L | P1.6, captura de Automatizaciones |
| P2.3 | `/realty` (BETA o COMING_SOON) | M | **Pregunta 2**; capturas de Realty si BETA |
| P2.4 | `/smart-cards` | M | **Pregunta 3** (sin material, queda `unlisted` y breve) |
| P2.5 | `/servicios` y `/seguridad` como páginas propias | M | P1.1; confirmar respaldos y copia externa con operaciones |
| P2.6 | `/restaurantes`: añadir CRM, Inbox, automatizaciones, IA e integraciones al recorrido, con estado de cada una | M | P2.1, P2.2 |
| P2.7 | `/soluciones` (solo si Realty se publica) | S | P2.3 |

## P3 — Experiencias avanzadas
| # | Trabajo | Tamaño | Depende de |
|---|---|---|---|
| P3.1 | Datos de demostración **locales** + recaptura a 2× de Reymen App y capturas nuevas (Automatizaciones, Agente IA, Consumo, Realty) | L | Pregunta 9 |
| P3.2 | Demos interactivas: filtro del catálogo de agentes, recorrido animado del ecosistema, simulación de flujo | M | P2.x |
| P3.3 | Imagen Open Graph por página | S | P1.8 |
| P3.4 | Inglés (rutas `/en`, `hreflang`) | L | Decisión posterior |
| P3.5 | Más glifos propios (Smart Cards, CRM, Inbox, Loyalty, Realty) y recursos gráficos | S | — |

## Dependencias reales y bloqueos
- **Mías** (puedo avanzar): P0.1, P0.2, P0.4–P0.6 y toda la capa de datos P1.
- **Tuyas**: estado real de Realty; acceso o material de Smart Cards; confirmación de que el conector de WhatsApp opera en producción; respaldo externo cifrado; Calendly, WhatsApp de ventas, Search Console, domicilio legal (pendientes de antes).
- **Entorno local de demostración**: P3.1 requiere sembrar datos ficticios; no se usa producción.

## Plan de validación (Fase 4, por cada PR y al final)
| Verificación | Herramienta | Criterio |
|---|---|---|
| Build | `npm run build` | sin errores; validador de evidencia en verde |
| Tipos | `npm run check` | 0 errores |
| Funcional | Playwright | navegación, desplegables con teclado, formularios (éxito, 400, 429, error de red), chat, demos |
| Responsive | Playwright | 320, 375, 390, 430, 768, 1024, 1440, 1920: sin desbordes, botones y áreas táctiles ≥ 44 px, widget sin tapar contenido |
| Accesibilidad | axe-core | 0 violaciones; foco visible; `prefers-reduced-motion` |
| Rendimiento | Lighthouse móvil y escritorio | mantener ≥ 95 y CLS 0 |
| SEO | revisión de metadatos, sitemap, canonical, `noindex` por estado, JSON-LD | coherente con la política de §8 |
| Enlaces | verificador de enlaces internos | 0 rotos |
Se reportará **qué se ejecutó de verdad**, qué falló y qué no se pudo ejecutar (por ejemplo, producción real, Plausible, Search Console).

## Riesgos
1. **Afirmar de más** por la distancia entre código y producción → mitigado con el registro de evidencia y confirmación humana para `live`.
2. **Páginas delgadas** (Smart Cards, Realty) → `unlisted`/`noindex` hasta tener sustancia.
3. **Cambio de narrativa de la home** puede bajar la claridad para restaurantes → `/restaurantes` se mantiene como destino directo y la home lo enlaza arriba.
4. **Dependencia de capturas** frescas → sin ellas, las páginas nuevas usan diagramas y se marcan como tales.
5. **CSP** puede romper un script externo si se omite un origen → prueba antes de publicar.
