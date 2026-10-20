# Reymen Web

Sitio público de Reymen (reymen.mx), hecho con [Astro](https://astro.build) (salida estática).

- Inicio (`/`) y página para restaurantes y cafeterías (`/restaurantes`).
- Formulario → `POST {apiUrl}/api/public/leads` (CRM de Reymen) y chat → `POST {apiUrl}/api/public/chat` (canal webchat del Inbox). Ver `docs/SITIO_WEB.md` en ReymenApp.
- **Precios ocultos** por ahora (`showPrices: false` en `src/config.ts`). Para mostrarlos: `PUBLIC_PLANS_ENABLED=true` en ReymenApp y `showPrices: true`; se leen del catálogo (Admin → Planes).

## Pendientes de configuración (`src/config.ts`)
- `calendlyUrl`: enlace de Calendly. Vacío = «Agenda una demo» lleva al formulario.
- `whatsapp`: número de ventas (ej. `5215512345678`). Vacío = no aparece el botón.
- `plausibleDomain`: ya apunta a reymen.mx; hay que dar de alta el sitio en plausible.io. `googleSiteVerification`: código de Search Console.
- Aviso de privacidad (`/privacidad`): texto completo; falta el domicilio legal (`legalAddress`) y la revisión de un abogado.
- Los casos de éxito se publicarán solo con clientes reales y con su permiso.

## Desarrollo
```
npm install
npm run dev      # http://localhost:4321
npm run build
```

## Publicar en la VPS
Corre en Docker (nginx) detrás del nginx-proxy existente (red `proxy-net`). Requiere que `reymen.mx` y `www.reymen.mx` apunten a la VPS.
```
git clone https://github.com/ReymenSolutions/reymen-web /home/emilianorm/reymen-web   # solo la primera vez
sudo /home/emilianorm/reymen-web/deploy/update.sh
```
Producción despliega siempre desde `main`.

## Calidad
```
npm run check   # tipos y diagnósticos de Astro (0 errores esperados)
npm test        # compila, sirve dist/ con los encabezados de deploy/nginx.conf y corre 46 pruebas (Playwright + axe)
```
Las pruebas simulan la API pública y la analítica: no necesitan red. Documentación de la evolución del sitio en `docs/evolucion/`.
