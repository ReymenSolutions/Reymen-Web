# Guía para producir el arte del equipo de agentes

Qué necesitas entregar, dónde ponerlo y cómo conseguir un elenco consistente. El código ya está listo: mientras no exista el archivo de un personaje, la web muestra una silueta provisional.

## 1. Entregables (por personaje)
| Personaje | `id` (nombre del archivo) | Categoría | Acento |
|---|---|---|---|
| Lía | `lia` | Atención y ventas | azul eléctrico |
| Sol | `sol` | Soporte | azul eléctrico |
| Nodo | `nodo` | Operaciones | ámbar |
| Atlas | `atlas` | Análisis e investigación | azul eléctrico |
| Nova | `nova` | Marketing y contenido | azul + ámbar |

«A tu medida» no lleva retrato (es una tarjeta de diseño a la medida).

**Formato:** PNG o WebP **con fondo transparente**, proporción **4:5**, mínimo 1200×1500 px (ideal 3000×3750), cuerpo completo, **sin texto dentro de la imagen** (nombre, rol y estado los pone la web), sin marca de agua.
**Dónde:** `src/assets/agentes/<id>.png` (por ejemplo `src/assets/agentes/lia.png`). El build genera AVIF/WebP en dos tamaños; no tienes que optimizar nada.
**Después de subirlo:** revisar en `/ai-agents` que el encuadre sea bueno; si hace falta, se ajusta `art.focus` en `src/content/personas/<id>.json` ([x %, y %]).
Si cambias el aspecto de un personaje, actualiza también `art.alt` (la descripción para lectores de pantalla) en el mismo JSON.

## 2. Dónde producirlo (opciones)
Elige la herramienta por **consistencia entre personajes** y **términos de uso comercial** (revisa los de tu plan vigente antes de publicar; cambian con frecuencia).
- **Generadores de imagen con referencia de estilo/personaje** (Midjourney con referencias de estilo y de personaje, Adobe Firefly con referencia de estilo, Leonardo, Google Imagen/Gemini, modelos de imagen de OpenAI): rápidos y buenos para este look 3D estilizado. Usa siempre la misma imagen de estilo y el mismo bloque de prompt.
- **Pipeline 3D (Blender, Spline, Character Creator + render):** más control y repetibilidad (misma cámara y luz para todos), más trabajo. Ideal si quieres poder re-renderizar poses después.
- **Ilustrador/estudio 3D:** si buscas un resultado final de marca; entrégale esta guía y la sección 4.
Flujo recomendado: generar → elegir → recortar fondo → retocar → exportar.

## 3. Cómo mantenerlos coherentes (el elenco)
1. **Una imagen de estilo común.** Genera primero a Lía hasta que te guste y úsala como referencia de estilo de los demás.
2. **Mismo bloque base en todos los prompts** (sección 4) y solo cambia el bloque del personaje.
3. **Misma cámara y luz:** cuerpo completo, 3/4, ligero contrapicado, lente ~50 mm, luz de contorno azul eléctrico, relleno suave frío, un acento cálido pequeño.
4. **Proporciones adultas** (7–7,5 cabezas), expresión serena y segura. Evita «chibi», ojos enormes, poses exageradas.
5. **Marca:** la **R** de Reymen en hombro o pecho; prendas técnicas azul marino/negro con líneas luminosas.
6. **Un prop por personaje** que cuente su especialidad.
7. **Sin texto en la imagen** y sin logotipos de terceros.

## 4. Prompts base (ajústalos a tu herramienta)
**Bloque base (igual para todos):**
> Stylized semi-realistic 3D character render, adult proportions (about 7.5 heads tall), calm confident expression, full body, three-quarter view, slight low angle, 50mm lens, premium tech aesthetic. Navy blue and black technical outfit with glowing electric-blue edge lines and a small stylized letter "R" on shoulder or chest. Cool blue rim light, soft cool fill light, one small warm accent. Isolated on a plain dark background for easy cutout. No text, no watermark, no logos of other brands.

**Bloques por personaje:**
- **Lía (atención y ventas):** woman, short tech jacket, open-palm welcoming gesture, a small glowing chat bubble with a dot node floating beside her hand. Accent: electric blue.
- **Sol (soporte):** mature man with a calm, trustworthy look, long navy coat with silver details, a small holographic book/knowledge panel next to his hand. Accent: soft electric blue.
- **Nodo (operaciones):** friendly android character (humanoid robot, clean rounded design), tool belt, small floating task chips. Accent: amber/orange details.
- **Atlas (análisis e investigación):** woman or man with short hair, arms crossed or holding a tablet, a floating holographic chart/lens HUD. Accent: electric blue with silver.
- **Nova (marketing y contenido):** young creative person, casual-tech jacket, a small orbiting camera drone, floating idea/image/video panels. Accent: electric blue with amber.

**Negativos útiles:** child-like, chibi, oversized eyes, cartoon mascot, text, letters, watermark, extra fingers, distorted hands, third-party logos.

## 5. Recorte y exportación
1. **Quitar el fondo** (el de tu herramienta, Photoshop/Firefly «quitar fondo» o similar) y revisar bordes en fondo oscuro (sin halo claro).
2. **Retocar manos, rostro y pies** (zonas donde suelen fallar los generadores).
3. **Ampliar** si hace falta (escalado con IA) a ≥ 1200×1500 px.
4. Exportar **PNG con alfa** (o WebP sin pérdida). No conviertas a JPG.
5. Dejar un margen de ~5 % alrededor del personaje para que no se vea cortado en la tarjeta.

## 6. Lista de revisión antes de subir
- [ ] Mismo estilo, cámara y luz que el resto del elenco.
- [ ] La **R** de Reymen visible y sin deformar.
- [ ] Sin texto, marcas de agua ni logotipos de terceros.
- [ ] Manos y rostro sin errores.
- [ ] Bordes limpios sobre fondo oscuro.
- [ ] Parece un profesional, no una mascota infantil.
- [ ] Nombre del archivo = `id` del personaje.
- [ ] Probado en `/ai-agents` en móvil y escritorio.
