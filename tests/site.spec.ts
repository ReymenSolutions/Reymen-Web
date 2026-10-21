import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { STATIC_ROUTES } from "../src/routes";
import { product, vertical, feature } from "../src/lib/schemas";

const pages = ["/", "/restaurantes", "/productos", "/contacto", "/ai-agents", "/smart-cards", "/automatizaciones", "/servicios", "/seguridad", "/privacidad", "/gracias"];

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
    // Estáticas + verticales, productos y páginas publicados. Las páginas en borrador (Realty, clínicas) o sin listar no entran.
    expect([...locs].sort()).toEqual([...STATIC_ROUTES, "/restaurantes", "/ai-agents", "/smart-cards", "/automatizaciones", "/servicios", "/seguridad"].map((p) => `https://reymen.mx${p}`).sort());
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
    for (const path of ["/", "/restaurantes", "/productos", "/contacto", "/ai-agents", "/smart-cards", "/automatizaciones", "/servicios", "/seguridad"]) {
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
    await page.locator("[data-nav] .dd-btn", { hasText: "Soluciones" }).click();
    await page.locator("#dd-soluciones a").first().click();
    await expect(page).toHaveURL(/\/restaurantes$/);
  });

  test("menú de escritorio: desplegables con teclado y sin enlaces a páginas en borrador", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    const btn = page.locator(".dd-btn", { hasText: "Productos" });
    await btn.focus();
    await page.keyboard.press("Enter");
    await expect(btn).toHaveAttribute("aria-expanded", "true");
    await expect(page.locator("#dd-productos a", { hasText: "Reymen AI Agents" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(btn).toHaveAttribute("aria-expanded", "false");
    await expect(btn).toBeFocused();
    // El menú solo enlaza a páginas publicadas: Realty y clínicas siguen en borrador y no aparecen.
    const hrefs = await page.locator("[data-nav] a").evaluateAll((as) => as.map((a) => (a as HTMLAnchorElement).getAttribute("href")));
    for (const h of hrefs) expect(h).not.toMatch(/^\/(realty|clinicas-y-servicios)(\/|#|$)/);
    expect(hrefs).toEqual(expect.arrayContaining(["/ai-agents", "/smart-cards", "/automatizaciones", "/servicios", "/seguridad"]));
  });

  test("desplegable abierto sobre el hero oscuro: contraste correcto (axe)", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    await page.locator(".dd-btn", { hasText: "Productos" }).click();
    await expect(page.locator("#dd-productos")).toBeVisible();
    const { violations } = await new AxeBuilder({ page }).include(".site-header").withTags(["wcag2a", "wcag2aa"]).analyze();
    expect(violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
  });

  test("las páginas en borrador no existen", async ({ request }) => {
    for (const path of ["/realty", "/clinicas-y-servicios"]) expect((await request.get(path)).status()).toBe(404);
  });

  test("ningún enlace interno está roto", async ({ page, request }) => {
    const seen = new Set<string>();
    for (const path of pages) {
      await page.goto(path);
      const hrefs = await page.locator("a[href^='/']").evaluateAll((as) => as.map((a) => (a as HTMLAnchorElement).getAttribute("href")!));
      for (const h of hrefs) seen.add(h.split("#")[0].split("?")[0] || "/");
    }
    for (const url of seen) expect((await request.get(url)).status(), url).toBe(200);
  });

  test("/productos: cada producto tiene su sección, su estado y su CTA", async ({ page }) => {
    await page.goto("/productos");
    for (const id of ["reymen-app", "reymen-pos", "ai-agents", "smart-cards"]) {
      const sec = page.locator(`#${id}`);
      await expect(sec).toHaveCount(1);
      await expect(sec.locator(".badge").first()).toBeVisible();
      await expect(sec.locator(`a[href="/contacto?interes=${id}"]`)).toHaveCount(1);
    }
    // Lo que está en desarrollo o es concepto se rotula como tal.
    await expect(page.locator("#ai-agents")).toContainText("Concepto");
    await expect(page.locator("#ai-agents")).toContainText("En desarrollo");
  });

  test("/ai-agents: niveles con su estado y el catálogo filtra por categoría", async ({ page }) => {
    await page.goto("/ai-agents");
    await expect(page.locator("h1")).toContainText("Agentes de IA que trabajan con tus reglas");
    await expect(page.locator("#canales")).toContainText("WhatsApp (con Twilio)");
    await expect(page.locator("#canales")).toContainText("En desarrollo");
    await expect(page.locator("#equipos")).toContainText("Concepto: aún no es parte del producto");
    const cat = page.locator("[data-catalog]");
    await cat.locator(".chip", { hasText: "Marketing" }).click();
    await expect(cat.locator(".cat:not([hidden])")).toHaveCount(1);
    await expect(cat.locator(".cat:not([hidden])")).toContainText("Investigación de tendencias");
    await cat.locator(".chip", { hasText: "Todas" }).click();
    await expect(cat.locator(".cat:not([hidden])")).toHaveCount(6);
  });

  test("/automatizaciones: elegir un flujo rellena Evento, Condición, Acción y Resultado", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/automatizaciones");
    const flow = page.locator("[data-flow]");
    await flow.locator(".pick", { hasText: "Alerta de inventario bajo" }).click();
    await expect(flow.locator('[data-k="event"]')).toContainText("baja de su mínimo");
    await expect(flow.locator("[data-req]")).toContainText("Reymen Foods");
    await expect(page.locator("body")).toContainText("No hay un constructor visual");
  });

  test("/smart-cards, /seguridad y /servicios muestran su contenido y su estado", async ({ page }) => {
    await page.goto("/smart-cards");
    await expect(page.locator("#incluye")).toContainText("Se abre con NFC o con QR");
    await expect(page.locator("h1 ~ *, body").first()).toBeVisible();
    await page.goto("/seguridad");
    await expect(page.locator("body")).toContainText("No declaramos certificaciones");
    await expect(page.locator("#datos")).toContainText("Beta");
    await page.goto("/servicios");
    await expect(page.locator("#servicios .row")).toHaveCount(4);
  });

  test("mapa del ecosistema: elegir un recorrido cambia el detalle y marca el concepto", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/productos");
    const map = page.locator("[data-map]");
    await map.locator(".pick", { hasText: "ejecuta una acción autorizada" }).click();
    await expect(map.locator(".detail.side:not([hidden])")).toContainText("Ejemplo conceptual");
    await expect(map).toHaveAttribute("data-journey", "autoriza");
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
    await page.locator("[data-canvas] .pick").nth(2).click();
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

  test("/contacto: el interés viaja en source y se preselecciona desde ?interes=", async ({ page }) => {
    let body: Record<string, unknown> = {};
    await page.route(api, async (r) => { body = JSON.parse(r.request().postData() ?? "{}"); await r.fulfill({ status: 200, contentType: "application/json", body: '{"success":true}', headers: { "access-control-allow-origin": "*" } }); });
    await page.goto("/contacto?interes=ai-agents");
    await expect(page.locator("#lf-interest")).toHaveValue("ai-agents");
    await fill(page);
    await page.click("#lead-form button[type=submit]");
    await expect(page).toHaveURL(/\/gracias$/);
    expect(body.source).toBe("web-contacto-ai-agents");
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
  // Y en las páginas de agentes y automatizaciones, WhatsApp solo aparece como «en desarrollo».
  for (const path of ["/ai-agents", "/automatizaciones"]) {
    await page.goto(path);
    const text = (await page.locator("body").innerText()).toLowerCase();
    expect(text).not.toMatch(/al instante|responde por whatsapp|atienden mensajes reales/);
    expect(text).toContain("en desarrollo");
  }
});

test.describe("demos interactivas", () => {
  test("el catálogo de agentes combina categoría y estado y avisa cuántos muestra", async ({ page }) => {
    await page.goto("/ai-agents");
    const root = page.locator("[data-catalog]");
    const count = root.locator("[data-count]");
    await expect(count).toContainText("Mostrando");
    await root.locator('.chip[data-st="beta"]').click();
    await expect(root.locator("li:not([hidden]) >> nth=0")).toBeVisible();
    for (const li of await root.locator("li:not([hidden])").all()) await expect(li).toContainText("Beta");
    await root.locator('.chip[data-st="concept"]').click();
    for (const li of await root.locator("li:not([hidden])").all()) await expect(li).toContainText("Concepto");
    await root.locator('.chip[data-st="all"]').click();
    await expect(root.locator('.chip[data-st="all"]')).toHaveAttribute("aria-pressed", "true");
  });

  test("la simulación de un flujo ilumina los cuatro pasos y se puede repetir", async ({ page }) => {
    await page.goto("/automatizaciones");
    const flow = page.locator("[data-flow]");
    await flow.scrollIntoViewIfNeeded();
    await flow.locator("[data-sim]").click();
    await expect(flow.locator(".chain")).toHaveClass(/running/);
    await expect(flow.locator(".step.lit")).toHaveCount(1);
    await expect(flow.locator("[data-sim-say]")).toContainText("Paso 1 de 4");
    await expect(flow.locator("[data-sim-say]")).toContainText("Paso 3 de 4", { timeout: 6000 });
    await expect(flow.locator(".chain")).not.toHaveClass(/running/, { timeout: 8000 });
    await expect(flow.locator("[data-sim]")).toBeEnabled();
  });

  test("el recorrido del ecosistema avanza solo y se detiene al elegir uno a mano", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/productos");
    const map = page.locator("[data-map]");
    const tour = map.locator("[data-tour]");
    await map.scrollIntoViewIfNeeded();
    const before = await map.getAttribute("data-journey");
    await tour.click();
    await expect(tour).toHaveAttribute("aria-pressed", "true");
    await expect(map).not.toHaveAttribute("data-journey", before!);
    await map.locator(".pick").nth(1).click();
    await expect(tour).toHaveAttribute("aria-pressed", "false");
  });
});

test.describe("equipo de agentes (carrusel)", () => {
  test("muestra a Lía como protagonista, con su estado y CTA", async ({ page }) => {
    await page.goto("/ai-agents");
    const cast = page.locator("[data-cast]");
    await expect(cast.locator('[role="tab"]')).toHaveCount(6);
    await expect(cast.locator('[role="tab"][aria-selected="true"]')).toContainText("Lía");
    await expect(cast.locator('[role="tabpanel"].is-active')).toContainText("Solicitar acceso a Lía");
    await expect(cast.locator('[role="tab"]').first()).toContainText("Beta");
  });

  test("los conceptos llevan su etiqueta y un CTA que no promete acceso", async ({ page }) => {
    await page.goto("/ai-agents");
    const cast = page.locator("[data-cast]");
    for (const [i, name] of [[2, "Nodo"], [3, "Atlas"], [4, "Nova"]] as const) {
      const tab = cast.locator('[role="tab"]').nth(i);
      await expect(tab).toContainText(name);
      await expect(tab).toContainText("Concepto");
      await tab.click();
      const panel = cast.locator('[role="tabpanel"].is-active');
      await expect(panel).toContainText("Es un concepto");
      await expect(panel).toContainText("Cuéntanos tu caso");
      await expect(panel).not.toContainText("Solicitar acceso");
    }
  });

  test("se navega con flechas, botones y enlace profundo", async ({ page }) => {
    await page.goto("/ai-agents");
    const cast = page.locator("[data-cast]");
    const first = cast.locator('[role="tab"]').first();
    await first.focus();
    await page.keyboard.press("ArrowRight");
    await expect(cast.locator('[role="tab"][aria-selected="true"]')).toContainText("Sol");
    await expect(cast.locator("[data-say]")).toContainText("Sol, 2 de 6");
    await cast.locator("[data-next]").click();
    await expect(cast.locator('[role="tab"][aria-selected="true"]')).toContainText("Nodo");
    await cast.locator('[role="tab"][aria-selected="true"]').focus();
    await page.keyboard.press("End");
    await expect(cast.locator('[role="tab"][aria-selected="true"]')).toContainText("A tu medida");
    await expect(cast.locator("[data-next]")).toBeDisabled();
    await page.goto("/ai-agents#agente-atlas");
    await expect(page.locator('[data-cast] [role="tab"][aria-selected="true"]')).toContainText("Atlas");
  });

  test("el CTA lleva el agente al formulario y al origen del contacto", async ({ page }) => {
    await page.goto("/ai-agents");
    const href = await page.locator('[data-cast] [role="tabpanel"].is-active a.btn').getAttribute("href");
    expect(href).toBe("/contacto?interes=ai-agents&agente=lia");
  });

  test("sin JavaScript se ven todas las fichas", async ({ browser }) => {
    const ctx = await browser.newContext({ javaScriptEnabled: false });
    const page = await ctx.newPage();
    await page.goto("/ai-agents");
    await expect(page.locator("[data-cast] [role='tabpanel']")).toHaveCount(6);
    for (const n of ["Lía", "Sol", "Nodo", "Atlas", "Nova", "A tu medida"]) await expect(page.locator("[data-cast]")).toContainText(n);
    await expect(page.locator("[data-cast] [role='tabpanel']").last()).toBeVisible();
    await ctx.close();
  });

  test("con movimiento reducido no hay animación de cambio", async ({ browser }) => {
    const ctx = await browser.newContext({ reducedMotion: "reduce" });
    const page = await ctx.newPage();
    await page.goto("/ai-agents");
    await page.locator('[data-cast] [role="tab"]').nth(1).click();
    const anim = await page.locator('[data-cast] [role="tabpanel"].is-active').evaluate((el) => getComputedStyle(el).animationName);
    expect(anim).toBe("none");
    await ctx.close();
  });

  test("no desborda a ningún ancho", async ({ page }) => {
    for (const w of [320, 390, 768, 1280]) {
      await page.setViewportSize({ width: w, height: 800 });
      await page.goto("/ai-agents");
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
  });
});

test.describe("imágenes para compartir", () => {
  for (const route of ["/restaurantes", "/ai-agents", "/smart-cards", "/automatizaciones", "/productos"]) {
    test(`${route} tiene su propia imagen Open Graph`, async ({ page, request }) => {
      await page.goto(route);
      const url = await page.locator('meta[property="og:image"]').getAttribute("content");
      expect(url).toContain(`/og${route}.png`);
      const res = await request.get(new URL(url!).pathname);
      expect(res.status()).toBe(200);
      expect(res.headers()["content-type"]).toContain("image/png");
    });
  }
  test("la portada conserva la imagen de la marca", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", /\/og-image\.png$/);
  });
});

test.describe("catálogos: la regla de evidencia", () => {
  const ev = (o: object = {}) => ({ code: [], tests: false, production: false, ...o });
  const f = (status: string, evidence: object) => feature.safeParse({ id: "x", title: "Algo", text: "Algo", status, evidence: ev(evidence) });

  test("una función live exige respaldo en código y confirmación de producción", () => {
    expect(f("live", {}).success).toBe(false);
    expect(f("live", { code: ["doc"] }).success).toBe(false);
    expect(f("live", { code: ["doc"], production: true }).success).toBe(true);
  });
  test("beta exige código; planned y concept no pueden decir que ya operan", () => {
    expect(f("beta", {}).success).toBe(false);
    expect(f("beta", { code: ["doc"] }).success).toBe(true);
    expect(f("planned", { production: true }).success).toBe(false);
    expect(f("concept", {}).success).toBe(true);
  });
  test("un producto COMING_SOON no puede declarar funciones live", () => {
    const base = { id: "p", name: "P", order: 1, tagline: "t", description: "d", model: "module", publication: "published", availability: "COMING_SOON" };
    const live = { id: "a", title: "Aa", text: "Aa", status: "live", evidence: ev({ code: ["x"], production: true }) };
    expect(product.safeParse({ ...base, features: [live] }).success).toBe(false);
    expect(product.safeParse({ ...base, features: [] }).success).toBe(true);
  });
  test("una vertical LIVE debe estar desplegada y una publicada que no es LIVE/BETA lleva noindex", () => {
    const base = { id: "v", name: "V", order: 1, route: "/v", description: "d", audience: "a", layout: "coming-soon", cta: { primary: { label: "x", href: "/c" } }, seo: { title: "t", description: "d", noindex: false } };
    const live = { id: "a", title: "Aa", text: "Aa", status: "live", evidence: ev({ code: ["x"], production: true }) };
    expect(vertical.safeParse({ ...base, publication: "published", availability: "LIVE", stages: { code: true, tests: true, deployed: false }, features: [live] }).success).toBe(false);
    expect(vertical.safeParse({ ...base, publication: "published", availability: "COMING_SOON", stages: { code: true, tests: true, deployed: false } }).success).toBe(false);
    expect(vertical.safeParse({ ...base, publication: "draft", availability: "COMING_SOON", stages: { code: true, tests: true, deployed: false } }).success).toBe(true);
  });
});
