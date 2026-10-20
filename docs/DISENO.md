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
