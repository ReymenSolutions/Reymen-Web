import { defineConfig } from "astro/config";

// Sitio 100 % estático: se compila a /dist y lo sirve nginx (ver deploy/).
export default defineConfig({
  site: "https://reymen.mx",
  output: "static",
  trailingSlash: "never",
  build: { format: "file" },
});
