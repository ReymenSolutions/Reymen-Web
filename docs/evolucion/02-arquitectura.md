# Reymen Solutions · Entregable 2 — Arquitectura propuesta (Fase 2)

> **Actualización 2026-10-20 (confirmada por el equipo):** Reymen Realty tiene implementación v1 en `main` de Reymen App, pero **no está desplegado en producción**. En la web: no se anuncia como disponible ni como beta pública, no se enlaza ninguna función inmobiliaria, y `/realty` se prepara en estado de borrador o «próximamente» con una arquitectura que permita activarla después sin rehacerla. Se distinguen cuatro niveles: implementación en código · pruebas · despliegue · disponibilidad comercial. La integración de WhatsApp será **Twilio** (ver `04-whatsapp-twilio.md`; no hay rastro de Twilio en los repos). Solo está aprobado el bloque **P0**.


Base: `01-auditoria.md`. **Ninguna de estas decisiones está implementada.** Las marcadas **[Decidir]** necesitan tu respuesta.

---

## 1. Decisiones técnicas

### 1.1 Conservar Astro. [Decidir]
El brief pide Next.js/React/TypeScript. La web es Astro estático y mide 98–100 en rendimiento. Propongo **no migrar**:
- Es un sitio de marketing sin sesión, sin datos por usuario ni renderizado en servidor: Next.js agregaría un runtime Node, ~40–100 KB de JS por página y una superficie de despliegue más grande (hoy es nginx con archivos).
- Astro soporta componentes React por isla si algún día una demo lo necesita, sin reescribir nada.
- Migrar costaría rehacer 21 componentes y repetir toda la verificación sin ganar una sola funcionalidad visible.
Lo que sí necesita el brief (tipos, validación, catálogos) se resuelve con **Content Collections de Astro** (incluyen Zod y TypeScript, sin dependencia nueva).

### 1.2 Capa de datos declarativa (sin CMS)
Archivos JSON versionados en git, validados al compilar:

```
src/content.config.ts        esquemas Zod de cada colección
src/content/products/*.json  Reymen App, Reymen POS, AI Agents, Smart Cards
src/content/verticals/*.json restaurantes, realty, (clinicas, talleres…)
src/content/agents/*.json    catálogo comercial por nivel y categoría
src/content/capabilities/*.json  automatizaciones, CRM e Inbox, integraciones, loyalty
src/content/services/*.json  desarrollo, consultoría, agentes a medida, automatización a medida
src/content/integrations/*.json  operativas / en desarrollo / planeadas
```
Las páginas se generan con `getStaticPaths()` sobre estas colecciones; el diseño de cada una puede ser propio (ver §5).

### 1.3 Dos estados separados, y evidencia obligatoria
**Estado editorial de la página** (`publication`) — controla qué se compila y se indexa:

| Valor | Se compila | Aparece en nav/sitemap | Indexable |
|---|---|---|---|
| `draft` | no (404) | no | no |
| `unlisted` | sí | no | no (`noindex`) |
| `published` | sí | sí | sí |

**Disponibilidad real del producto o función** (`availability`) — controla el badge, el copy y los CTA: `DRAFT` · `COMING_SOON` · `BETA` · `LIVE`.

**Registro de evidencia** por función (anti-invención). Cada `feature` lleva `status` (`live` · `beta` · `planned` · `concept`) y `evidence`:
```ts
evidence: { code: string[];          // rutas/docs del repo que lo respaldan
            production: boolean }    // confirmado en producción por una persona del equipo
```
Reglas validadas en el build (el build **falla** si no se cumplen):
- `live` exige `code.length > 0` **y** `production: true`.
- `beta` exige `code.length > 0`.
- `planned` y `concept` no pueden usar verbos de disponibilidad en su texto (revisión manual en PR; la UI los marca «Próximamente» / «Concepto»).
- Una vertical `LIVE` no puede tener `features` sin evidencia.
Así «no inventar» deja de depender de mi memoria y queda como regla ejecutable.

### 1.4 Esquema de vertical (campos pedidos en el brief)
```ts
const vertical = z.object({
  id: z.string(), name: z.string(), route: z.string().startsWith("/"),
  description: z.string().max(160),
  publication: z.enum(["draft","unlisted","published"]),
  availability: z.enum(["DRAFT","COMING_SOON","BETA","LIVE"]),
  audience: z.string(),
  products: z.array(reference("products")),
  features: z.array(feature),           // con status + evidence
  benefits: z.array(z.string()),
  captures: z.array(capture),           // archivo, alt, fecha, "datos de demostración": true
  demos: z.array(z.enum(["story-steps","hero-stage","flow","agent-catalog"])),
  cta: z.object({ primary: cta, secondary: cta.optional() }),
  seo: z.object({ title: z.string().max(60), description: z.string().max(160), noindex: z.boolean().default(false) }),
  related: z.array(reference("verticals")).default([]),
});
```
`captures[].demo` obliga a la leyenda «Datos de demostración»; el validador rechaza una captura sin `alt`.

### 1.5 Internacionalización. [Decidir]
La web hoy es solo español; ReymenApp tiene es/en. Propongo **seguir en español** y dejar los textos de datos en un solo idioma. Añadir inglés después es un cambio estructural (rutas `/en`, `hreflang`, duplicar datos) que conviene hacer cuando haya demanda real, no antes.

### 1.6 Herramientas y dependencias (todas de desarrollo; nada llega al navegador). [Decidir]
| Dependencia | Para qué | Justificación |
|---|---|---|
| `typescript` + `@astrojs/check` | `npm run check`: typecheck de componentes y datos | Hoy no hay ninguna comprobación estática |
| `@playwright/test` + `@axe-core/playwright` | Pruebas de humo: rutas, navegación, formularios (API simulada), axe en 8 anchuras | Hoy mis verificaciones viven fuera del repo y se pierden |
Sin librería de UI, sin Tailwind, sin animación (todo CSS), sin CMS.

### 1.7 Seguridad del sitio (P0)
Añadir `Content-Security-Policy` y `Permissions-Policy` en `deploy/nginx.conf`; mantener las cabeceras actuales. CSP base: `default-src 'self'; script-src 'self' 'unsafe-inline' https://plausible.io; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self' https://app.reymen.mx https://plausible.io; frame-ancestors 'none'; base-uri 'self'; form-action 'self'`. (`'unsafe-inline'` por los scripts pequeños que Astro incrusta; se puede cambiar a hashes después.)

### 1.8 Separación de responsabilidades (se respeta)
| Capa | Hace | No hace |
|---|---|---|
| Web (este repo) | Marketing, catálogos públicos, captación (lead y chat), enlaces a `app.` y `pos.` | Administrar módulos, agentes, automatizaciones, tarjetas; ejecutar flujos |
| Reymen App | Autenticación, módulos contratados, agentes, automatizaciones, CRM, Inbox, Loyalty, consumo | — |
| Reymen POS | Operación de venta | — |
Las demostraciones del sitio son **presentaciones** con datos de demostración, no instancias de los productos. Ninguna ruta nueva llama a APIs nuevas: solo `/api/public/leads` y `/api/public/chat` existentes.

---

## 2. Navegación y mapa de rutas

### 2.1 Barra principal (escritorio)
```
Reymen.   Soluciones ▾   Productos ▾   Servicios   Seguridad        Entrar   [Agendar demo]

Soluciones ▾                         Productos ▾
 ├ Restaurantes            LIVE       Productos                    Capacidades
 ├ Realty                  BETA*       ├ Reymen App                 ├ Reymen AI Agents
 └ Otras industrias        →           ├ Reymen POS                 ├ Automatizaciones
   (clínicas, talleres…)               └ Smart Cards                ├ CRM e Inbox
                                                                    └ Integraciones
 * badge según availability en datos
```
- Cuatro enlaces de primer nivel + CTA: no se satura. «Empresa» del brief se reparte: **Seguridad** (enlace propio) y **Contacto** (CTA, pie de página y `/contacto`). **«Nosotros» queda fuera** hasta que exista contenido verificado (no invento equipo, historia ni cifras). [Decidir]
- Los desplegables usan el patrón de **disclosure** (botón con `aria-expanded`, no `role=menu`): funcionan con clic y teclado, `Esc` cierra y devuelve el foco, abren al pasar el cursor solo con puntero fino. Cada elemento lleva badge de estado generado desde los datos.
- Sin JS la barra sigue siendo una lista de enlaces navegables (los hubs `/productos` y `/soluciones` cubren los desplegables).

### 2.2 Móvil (experiencia propia, no el escritorio apilado)
- Pantalla completa con acordeones (`<details>`): Soluciones · Productos · Capacidades · Servicios · Seguridad. Áreas táctiles ≥ 48 px, un solo CTA fijo al final del panel («Agendar demo») y «Entrar».
- **Sin barra pegajosa inferior** (compite con el botón del chat). El botón del chat sigue ocultándose sobre hero, formularios y pie.

### 2.3 Mapa de rutas
| Ruta | Estado | Qué es | Prioridad |
|---|---|---|---|
| `/` | existe | Home corporativa (rehecha, §3) | P1 |
| `/restaurantes` | existe | Vertical LIVE; se mantiene y se amplía | P2 |
| `/productos` | nueva | Hub: 4 productos con estado y relación entre ellos; **Reymen App y Reymen POS viven aquí como secciones ancladas** hasta que tengan contenido para página propia (evita páginas delgadas) | P1 |
| `/ai-agents` | nueva | Reymen AI Agents (§4.1) | P2 |
| `/automatizaciones` | nueva | Modelo Evento → Condición → Acción → Resultado (§4.2) | P2 |
| `/smart-cards` | nueva | Limitada a lo verificado (§4.3) | P2 · bloqueada por información |
| `/realty` | nueva | `publication: draft` hasta activarse (§4.4) | P2 |
| `/servicios` | hoy sección de la home | Página con los 4 servicios | P2 |
| `/seguridad` | hoy sección de la home | Página con controles verificados | P2 |
| `/contacto` | hoy sección en cada página | Formulario con `?interes=`; reutiliza `LeadForm` | P1 |
| `/soluciones` | nueva, **condicional** | Solo si Realty se publica (con una sola vertical es redundante: bastaría el desplegable) | P1/P2 |
| `/privacidad`, `/gracias`, `/404` | existen | Sin cambios | — |
No se crean `/nosotros`, `/casos`, `/blog` ni páginas por industria sin contenido real.

### 2.4 Captación por intención (sin tocar la API)
`LeadForm` ya envía `vertical` y `source` (≤ 60 caracteres). Convención nueva: `source = web-<pagina>` y `vertical = <interés>` (`restaurantes`, `realty`, `ai-agents`, `automatizaciones`, `smart-cards`, `servicios`, `otra-industria`). `/contacto?interes=ai-agents` preselecciona. Los leads llegan al CRM con esa etiqueta.

CTA por estado:
| Disponibilidad | CTA principal | CTA secundario |
|---|---|---|
| `LIVE` producto | Agendar demo | Conocer el producto |
| `BETA` | Solicitar acceso | Ver qué incluye |
| `COMING_SOON` | Registrar interés | Conocer avances |
| Servicio | Cuéntanos tu proyecto | Solicitar diagnóstico |
«Registrar interés» **guarda un lead real** por el mismo endpoint; no existen formularios ficticios.

---

## 3. Home corporativa (propuesta de narrativa, 8 bloques)

Fusiono «Automatizaciones» con «Ecosistema conectado» y compacto «Por qué» y «Cómo trabajamos» dentro de Servicios, para no alargar la página (hoy: 10 bloques, ~7 250 px en escritorio).

```
┌ HERO ─────────────────────────────────────────────────────────────────────┐
│ Toda la tecnología que tu negocio necesita.      ┌── demo (HeroStage) ───┐ │
│ Un solo ecosistema.                              │ Inbox + Agente IA  ●  │ │
│ Software, agentes de IA y automatizaciones…      │ CRM · Automatización  │ │
│ [Agendar demo] [Ver el ecosistema]               │ POS · Loyalty         │ │
│ Conecta. Automatiza. Crece.                      └───────────────────────┘ │
├ QUÉ HACEMOS  3 capacidades (Software · Agentes de IA · Automatización) ───┤
├ PRODUCTOS PROPIOS  App · POS · AI Agents · Smart Cards  (badges de estado)┤
├ ECOSISTEMA CONECTADO  mapa + 4 recorridos (verificado/conceptual) ────────┤
│    └ mini diagrama Evento→Condición→Acción→Resultado → /automatizaciones  │
├ SOLUCIONES POR INDUSTRIA  Restaurantes · Realty · «cuéntanos la tuya» ────┤
├ SERVICIOS A LA MEDIDA  4 servicios + cómo trabajamos (3 pasos) ───────────┤
├ SEGURIDAD Y CONFIANZA  solo controles verificados → /seguridad ───────────┤
├ CONTACTO  formulario con interés preseleccionable ────────────────────────┤
└ FAQ breve (4–5) antes del contacto ───────────────────────────────────────┘
```

**Copy del hero. [Decidir]** Tu texto es el principal. Observación: «**Toda** la tecnología que tu negocio necesita» promete de más (no ofrecemos infraestructura, ciberseguridad, hardware…). Opciones:
- **A (tu versión):** «Toda la tecnología que tu negocio necesita. Un solo ecosistema.»
- **B (más defendible):** «Software, agentes de IA y automatización, conectados en un solo ecosistema.»
- **C (con tu lema):** «Conecta. Automatiza. Crece. Software, agentes de IA y automatizaciones para tu negocio en un solo ecosistema.»
Recomiendo **B** como H1 y **«Conecta. Automatiza. Crece.»** como línea de marca en hero y pie; si prefieres A, la mantengo.

**Qué problemas resuelve / por qué confiar / qué hacer:** subtítulo con el problema («menos trabajo manual, clientes mejor atendidos, operación conectada»), tres pruebas bajo el hero (productos propios que ya operan en restaurantes · datos aislados por negocio · tú controlas lo que hace la IA) y CTA único.

**Demo del hero:** hoy `HeroStage` cuenta una historia de restaurante (WhatsApp → IA → CRM → POS → Inventario → Lealtad). Para que no parezca solo de restaurantes la reordeno en dos actos con el mismo componente (datos, no código): **«Conversa y vende»** (Inbox + Agente IA → CRM → Automatización) y **«Opera»** (POS → Inventario → Lealtad). Requiere una captura nueva de Automatizaciones (§6).

---

## 4. Páginas nuevas (composición y alcance verificado)

### 4.1 `/ai-agents` — Reymen AI Agents
**Mensaje:** una línea de agentes que se administran desde Reymen App; hoy, agentes de conversación con control humano; mañana, agentes especializados y equipos.
```
HERO        «Agentes de IA que trabajan con tus reglas»  [Agendar demo]   (captura real: Inbox con borrador IA)
NIVEL 1     Agentes multicanal            DISPONIBLE hoy
            Canales como fichas con estado: Chat web (live) · WhatsApp (beta*) · Instagram/Messenger/Correo (planeado: conector)
            * hasta confirmar conector productivo
            Demo: conversación → borrador → «Usar respuesta» → escalamiento   (captura real, datos de demostración)
CONTROL     Rulebook · base de conocimiento · modos Apagado/Sugerir/Automático · presupuesto y tope · auditoría · deshacer
            → «Se administra en Reymen App» (captura de Agente IA y Consumo)
NIVEL 2     Agentes especializados        EN DESARROLLO (concepto)
            Catálogo filtrable por categoría. Cada ficha con estado:
            · Atención y ventas: atención de prospectos (beta: es el agente del Nivel 1) · calificación (concepto)…
            · Soporte: consulta de conocimiento (beta: Rulebook + KB)
            · Operaciones / Marketing / Análisis: concepto
            · Por industria: Restaurantes, Realty… (concepto)
NIVEL 3     Equipos de agentes            CONCEPTO
            Diagrama investigador → analista → ejecutor → supervisor, con etiqueta «Concepto: aún no es parte del producto»
A MEDIDA    «¿Necesitas un agente para otro proceso?» → /servicios (Desarrollo de agentes de IA)  [Cuéntanos tu proyecto]
FAQ         ¿Se equivoca? ¿Necesito POS? (no) ¿Dónde lo administro? (app.reymen.mx) ¿Cuánto consume?
```
Un cliente puede contratar AI Agents sin POS ni Loyalty (verificado); el texto lo dice. Sin Reymen Office, sin panel nuevo.

### 4.2 `/automatizaciones`
**Mensaje:** conectar procesos, datos y herramientas para quitar trabajo manual; con o sin IA.
```
HERO        «Que los procesos se muevan solos, con tus reglas»
MODELO      Evento → Condición → Acción → Resultado   (diagrama interactivo, nodos legibles, contraste ≥ 4.5:1)
            Cada paso con ejemplo REAL: «Se cierra una venta → cliente con consentimiento y sin aviso reciente
            → mensaje de segunda visita → ejecución registrada y atribuida»
BIBLIOTECA  9 flujos preparados (hoy de restaurante) con estado: ejecución, reintentos, grupo de control
            [Disponible: motor + 9 blueprints] [Entrega por WhatsApp/correo: según conector configurado]
CONTROL     Estados de ejecución · reintentos · consentimiento y enfriamiento · avisos internos · auditoría
OTRAS       Seguimiento de leads, formularios, sincronización, CRM: «a la medida» (servicio) vs «incluido»
INTEGRACIÓN n8n y webhooks firmados · API con llave (leads, citas, conversaciones, conocimiento) · estado por integración
CTA         Agendar demo · Cuéntanos tu proceso
```
Aclaración honesta en la página: **no hay constructor visual de flujos para clientes**; los flujos se configuran por Reymen. No se promete «arma tus propios flujos».

### 4.3 `/smart-cards`
**Bloqueo:** el panel vive en Reymen App (las rutas públicas `/n` y `/q` en `reymen-smartcard`). Verificado desde Reymen App: tarjetas con URL pública (`link.reymen.mx/q/<código>`) y **QR**, panel de estadísticas (escaneos, clics a WhatsApp, eventos por destino), equipo con invitaciones, edición de perfil, SSO desde Reymen App, **receptor** de contactos capturados en tarjeta hacia el CRM (el **emisor está pendiente**), y uso en Realty (enlace de propiedad con QR).
Hasta recibir material, la página se limita a eso (y se marca `unlisted` si queda corta). Necesito: capturas autorizadas (datos ficticios), tipos de tarjeta, qué se personaliza, si hay NFC físico, planes y límites. **No** se describirán como «tarjetas de presentación» ni se prometerá analítica o integraciones no vistas.

### 4.4 `/realty`
Estado confirmado: **v1 en `main` de ReymenApp, sin desplegar en producción**. Por eso la página queda en `publication: draft` (no se compila, no está en el menú ni en el sitemap) y su estructura se prepara para activarse con un cambio de datos. Composiciones previstas (solo la segunda aplica hoy):
- **BETA** (si está en producción para algún cliente): hero «Demanda, inventario y oportunidades en un mismo lugar»; qué hace v1 (propiedades con fotos, prospectos y qué buscan, matches con puntaje explicado, Market Pulse «demanda observada» con aviso de que no es dato de mercado externo, campañas manuales, visitas ligadas a Citas, landing pública por propiedad con QR/SmartCard); qué **no** es (no avalúo, no contratos, no Ads Manager); CTA «Solicitar acceso». Capturas reales con datos ficticios (a producir, §6).
- **COMING_SOON** (si no está desplegado): página breve `unlisted`/`noindex` con qué viene, para quién y «Registrar interés» (lead real, `vertical=realty`).
En ambos casos: sin funciones futuras presentadas como disponibles, sin cifras. No se crea ni se toca nada del módulo.

### 4.5 `/productos`
Hub con 4 tarjetas (`ProductCard`: nombre, una línea, badge, administración «Se administra en Reymen App» / «Independiente», enlace) y bajo ellas el **mapa del ecosistema**. Secciones ancladas para Reymen App (lo que incluye cada módulo y su estado) y Reymen POS (restaurantes y cafeterías, offline, KDS, cobro; enlaza a `/restaurantes`). Distingue claramente **productos contratables por separado** (POS; AI Agents) de **módulos de Reymen App** (CRM, Inbox, Automatizaciones, Loyalty, Foods, Smart Cards-puente, Realty).

### 4.6 Mapa del ecosistema (componente `EcosystemMap`)
Nodos: Smart Cards · Formulario web · Chat/WhatsApp · Reymen POS → **Reymen App** (CRM · Inbox · Loyalty · Automatizaciones · AI Agents). Cada **arista lleva estado** (línea continua = verificada; discontinua = conceptual/pendiente) y al activar un recorrido se ilumina y explica:

| Recorrido | Estado | Evidencia |
|---|---|---|
| POS → venta → Loyalty (visita/sello) → cliente en el CRM | **Verificado** | `LOYALTY_INTEGRACION.md`, webhooks del POS |
| Formulario → lead → CRM → aviso al equipo | **Verificado** | `/api/public/leads` |
| Agente IA → Rulebook/KB → borrador → persona envía → acción en pipeline con deshacer | **Verificado** | `INBOX-IA.md` |
| Venta/inventario → alerta de insumo bajo → aviso interno | **Verificado** (entrega según conector) | blueprint `inventory-low-alert` |
| Smart Card → contacto → CRM | **Parcial**: receptor listo, emisor pendiente | `smartcard/CRM-LEADS.md` |
| Agente IA → acción autorizada → automatización → supervisión | **Concepto** | sin integración verificada |
Contraste alto, un recorrido a la vez, tarjetas de lectura debajo del diagrama (también en móvil, donde el diagrama es vertical).

---

## 5. Sistema visual, componentes y multivertical

**Mismo ADN, composiciones propias.** Tokens (`tokens.css`), tipografía Archivo, `Section`, `Button`, `Glyph`, `Traces` y sombras comunes. Cada vertical/producto elige un **layout** declarado en datos entre: `story` (recorrido por pasos, como restaurantes), `showcase` (colección de capturas con foco), `explainer` (diagrama + texto, como automatizaciones) y `catalog` (fichas filtrables, como agentes). Color de acento por dominio: azul = plataforma/IA, naranja = restaurante (ya existe), y un acento por vertical nueva definido en `tokens.css` (p. ej. Realty), nunca valores sueltos en componentes.

| Reutilizar | Evolucionar | Nuevo |
|---|---|---|
| `Section`, `Button`, `Faq`, `FeatureList`, `Timeline`, `StorySteps`, `Device`, `Traces`, `Wordmark`, `Footer`, `LeadForm`, `ContactSection`, `ChatWidget` | `Header` → `NavMenu` (desplegables); `HeroStage` (pasos desde datos); `ServicesCanvas` → `FlowDiagram` (nodos/aristas desde datos con estado); `EcosystemShowcase` → colección genérica; `Glyph` (+ Smart Cards, CRM, Inbox, Loyalty, Realty) | `StatusBadge`, `ProductCard`, `VerticalLayout`, `EcosystemMap`, `AgentCatalog`, `InterestForm` (wrapper), `JsonLd`, `Breadcrumbs` |
| | | **Eliminar:** `CtaGroup`, `Window`, `legacy-index.html` |

**Cómo se agrega una vertical sin reconstruir:** un `verticals/<id>.json` + capturas; la ruta, el sitemap, el menú, el badge y los CTA salen solos; si necesita una composición distinta, se añade un componente y se referencia en `layout`.

---

## 6. Capturas y demostraciones
- Siguen siendo **reales con datos ficticios** (nunca datos de clientes). Las de Reymen App hoy están a 1500 px (blandas a doble densidad): se **recapturan a 2×**.
- Capturas nuevas necesarias: Automatizaciones (actividad y ejecuciones), Agente IA (modos por canal, Rulebook, Probador, Consumo), Realty (propiedades, matches, mercado), Admin no (interno).
- **Requisito:** sembrar una organización de demostración en un entorno **local** (como hice con Café Norte). No toca producción. [Decidir]
- Smart Cards: dependen de acceso o material tuyo.
- Demos conceptuales llevan marca visible «Concepto»; las reales, «Datos de demostración».

## 7. Estrategia responsive
Anchuras de verificación: **320, 375, 390, 430, 768, 1024, 1440, 1920**. Reglas:
- Tipografía fluida existente (`--step-*`), `h1` 26–48 px; en 1920 el contenedor crece de 76 rem a ~84 rem y el hero se compone con el bloom, sin estirar texto.
- Botones en fila por consulta de contenedor (ya implementado) y áreas táctiles ≥ 44 px.
- Móvil con composiciones propias: menú en acordeón, demos con recortes enfocados, tablas → tarjetas, diagramas en vertical, un solo elemento flotante (chat) que se oculta donde estorba.
- Animación: solo transform/opacity, `prefers-reduced-motion` respetado, nada de efectos que bloqueen el primer pintado.

## 8. Estrategia SEO
- **Metadatos por datos:** `title` ≤ 60, `description` ≤ 160, canonical, Open Graph y Twitter desde cada archivo; `og:image` por página en P3.
- **Sitemap generado** desde las colecciones (`publication: published`); `robots.txt` intacto; `noindex` automático para `unlisted` y `COMING_SOON` sin contenido sustancial.
- **Datos estructurados:** `Organization` (home), `SoftwareApplication` solo para productos `LIVE`/`BETA` y **sin precio ni valoraciones**, `Service` para servicios, `FAQPage` solo con preguntas visibles, `BreadcrumbList`.
- **Estructura:** un `h1` por página, jerarquía continua, enlaces internos por relaciones declaradas (hub → página → productos relacionados), anclas estables.
- **Sin contenido duplicado:** las capacidades (agentes, automatizaciones) y las verticales (restaurantes, realty) tienen intención distinta; `/productos` resume y enlaza, no copia.
- **Páginas futuras:** `draft` hasta tener contenido real; `unlisted` si se comparten por invitación; `published` solo cuando superen la regla de evidencia.
- Palabras clave: no he hecho investigación con datos de búsqueda; los textos parten de la intención comercial (software y punto de venta para restaurantes en México, agentes de IA, automatización de procesos). Se puede afinar con Search Console cuando pongas el código.

## 9. Conversión
Un CTA primario por pantalla; el formulario nunca dice «enviado» sin respuesta 200; estados de carga (`aria-busy`), error por campo y mensaje claro para 429; `/gracias` con `noindex`; «Registrar interés» = lead real. Calendly y WhatsApp siguen vacíos en `config.ts`: hasta que los tengas, «Agendar demo» lleva al formulario (ya funciona así).

## 10. Decisiones que necesito de ti
1. **Astro vs Next.js** (§1.1). Recomiendo conservar Astro.
2. **Estado real de Realty:** ¿desplegado en producción para algún cliente (BETA) o aún no (COMING_SOON)?
3. **Smart Cards:** ¿me das acceso a `reymen-smartcard` o material (capturas con datos ficticios, tipos de tarjeta, NFC, planes)?
4. **Reymen Office:** confirmo que **no** aparece en la web (no lo encontré en App ni POS; `AI-Headquarters` está fuera de alcance).
5. **Copy:** H1 A/B/C (§3) y los ajustes de la matriz de afirmaciones (WhatsApp «al instante», recordatorios en «Clínicas», «cifradas»). ¿Está el conector de WhatsApp en producción con credenciales reales?
6. **Navegación:** agrupación de §2.1 y omitir «Nosotros» por ahora.
7. **i18n:** seguir solo en español.
8. **Dependencias de desarrollo** (§1.6): TypeScript + `@astrojs/check`, Playwright + axe.
9. **Capturas:** permiso para sembrar datos de demostración **locales** y recapturar a 2×.
10. **Orden de ejecución:** propongo P0 → P1 → P2 (§ roadmap). Dime si alguna página debe adelantarse.
