import { defineConfig } from "@playwright/test";
import { existsSync } from "node:fs";

// Pruebas de humo del sitio. `npm test` compila, sirve dist/ con los encabezados de nginx y corre las pruebas en Chromium.
// En este entorno el navegador ya está instalado; si no, Playwright usa el suyo (`npx playwright install chromium`).
const local = "/opt/pw-browsers/chromium";
export default defineConfig({
  testDir: "tests",
  testMatch: "**/*.spec.ts",
  fullyParallel: true,
  reporter: [["list"]],
  use: {
    baseURL: "http://127.0.0.1:4322",
    launchOptions: { executablePath: process.env.CHROMIUM_PATH ?? (existsSync(local) ? local : undefined) },
  },
  webServer: { command: "npm run build && node tests/server.mjs", url: "http://127.0.0.1:4322/robots.txt", reuseExistingServer: !process.env.CI, timeout: 120_000 },
});
