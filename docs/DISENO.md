# Sistema de diseño de Reymen Web

## Dirección
- **Sujeto:** plataforma de punto de venta, lealtad y asistentes de IA para negocios locales de México (hoy, restaurantes y cafeterías). Quien lee es dueño u operador, no desarrollador. Meta de la página: que agende una demo o deje sus datos.
- **Tono visual:** claro, frío y preciso. Fondo «papel» azulado, tinta azul marino y una banda oscura para el cierre. Nada de crema con serif, nada de negro con acento ácido.
- **Una sola jugada memorable:** la secuencia del hero (`FlowSequence`), una operación completa de punta a punta. El resto es sobrio.
- **El punto:** el punto del logotipo («R.») cierra los titulares, en azul. **Color = producto**: azul para plataforma e IA, naranja para operación del restaurante (como el punto del logo de Reymen POS).

## Tokens (`src/styles/tokens.css`)
| Rol | Valor |
|---|---|
| Tinta | `#0a1633` |
| Papel | `#f5f7fc` |
| Azul Reymen | `#1b47f5` (texto: `#1234c4`) |
| Noche (bandas oscuras) | `#060e2b` |
| Naranja operación | `#ff6a13` (texto: `#b34100`) |
| Líneas | `#dbe3f3` |

- **Tipografía:** Archivo Variable, autoalojada. Titulares en ancho 108–116 % (eco del logotipo), texto en 100 %. Escala fluida de 6 pasos (`--step--1` a `--step-5`).
- **Radios por jerarquía:** 6 px campos, 10 px botones, 16 px ventanas de producto. Sombra solo en ventanas.
- **Movimiento:** solo `transform` y `opacity`; todo se apaga con `prefers-reduced-motion`.

## Componentes (`src/components/`)
`Wordmark`, `Button`, `CtaGroup`, `Section` (tonos paper, white, night), `Window` (captura real), `ProductExplorer` (tablist accesible con enlace directo `/#producto-<id>`), `FlowSequence`, `FeatureList`, `Faq`, `LeadForm`, `ContactSection`, `ChatWidget`, `Plans` (oculto), `Header`, `Footer`.

## Reglas de contenido
Español de México, tuteo, sentido de oración, verbos activos. Sin cifras que no podamos respaldar. Sin etiquetas en mayúsculas, sin flechas «→» en enlaces, sin tarjetas idénticas.

## Calidad (revisada el 20 de octubre de 2026)
axe: 0 violaciones en todas las páginas, escritorio y móvil. Lighthouse móvil: rendimiento 99, accesibilidad 100, SEO 100, mejores prácticas 96 (la analítica externa no carga en el entorno de prueba). CLS 0.

---

# Iteración 2 · Luz sobre plano de operación (20 de octubre de 2026)

## Auditoría de la versión 1: las cinco mayores oportunidades
1. **Hero plano.** Una lista de eventos en una tarjeta oscura: no se sentía como producto.
2. **Lienzo sin atmósfera.** Todo en papel blanco; la luz y el azul eléctrico del logotipo casi no aparecían.
3. **Producto escondido.** POS y Reymen App salían pequeños y en marcos planos; el POS ni salía.
4. **Narrativa repetida.** Casi todas las secciones eran «título y lista con filetes».
5. **Estático y móvil heredado.** Poco movimiento con propósito, y el chat flotante tapaba contenido en móvil.

## Dirección
Empezar en **noche profunda** (donde vive el logotipo) con una **fuente de luz azul eléctrica detrás del producto**, y pasar a **papel claro** cuando hay que leer. El producto real es el protagonista: capturas auténticas con marcos de dispositivo y capas con profundidad. El sitio se organiza como **empresa tecnológica**: la portada presenta a Reymen Solutions (software, automatización y agentes de IA a la medida) y el **ecosistema para restaurantes** vive en su propia página, para que la marca pueda crecer a otros giros sin rehacer su identidad.

## Arquitectura de contenido
- `/` Empresa: hero con demostración conectada → ecosistema (línea de producto) → servicios a la medida (diagrama interactivo) → giros → proceso → por qué Reymen → seguridad → preguntas → contacto.
- `/restaurantes` Ecosistema: hero con el POS → «Un turno en tu restaurante» (narrativa con dispositivo fijo) → lo que resuelve → preguntas → contacto.
- Nuevos giros: se agregan como filas en «Una plataforma, varios giros» y, cuando valga la pena, como página propia con los mismos componentes.

## Piezas nuevas (`src/components/`)
- `HeroStage`: demostración conectada WhatsApp → Agente IA → CRM → POS → Inventario → Lealtad, con pantallas reales, teléfono, hilo de luz, pausa y navegación por etapa.
- `EcosystemShowcase`: composición en capas (POS al frente, Reymen App detrás).
- `ServicesCanvas`: capacidades a la medida y un diagrama que se ilumina según la elegida (dos disposiciones: horizontal y vertical).
- `StorySteps`: narrativa «El turno» con dispositivo fijo (escritorio) o imágenes por paso (móvil).
- `Timeline`, `Device`, `Section`, `FeatureList`, `ContactSection`.

## Movimiento (solo `transform` y `opacity`; todo respeta `prefers-reduced-motion`)
Una secuencia orquestada en el hero (autoplay con pausa, y que se detiene fuera de pantalla), cambio de pantallas en la narrativa y el diagrama, línea del proceso que se dibuja una vez, capas del ecosistema que se separan con el puntero, y microinteracciones en botones, filas y formulario. Sin animaciones de entrada decorativas en cada sección.

## Móvil
Orden propio del hero (titular, texto, botones, demostración y después los datos de apoyo), demostración recompuesta, menú oscuro sobre el hero, diagrama vertical, botones de ancho completo y chat flotante reducido a un ícono que se oculta sobre el hero, el contacto y el pie.

## Capturas
Las de Reymen App y Reymen POS son reales, con datos de demostración (negocio ficticio «Café Norte»), tomadas con el POS enlazado a una copia local de ReymenApp.

## Calidad (revisada)
axe: 0 violaciones en escritorio, tableta y móvil, y con movimiento reducido. Lighthouse: rendimiento 99 a 100, accesibilidad 100, SEO 100, mejores prácticas 96 (solo el error de consola de la analítica externa, que no carga en el entorno de prueba), CLS 0 y TBT 0 ms.
