// Configuración del sitio. Lo marcado PENDIENTE se llena cuando el equipo tenga el dato; mientras estén vacíos, los botones
// caen al formulario de contacto y nada se rompe.
export const SITE = {
  name: "Reymen Solutions",
  url: "https://reymen.mx",
  email: "contact@reymen.mx",
  /** PENDIENTE: enlace de Calendly para agendar demo (https://calendly.com/...). Vacío = el botón lleva al formulario. */
  calendlyUrl: "",
  /** PENDIENTE: WhatsApp de ventas en formato internacional sin signos (ej. 5215512345678). Vacío = sin botón de WhatsApp. */
  whatsapp: "",
  /** ReymenApp (API pública y acceso de clientes). */
  appUrl: "https://app.reymen.mx",
  apiUrl: "https://app.reymen.mx",
  /** Dominio dado de alta en Plausible (analítica sin cookies). Vacío = sin analítica. Requiere crear el sitio en plausible.io. */
  plausibleDomain: "reymen.mx",
  /** PENDIENTE: código de verificación de Google Search Console (solo el valor de «content»). Vacío = sin etiqueta. */
  googleSiteVerification: "",
  /** Aviso de privacidad: responsable y domicilio (la ley exige el domicilio). PENDIENTE: domicilio; vacío = no se muestra. */
  legalName: "Reymen Solutions",
  legalAddress: "",
  /** Los precios se muestran solo cuando se enciende (y PUBLIC_PLANS_ENABLED=true en ReymenApp). */
  showPrices: false,
  privacyVersion: "2026-10",
  privacyUpdated: "19 de octubre de 2026",
} as const;

export const whatsappLink = (text = "Hola, quiero información de Reymen") =>
  SITE.whatsapp ? `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(text)}` : "";
