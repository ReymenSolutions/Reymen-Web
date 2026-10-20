import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import type { ZodTypeAny } from "astro/zod";
import { product, vertical, capability, service, home, agentCategory, automationFlow, landing } from "./lib/schemas";

// Catálogos declarativos del sitio. Agregar un producto o una vertical es agregar un archivo; ver docs/evolucion/02-arquitectura.md.
const json = (dir: string, schema: ZodTypeAny) => defineCollection({ loader: glob({ pattern: "*.json", base: `./src/content/${dir}` }), schema });
export const collections = {
  products: json("products", product),
  verticals: json("verticals", vertical),
  capabilities: json("capabilities", capability),
  services: json("services", service),
  pages: json("pages", home),
  agents: json("agents", agentCategory),
  automations: json("automations", automationFlow),
  landings: json("landings", landing),
};
