// Rutas fijas del sitio que se indexan. Las páginas de verticales y productos se agregan solas desde sus datos (ver sitemap.xml.ts):
// una página `draft` no aparece, `unlisted` tampoco, y solo las `published` entran.
export const STATIC_ROUTES = ["", "/productos", "/contacto", "/privacidad"] as const;
