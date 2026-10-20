# Reymen Solutions · Entregable 1 — Auditoría

> **Actualización 2026-10-20 (confirmada por el equipo):** Reymen Realty tiene implementación v1 en `main` de Reymen App, pero **no está desplegado en producción**. En la web: no se anuncia como disponible ni como beta pública, no se enlaza ninguna función inmobiliaria, y `/realty` se prepara en estado de borrador o «próximamente» con una arquitectura que permita activarla después sin rehacerla. Se distinguen cuatro niveles: implementación en código · pruebas · despliegue · disponibilidad comercial. La integración de WhatsApp será **Twilio** (ver `04-whatsapp-twilio.md`; no hay rastro de Twilio en los repos). Solo está aprobado el bloque **P0**.


Fecha: 2026-10-20 · Alcance: repos `Reymen-Web` (main `6f70d37`), `ReymenApp` (main `3d2a6ab`), `ReymenPOS` (main `b3d1fd8`).
Método: lectura de código, esquema Prisma, documentación y pruebas de los tres repos, más mediciones sobre la web ya construida.
**No se tocó código.** No se pudo verificar nada de producción (qué está desplegado, qué conectores de n8n tienen credenciales reales).
No fueron accesibles en esta sesión: `reymen-smartcard` (no está en el listado de repos) ni `AI-Headquarters` (existe, fuera del alcance de la sesión).

Leyenda de evidencia: **V** = verificado en código/pruebas · **D** = solo documentado · **N** = no verificable desde los repos.

---

## 0. Cuatro hallazgos que cambian el plan

| # | Hallazgo | Consecuencia |
|---|---|---|
| 1 | **La web no es Next.js/React/TypeScript.** Es Astro 5.14.1 estático, sin framework de UI, una sola dependencia (fuente), servida por nginx. | El brief asume Next.js. Propongo **conservar Astro** (ver Arquitectura §1). Necesita tu decisión. |
| 2 | **Realty ya existe como módulo v1 en ReymenApp** (`/portal/realty`, enum `REALTY`, 12 tablas, landing pública `/p/<slug>`, matches, campañas, visitas; PRs #114, #117, #118 en `main`). | El brief lo trata como futuro. No hay que crearlo y no lo haré, pero la web puede presentarlo como **BETA** si confirmas que está desplegado. Si no, `COMING_SOON`. |
| 3 | **Smart Cards es un producto aparte** (`reymen-smartcard`, Supabase, `link.reymen.mx`, ops en otro dominio) unido a Reymen App por SSO y lectura directa de su base. El módulo `NFC_QR` en App es un puente y un panel de estadísticas, no el producto completo. | No se puede describir el producto sin ver su repo. La página `/smart-cards` se limita a lo verificado hasta que tenga acceso o material. |
| 4 | **«Reymen Office» no aparece en ReymenApp ni en ReymenPOS.** | La web no lo mencionará. Queda como regla explícita en el catálogo (`public: false`). |

Además: un «agente de IA» en Reymen App **es un canal del inbox en modo Sugerir o Automático** (con Rulebook, base de conocimiento, borradores, presupuesto y tope por plan). **No existe un catálogo de agentes especializados ni orquestación multiagente.** Los niveles 2 y 3 del brief son visión, no producto.

---

## 1. Web actual (Reymen-Web)

### 1.1 Stack y estructura
- Astro 5.14.1, `output: static`, `trailingSlash: never`, `build.format: file`. Dependencias: `astro`, `@fontsource-variable/archivo`. Sin React, sin TypeScript en componentes (solo `config.ts` y `sitemap.xml.ts`), sin Tailwind, sin i18n.
- Sin lint, sin typecheck (`astro check` no instalado), sin pruebas automatizadas. Las verificaciones que hicimos (axe, Lighthouse, Playwright) viven fuera del repo.
- Despliegue: Docker + nginx detrás de nginx-proxy; `deploy/update.sh`. Cabeceras: `X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy`. **Falta** `Content-Security-Policy` y `Permissions-Policy`.
- 21 componentes (1 736 líneas en `.astro`), 5 páginas + `sitemap.xml` + `robots.txt`.

### 1.2 Rutas actuales
| Ruta | Contenido | En sitemap | Indexable |
|---|---|---|---|
| `/` | Home corporativa (hero, ecosistema, servicios, soluciones, proceso, por qué, seguridad, FAQ, contacto) | sí | sí |
| `/restaurantes` | Hero, recorrido «El turno» (7 pasos), funciones, FAQ, contacto | sí | sí |
| `/privacidad` | Aviso de privacidad | sí | sí |
| `/gracias` | Confirmación del formulario | no | no (`noindex`) |
| `/404` | Error | no | n/a |
| `/sitemap.xml` | 3 URL fijas escritas a mano | — | — |

Contacto y seguridad existen solo como **secciones** de la home (`#contacto`, `#seguridad`, `#servicios`, `#soluciones`).

### 1.3 Componentes y reutilización
| Componente | Estado | Reutilizable para el plan |
|---|---|---|
| `Section`, `Button`, `Faq`, `FeatureList`, `Timeline`, `Wordmark`, `Footer`, `Header` | en uso | Base de todo; `Header` hay que evolucionarlo (menús). |
| `HeroStage` (demo de 6 pasos con capturas reales) | en uso | Patrón para demos de producto. |
| `StorySteps`, `Device` | en uso | Narrativas por vertical y producto. |
| `ServicesCanvas` (diagrama SVG con 3 enfoques) | en uso | **Base del diagrama Evento → Condición → Acción → Resultado** y del mapa de ecosistema. |
| `EcosystemShowcase` | en uso | Se generaliza a «colección de capturas de un producto». |
| `Glyph`, `Traces` | en uso | Recursos gráficos propios; faltan glifos de Smart Cards, CRM, Inbox, Loyalty. |
| `LeadForm`, `ContactSection`, `ChatWidget` | en uso | Intactos; ver §1.5. |
| `Plans` | oculto por flag `showPrices` | Conservar. |
| `CtaGroup`, `Window` | **sin uso** | Candidatos a eliminar. |
| `legacy-index.html` (raíz) | **sin uso**, sitio antiguo con Tailwind CDN | Eliminar o archivar fuera de la raíz. |

**Duplicación detectada:** el contenido comercial vive dentro de cada página (`solutions`, `process`, `why`, `trust`, `faq`, `story`, `items` son arreglos locales). Agregar una vertical o un producto hoy implica copiar una página. No hay capa de datos.

### 1.4 Rendimiento, accesibilidad, SEO (medido sobre `main`)
| Medida | Resultado |
|---|---|
| Lighthouse móvil `/` | rendimiento 98 · accesibilidad 100 · SEO 100 · mejores prácticas 96 · CLS 0 |
| Lighthouse móvil `/restaurantes` | 98 · 100 · 100 · 96 · CLS 0 |
| Lighthouse escritorio | 100 · 100 · 100 · 96 |
| axe-core | 0 violaciones en `/`, `/restaurantes`, `/privacidad`, `/gracias`, `/404` y en tableta/móvil |
| Desbordamiento horizontal | ninguno de 320 a 1920 px |
| Peso de capturas | 36–123 KB por imagen (webp) |

Mejores prácticas 96 = un error de consola por el script de Plausible bloqueado en local (no ocurre en producción).

SEO existente: `canonical`, Open Graph y Twitter, JSON-LD `Organization` y `FAQPage`, `robots.txt`, `sitemap.xml`. Faltan: sitemap generado desde datos, `hreflang` (no aplica sin i18n), JSON-LD de `Product`/`SoftwareApplication`/`Service`, `BreadcrumbList`, `noindex` condicionado por estado.

### 1.5 Formularios e integraciones
- `LeadForm` → `POST app.reymen.mx/api/public/leads`. Contrato verificado: `name`, `contact`, `business?`, `vertical?` (≤ 60), `message?`, `consent: true`, `website` (trampa), `source?` (≤ 60). Origen permitido por CORS, 5 envíos/h por IP, el lead cae en la organización `reymen-solutions` con consentimiento y versión del aviso, y se avisa por correo. **`vertical` y `source` ya sirven para distinguir interés por producto o vertical sin tocar la API.**
- `ChatWidget` → `POST /api/public/chat` (canal `webchat`), 20 por 10 min por IP, 15 por hora y 20 por sesión; si la IA duda, se agota el presupuesto o pide una persona, escala (`handoff`).
- La web **solo** muestra «Enviado» tras respuesta 200 del servidor (V, `LeadForm`). Errores 400/429 tienen mensaje propio.
- Pendientes de configuración (tuyos): Calendly, WhatsApp de ventas, Search Console, domicilio legal, sitio en Plausible.

### 1.6 Riesgos de la web actual
1. **Copy sin respaldo trazable.** No existe un registro de qué afirmación está verificada. Ver matriz §4.
2. **Una sola vertical con página** y las demás como filas que llevan a un formulario: «Clínicas y servicios» promete «recordatorios por WhatsApp» (ver §4, riesgo medio).
3. **Navegación de un nivel con anclas**: no escala a 4 productos + 3 capacidades + verticales.
4. **Sin CSP.** Hay un script externo (Plausible) y estilos en línea.
5. **Sin pruebas ni typecheck en el repo.** Cualquier refactor depende de mi verificación manual.
6. **Sitemap manual** (3 URL): olvidar una página nueva = no indexada.

---

## 2. Reymen App (ReymenApp) — qué existe de verdad

Next.js + Prisma + PostgreSQL, multi-tenant por aislamiento en la capa de aplicación (`organizationId` en cada consulta; **sin RLS**, decisión documentada en `docs/realty.md`).

### 2.1 Módulos comerciales (`PlatformModule`)
| Módulo (enum) | Nombre en App | Estado verificado | Evidencia |
|---|---|---|---|
| `CRM` | CRM | **Operativo.** Hoy, Inbox, Leads, Pipeline Kanban, citas, campos y etapas configurables, panel de detalle con línea de tiempo | rutas `/portal/{today,inbox,leads,pipeline,appointments}`, `docs/crm/*` |
| `AI_WHATSAPP` | Agente IA | **Operativo (conversacional).** Modo por canal Apagado/Sugerir/Automático, Rulebook + base de conocimiento, borrador editable, probador (AI Lab), consumo y presupuesto, tope de agentes por plan | `docs/crm/INBOX-IA.md`, `agent-mode.ts`, `agent-cap.ts`, `ai/gateway.ts` |
| `AUTOMATIONS` | Automatizaciones | **Operativo (motor + 9 blueprints).** Ver §2.3 | `src/lib/automation/*`, `docs/automations/*` |
| `NFC_QR` | Smart Cards NFC/QR | **Puente.** Panel de estadísticas, equipo, QR e invitaciones leyendo la base del producto SmartCard; SSO de 60 s. El producto completo está en otro repo | `docs/DOCUMENTACION_TECNICA.md` §12, `smartcard-sso.ts`, `smartcard-company.ts` |
| `FOOD_OPS` | Reymen Foods | **Operativo.** Inventario con recetas, proveedores, compras, ventas, rentabilidad, reportes, pedidos de reparto (contrato de webhook) | `src/lib/food*.ts` |
| `REYMEN_POS` | Reymen POS | **Operativo.** Bloquea la captura manual de ventas (llegan por webhook). Requiere `FOOD_OPS` | `modules.ts` |
| `LOYALTY` | Reymen Loyalty | **Operativo.** Sellos por visita, meta configurable, recompensas descriptivas, versiones de programa, registro público con QR, canje, estadísticas por código postal. **No hay** puntos, niveles ni caducidad (el propio doc lo dice) | `docs/LOYALTY_INTEGRACION.md` |
| `REALTY` | REYMEN Ops Realty | **v1 en `main`.** Propiedades, prospectos, matches (puntaje v1), Market Pulse, oportunidades, campañas manuales, visitas ligadas a Citas, landing pública `/p/<slug>`, QR/SmartCard. Reglas sin IA | `docs/realty.md`, `src/lib/realty/*` |
| `MARKETING_ADS` | Marketing / Ads | **Reservado.** Sin esquema ni UI | comentario en `schema.prisma` |

Independencia de contratación (V): solo `REYMEN_POS` exige `FOOD_OPS`. **Un cliente puede tener Agente IA sin POS ni Loyalty.** Matiz: el inbox y el pipeline con IA «respetan el módulo CRM»: para ver conversaciones y crear contactos conviene `CRM` + `AI_WHATSAPP`.

### 2.2 Agentes de IA (hallazgo central)
- **Definición real:** un «agente» = un canal del inbox (WhatsApp, Instagram, Messenger, chat web, correo, consultas) en modo Sugerir o Automático. El pipeline con IA no cuenta como agente.
- **Control y supervisión (V):** Rulebook, base de conocimiento, borradores que una persona envía, escalamiento a persona, deshacer en acciones de pipeline, bitácora de auditoría, presupuesto duro por cliente (`BUDGET_EXHAUSTED` pausa el agente), tope de agentes por plan (1/3/5), portal «Mi consumo de IA», Admin → IA y Consumo.
- **Modelo:** Claude vía la app (`AI_DRAFT_MODEL`).
- **Canales (D/N):** webchat es nativo (`/api/public/chat`). WhatsApp, Instagram, Messenger y correo entran y salen por **conectores en n8n** (fuera del repo). Los flujos incluidos (`reymen-action-message`, `reymen-action-notify`) tienen **proveedores ficticios**: «el nodo marca todo como enviado sin mandar nada» hasta conectar credenciales. Instagram, Messenger y correo requieren credenciales y, en Meta, revisión de la app.
- **No existen:** catálogo de agentes por función (ventas, marketing, operaciones, análisis, soporte), agentes por industria como producto, herramientas/acciones autorizadas fuera de lo anterior, orquestación entre agentes. Clasificación: **conceptual**.

### 2.3 Automatizaciones
- **Motor (V):** bus de eventos de dominio (`DomainEvent`) + reloj/detectores → política (consentimiento, enfriamiento, solapamiento) → despachador → n8n genérico → callback firmado → estado de ejecución (`PENDING`, `SUCCEEDED`, `FAILED`, `SKIPPED`), reintentos con espera creciente, atribución conservadora con grupo de control, configuración por cliente en Admin, reintento manual.
- **9 blueprints (V):** cumpleaños, recuperación de cliente, reporte ejecutivo diario, alerta de inventario bajo, recompensa de lealtad desbloqueada, retroalimentación post-visita, segunda visita, alerta de cliente VIP y bienvenida a cliente nuevo.
- **Matiz comercial:** los blueprints actuales son **de restaurante** (clientes del POS, lealtad, inventario). El modelo Evento → Condición → Acción → Resultado es real y genérico, pero **no hay un constructor de flujos visual** ni triggers por formulario/CRM expuestos al cliente como producto. Fuera de blueprints: plantillas n8n genéricas configurables por cliente (solo admin).
- **Entrega real (N):** depende de credenciales en n8n; en el repo el proveedor es ficticio.

### 2.4 Integraciones
| Integración | Estado | Notas |
|---|---|---|
| Reymen POS ↔ App | **Operativa (V)** | Webhooks firmados `order.paid`, `order.cancelled`, `kitchen.ticket_ready`, `shift.closed`; idempotencia; catálogo versionado |
| n8n (mensajes y avisos) | **Contrato operativo, proveedor por conectar** | HMAC, idempotencia, callback |
| Stripe (cobro de suscripción) | **Operativa (V)** | Cobro mensual, avisos de vencimiento |
| SmartCard | **Puente (V)** | SSO + lectura directa de Supabase; receptor de leads de tarjetas listo, **emisor no implementado** (otro repo) |
| Reparto (Uber Eats, Rappi, DiDi) | **Contrato de webhook (V)** | La app recibe un formato normalizado; **no hay conexión directa** con las plataformas: la traduce un integrador o n8n |
| API pública `/api/v1` | **Operativa (V)** | Con llave: leads, citas, conversaciones, base de conocimiento, menú |
| Canales Meta/correo | **Planeados vía n8n** | Requieren credenciales de cada negocio |
| «Cualquier otro POS» | **Contrato neutral documentado (D)** | Sin integración con POS de terceros construida |

Regla para la web: **no usar logotipos** de Uber Eats, Rappi, DiDi, Meta, WhatsApp, Stripe ni n8n como señal de compatibilidad. Texto plano y estado.

### 2.5 Seguridad verificable (para la sección de confianza)
V: aislamiento por organización en la aplicación (con pruebas de cruce de tenant), permisos por rol (RBAC), bitácora de auditoría, MFA (AUD-005 corregido), suspensión de cuentas, límites de tasa en endpoints públicos, firmas HMAC en webhooks, presupuesto de IA por cliente, respaldo diario del Postgres con rotación de 14 días, copia fuera del VPS **si `BACKUP_REMOTE` está configurado (N)**, prueba de restauración mensual (script; ejecución real N).
No decir: certificaciones, SOC 2, ISO, «cifrado de extremo a extremo», «RLS», «alta disponibilidad».

---

## 3. Reymen POS (ReymenPOS)
- PWA offline-first (IndexedDB), enrolamiento de dispositivo por código, PIN, mesas y cuentas abiertas, cocina/barra (KDS) por estación con retrasos, cobro con propina y cuentas divididas, corte de caja, impresión (navegador + plugin Epson USB en Android), canje de regalos de Loyalty verificado por caja (PR #47/#48 recientes).
- Principios del contrato: catálogo local, snapshot de precio, ventas como eventos idempotentes, llave de solo lectura en el dispositivo (V, `docs/integration.md`).
- Estado: producto operativo; **vertical probada: restaurantes y cafeterías**. No hay evidencia de uso en otros comercios: la web debe decir «para restaurantes y cafeterías», no «para cualquier comercio».

---

## 4. Matriz de afirmaciones de la web actual

| Afirmación en la web | Veredicto | Acción propuesta |
|---|---|---|
| POS «sigue cobrando sin internet» | V | Mantener |
| Mesas, cocina y barra, cobro dividido, corte de caja | V | Mantener |
| Imprime tickets desde navegador y en impresoras compatibles con Android | V (plugin Epson USB) | Mantener, «impresoras compatibles» |
| Inventario con recetas, costo por platillo, alerta de stock bajo | V | Mantener |
| Lealtad con sellos y recompensas; «tarjeta digital» | V | Mantener; no sugerir puntos/niveles |
| «Cumpleaños y avisos automáticos para que vuelvan» | V el motor, **N el envío real** | Cambiar a «preparado para» o confirmar proveedor activo |
| «WhatsApp con IA… contestados al instante» | **N** (conector n8n con credenciales reales no verificable) | Confirmar conector en producción antes de afirmar «al instante» |
| Chat del sitio responde con IA y pasa a persona | V (webchat nativo) | Mantener |
| Pedidos de reparto «pueden entrar a tu operación» | V el contrato, sin conexión directa | Mantener lo actual (ya dice «revisamos el detalle»); estado «vía integrador» |
| «Clínicas y servicios: citas, recordatorios y seguimiento por WhatsApp» | Citas V; recordatorio por WhatsApp **N** | Reformular: «Citas y seguimiento» hasta confirmar el envío |
| «Inmobiliarias: fichas públicas de cada propiedad y captura de prospectos» | V en código (Realty v1); despliegue N | Mantener si confirmas que está en producción |
| «Copias diarias cifradas fuera del servidor y pruebas de restauración» | D: existen scripts; **cifrado y copia remota N** | Verificar con operaciones antes de mantener «cifradas» |
| «Cada negocio aislado; cada persona ve lo que su rol permite» | V | Mantener |
| «El agente pasa a una persona cuando algo es delicado» | V (modos y escalamiento) | Mantener |
| «Tope de consumo por negocio» | V (presupuesto duro) | Mantener |

---

## 5. Oportunidades
1. **Capa de datos declarativa** (productos, verticales, agentes, capacidades) para que una página nueva sea un archivo de datos y no una copia de componentes.
2. **Registro de evidencia por funcionalidad** con estado (`live`, `beta`, `planned`, `concept`) y obligación de citar el origen: es el mecanismo contra afirmar de más.
3. **Diagrama de ecosistema y de flujo** generalizando `ServicesCanvas`, con estados por nodo (verificado / conceptual).
4. **Realty** ya tiene sustancia para una página honesta (BETA o próximamente).
5. **Páginas de capacidad** (`/ai-agents`, `/automatizaciones`) con el nivel de detalle que el motor real sí soporta.
6. **Captación por interés**: `source` y `vertical` del formulario ya distinguen intención sin cambiar la API.
7. Endurecer: CSP, Permissions-Policy, sitemap generado, typecheck y una suite mínima de pruebas en el repo.

## 6. Qué no se debe hacer (confirmado por la auditoría)
- No presentar agentes por categoría como funcionalidades: no existen.
- No presentar orquestación multiagente.
- No crear un panel de agentes en la web ni en otro lado: la administración vive en Reymen App (módulo `AI_WHATSAPP`).
- No describir Smart Cards como «solo tarjetas de presentación» ni como un producto con funciones que no pude ver.
- No mencionar Reymen Office.
- No usar logotipos de terceros.
