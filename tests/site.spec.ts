import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { PUBLIC_ROUTES } from "../src/routes";

const pages = ["/", "/restaurantes", "/privacidad", "/gracias"];

// Las pruebas no dependen de internet: la analítica externa se simula vacía.
test.beforeEach(async ({ page }) => { await page.route("https://plausible.io/**", (r) => r.fulfill({ status: 200, contentType: "text/javascript", body: "" })); });
const widths = [320, 375, 390, 430, 768, 1024, 1440, 1920];

test.describe("rutas, SEO y encabezados", () => {
  for (const path of pages) {
    test(`${path}: título, un h1, canonical y sin errores de consola`, async ({ page }) => {
      const problems: string[] = [];
      page.on("console", (m) => { if (m.type() === "error") problems.push(m.text()); });
      page.on("pageerror", (e) => problems.push(e.message));
      const res = await page.goto(path);
      expect(res?.status()).toBe(200);
      await expect(page.locator("h1")).toHaveCount(1);
      expect((await page.title()).length).toBeGreaterThan(10);
      await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);
      expect(problems).toEqual([]);
    });
  }

  test("/gracias y /404 no se indexan", async ({ page }) => {
    for (const path of ["/gracias", "/ruta-que-no-existe"]) {
      await page.goto(path);
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    }
  });

  test("el sitemap lista exactamente las rutas públicas", async ({ request }) => {
    const xml = await (await request.get("/sitemap.xml")).text();
    const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    expect(locs).toEqual(PUBLIC_ROUTES.map((p) => `https://reymen.mx${p}`));
  });

  test("encabezados de seguridad presentes", async ({ request }) => {
    const h = (await request.get("/")).headers();
    expect(h["content-security-policy"]).toContain("frame-ancestors 'none'");
    expect(h["content-security-policy"]).toContain("connect-src 'self' https://app.reymen.mx");
    expect(h["permissions-policy"]).toContain("camera=()");
    expect(h["x-content-type-options"]).toBe("nosniff");
    expect(h["x-frame-options"]).toBe("DENY");
  });

  test("la CSP no bloquea nada propio (sin violaciones al recorrer las páginas)", async ({ page }) => {
    const violations: string[] = [];
    await page.addInitScript(() => document.addEventListener("securitypolicyviolation", (e) => ((window as any).__csp = ((window as any).__csp ?? []).concat(`${e.violatedDirective} ${e.blockedURI}`))));
    for (const path of pages) {
      await page.goto(path);
      await page.waitForTimeout(600);
      violations.push(...((await page.evaluate(() => (window as any).__csp)) ?? []));
    }
    expect(violations).toEqual([]);
  });
});

test.describe("responsive", () => {
  for (const w of widths) {
    for (const path of ["/", "/restaurantes"]) {
      test(`${path} a ${w}px: sin desbordes y botones tocables`, async ({ page }) => {
        await page.setViewportSize({ width: w, height: w < 600 ? 800 : 900 });
        await page.goto(path);
        const r = await page.evaluate(() => ({
          overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
          small: [...document.querySelectorAll<HTMLElement>(".cta-row .btn, .menu, .site-header .cta")].filter((e) => e.offsetParent && e.getBoundingClientRect().height < 40).map((e) => e.className),
        }));
        expect(r.overflow).toBe(false);
        expect(r.small).toEqual([]);
      });
    }
  }
});

test.describe("accesibilidad (axe)", () => {
  for (const path of pages) {
    for (const w of [390, 1440]) {
      test(`${path} a ${w}px sin violaciones WCAG A/AA`, async ({ page }) => {
        await page.emulateMedia({ reducedMotion: "reduce" }); // sin transiciones a medias: el contraste se mide en estado final
        await page.setViewportSize({ width: w, height: 900 });
        await page.goto(path);
        await page.waitForTimeout(300);
        const { violations } = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
        expect(violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
      });
    }
  }
});

test.describe("navegación e interacciones", () => {
  test("menú móvil abre, navega y cierra con Escape", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await page.goto("/");
    const menu = page.locator("[data-menu]");
    await menu.click();
    await expect(menu).toHaveAttribute("aria-expanded", "true");
    await page.keyboard.press("Escape");
    await expect(menu).toHaveAttribute("aria-expanded", "false");
    await menu.click();
    await page.locator("[data-nav] a", { hasText: "Restaurantes" }).click();
    await expect(page).toHaveURL(/\/restaurantes$/);
  });

  test("demo del hero: etapas, pausa y reproducir", async ({ page }) => {
    await page.goto("/");
    const stage = page.locator("[data-stage]");
    await page.locator("[data-rail] button").nth(3).click();
    await expect(stage).toHaveAttribute("data-step", "3");
    const pause = page.locator("[data-pause]");
    await expect(pause).toHaveAttribute("aria-pressed", "true");
    await pause.click();
    await expect(pause).toHaveAttribute("aria-pressed", "false");
  });

  test("selector de servicios cambia el enfoque", async ({ page }) => {
    await page.goto("/");
    await page.locator(".pick").nth(2).click();
    await expect(page.locator("[data-canvas]")).toHaveAttribute("data-focus", "software");
  });

  test("las preguntas frecuentes se abren", async ({ page }) => {
    await page.goto("/");
    const d = page.locator(".faq details").first();
    await d.locator("summary").click();
    await expect(d).toHaveAttribute("open", "");
  });
});

test.describe("formulario de contacto (API simulada)", () => {
  const fill = async (page: import("@playwright/test").Page) => {
    await page.fill("#lf-name", "Ana Prueba");
    await page.fill("#lf-contact", "ana@example.com");
    await page.check('input[name="consent"]');
  };
  const api = "https://app.reymen.mx/api/public/leads";

  test("éxito: manda el contrato esperado y lleva a /gracias", async ({ page }) => {
    let body: Record<string, unknown> = {};
    await page.route(api, async (r) => { body = JSON.parse(r.request().postData() ?? "{}"); await r.fulfill({ status: 200, contentType: "application/json", body: '{"success":true}', headers: { "access-control-allow-origin": "*" } }); });
    await page.goto("/");
    await fill(page);
    await page.click("#lead-form button[type=submit]");
    await expect(page).toHaveURL(/\/gracias$/);
    expect(body).toMatchObject({ name: "Ana Prueba", contact: "ana@example.com", consent: true, source: "web" });
    expect(body.website).toBeUndefined();
  });

  test("sin consentimiento no envía nada y marca el campo", async ({ page }) => {
    let called = false;
    await page.route(api, (r) => { called = true; return r.abort(); });
    await page.goto("/");
    await page.fill("#lf-name", "Ana Prueba");
    await page.fill("#lf-contact", "ana@example.com");
    await page.click("#lead-form button[type=submit]");
    await expect(page.locator("#lead-msg")).toContainText("Revisa tu nombre");
    await expect(page.locator('input[name="consent"]')).toHaveAttribute("aria-invalid", "true");
    expect(called).toBe(false);
  });

  for (const [status, text] of [[400, "WhatsApp de 10 dígitos"], [429, "varios envíos"], [500, "No pudimos enviar"]] as const) {
    test(`respuesta ${status}: mensaje claro, sin ir a /gracias y botón disponible`, async ({ page }) => {
      await page.route(api, (r) => r.fulfill({ status, contentType: "application/json", body: "{}", headers: { "access-control-allow-origin": "*" } }));
      await page.goto("/");
      await fill(page);
      await page.click("#lead-form button[type=submit]");
      await expect(page.locator("#lead-msg")).toContainText(text);
      await expect(page).not.toHaveURL(/gracias/);
      await expect(page.locator("#lead-form button[type=submit]")).toBeEnabled();
    });
  }

  test("sin red: no afirma que se envió", async ({ page }) => {
    await page.route(api, (r) => r.abort());
    await page.goto("/");
    await fill(page);
    await page.click("#lead-form button[type=submit]");
    await expect(page.locator("#lead-msg")).toContainText("Sin conexión");
    await expect(page).not.toHaveURL(/gracias/);
  });

  test("el giro se preselecciona desde ?giro=", async ({ page }) => {
    await page.goto("/?giro=inmobiliaria");
    await expect(page.locator("#lf-vertical")).toHaveValue("inmobiliaria");
  });
});

test.describe("chat del sitio (API simulada)", () => {
  const api = "https://app.reymen.mx/api/public/chat";
  const open = async (page: import("@playwright/test").Page) => { await page.setViewportSize({ width: 1440, height: 900 }); await page.goto("/restaurantes"); await page.evaluate(() => window.scrollTo(0, 1200)); await page.locator("#chat-fab").click(); };

  test("responde con lo que devuelve la API", async ({ page }) => {
    await page.route(api, (r) => r.fulfill({ status: 200, contentType: "application/json", body: '{"reply":"Respuesta de prueba","handoff":false}', headers: { "access-control-allow-origin": "*" } }));
    await open(page);
    await page.fill("#chat-input", "Hola");
    await page.press("#chat-input", "Enter");
    await expect(page.locator("#chat-log")).toContainText("Respuesta de prueba");
  });

  test("si la API falla, no inventa una respuesta", async ({ page }) => {
    await page.route(api, (r) => r.abort());
    await open(page);
    await page.fill("#chat-input", "Hola");
    await page.press("#chat-input", "Enter");
    await expect(page.locator("#chat-log")).toContainText("Ahora mismo no puedo responder");
  });
});

test("las afirmaciones retiradas no reaparecen", async ({ page }) => {
  // Hasta confirmar la integración de WhatsApp (Twilio) y su disponibilidad, el sitio no promete respuestas instantáneas por WhatsApp.
  for (const path of ["/", "/restaurantes"]) {
    await page.goto(path);
    const text = (await page.locator("body").innerText()).toLowerCase();
    expect(text).not.toMatch(/al instante|contestados al instante|contesta tu whatsapp/);
  }
});
