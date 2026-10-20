// Mapa del ecosistema Reymen: nodos y recorridos de ejemplo. Cada recorrido declara su estado y de dónde sale su respaldo, con el mismo
// vocabulario que los catálogos (live / beta / planned / concept). Un recorrido «concept» se dibuja punteado y con la etiqueta «Concepto».
export type JourneyStatus = "live" | "beta" | "planned" | "concept";
export interface MapNode { id: string; label: string; x: number; y: number; w: number; h: number; group: "input" | "app" }
export interface Journey { id: string; title: string; steps: { node: string; text: string }[]; status: JourneyStatus; note: string; evidence: string[] }

export const NODES: MapNode[] = [
  { id: "pos", label: "Reymen POS", x: 6, y: 24, w: 150, h: 46, group: "input" },
  { id: "form", label: "Formulario web", x: 6, y: 96, w: 150, h: 46, group: "input" },
  { id: "chat", label: "Chat del sitio", x: 6, y: 168, w: 150, h: 46, group: "input" },
  { id: "card", label: "Smart Cards", x: 6, y: 240, w: 150, h: 46, group: "input" },
  { id: "crm", label: "CRM", x: 262, y: 62, w: 160, h: 46, group: "app" },
  { id: "inbox", label: "Bandeja", x: 450, y: 62, w: 160, h: 46, group: "app" },
  { id: "agent", label: "Agente IA", x: 262, y: 138, w: 160, h: 46, group: "app" },
  { id: "auto", label: "Automatizaciones", x: 450, y: 138, w: 160, h: 46, group: "app" },
  { id: "loyalty", label: "Lealtad", x: 356, y: 214, w: 160, h: 46, group: "app" },
];

export const JOURNEYS: Journey[] = [
  {
    id: "venta", title: "Una venta suma la visita del cliente", status: "beta",
    steps: [{ node: "pos", text: "Se cierra una venta" }, { node: "loyalty", text: "Se registra la visita y el sello" }, { node: "crm", text: "El cliente queda actualizado" }],
    note: "Las ventas del POS llegan a Reymen App; Lealtad suma la visita al cliente que compró.",
    evidence: ["ReymenApp docs/LOYALTY_INTEGRACION.md", "ReymenPOS docs/integration.md"],
  },
  {
    id: "formulario", title: "Un formulario se vuelve un contacto con seguimiento", status: "live",
    steps: [{ node: "form", text: "Alguien llena un formulario" }, { node: "crm", text: "Se crea el contacto en el CRM" }, { node: "auto", text: "El equipo recibe el aviso" }],
    note: "Así funciona el formulario de este sitio: crea el contacto en el CRM de Reymen y avisa por correo al equipo.",
    evidence: ["ReymenApp src/app/api/public/leads/route.ts"],
  },
  {
    id: "agente", title: "El Agente IA propone, tu equipo decide", status: "beta",
    steps: [{ node: "chat", text: "Llega un mensaje" }, { node: "agent", text: "El agente redacta con tus reglas" }, { node: "inbox", text: "Una persona revisa y envía" }, { node: "crm", text: "El seguimiento queda en el CRM" }],
    note: "El agente trabaja con tu Rulebook y escala a una persona lo delicado. Las acciones del pipeline quedan registradas y se pueden deshacer.",
    evidence: ["ReymenApp docs/crm/INBOX-IA.md"],
  },
  {
    id: "inventario", title: "Un insumo bajo avisa antes de agotarse", status: "beta",
    steps: [{ node: "pos", text: "Las ventas descuentan insumos" }, { node: "auto", text: "Se detecta el mínimo" }, { node: "crm", text: "Se avisa al responsable" }],
    note: "El motor de automatizaciones genera la alerta; la entrega por WhatsApp o correo depende del conector de cada negocio.",
    evidence: ["ReymenApp src/lib/automation/blueprints/inventory-low-alert.ts"],
  },
  {
    id: "tarjeta", title: "Una Smart Card trae contactos al CRM", status: "planned",
    steps: [{ node: "card", text: "Alguien deja sus datos en una tarjeta" }, { node: "crm", text: "Llega como contacto al CRM" }],
    note: "El receptor en Reymen App está listo; el envío desde la tarjeta está pendiente.",
    evidence: ["ReymenApp docs/smartcard/CRM-LEADS.md"],
  },
  {
    id: "autoriza", title: "Un agente ejecuta una acción autorizada y se supervisa", status: "concept",
    steps: [{ node: "agent", text: "El agente propone una acción" }, { node: "auto", text: "Se ejecuta con tus reglas" }, { node: "inbox", text: "Una persona supervisa el resultado" }],
    note: "Ejemplo ilustrativo de hacia dónde crece la plataforma. Todavía no es parte del producto.",
    evidence: [],
  },
];
