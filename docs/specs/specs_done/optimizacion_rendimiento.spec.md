# SPEC — Optimización de rendimiento del sitio público

## Contexto y alcance

Diagnóstico realizado sobre `/catalogo?categoria=Negrita+Puloy` (DevTools → Network, "Disable cache" activo): la vista tarda ~2.5 s en quedar completamente cargada mostrando solo **2** tarjetas. La cascada de red muestra el problema en capas encadenadas en serie (HTML → JS → datos → imágenes), sin paralelizar ni cachear:

1. **Imágenes de disfraces sin optimizar.** Las dos imágenes de la tarjeta pesan 1,153 kB y 1,388 kB (PNG crudos servidos desde Supabase Storage), tardando ~1 s cada una. `getPublicImageUrl()` (`src/lib/supabase.ts:32-42`) devuelve la URL pública tal cual, sin ningún parámetro de redimensión/compresión, y `uploadCostumeImage()` (`src/services/adminService.ts:251-301`) sube el archivo original sin procesarlo (solo valida tipo MIME y tamaño máximo de 5MB, `src/services/adminService.ts:256-262`).
2. **Latencia elevada en cada query a Supabase.** Peticiones de 1-1.7 kB de payload (`contact_info`, `site_stats`, `reviews`, `working_hours`, `costumes_full`) tardan ~700-720 ms cada una, más un preflight `OPTIONS` propio por petición (~125 ms). Para un payload tan pequeño, esa latencia es anómala y apunta a la región/plan del proyecto Supabase, no al tamaño de los datos.
3. **Datos que se piden en rutas que no los usan.** `PublicDataProvider` (`src/context/PublicDataContext.tsx:29-59`) envuelve toda la app en `App.tsx:72` y dispara `fetchContactInfo`, `fetchSiteStats` y `fetchReviews` en cada carga, incluida `/catalogo`, donde ninguno de esos tres datos se renderiza.
4. **Fuentes de Google Fonts cargadas de forma bloqueante.** `src/index.css:1` las importa con `@import url(...)` dentro de la hoja de estilos (tres familias, 10 pesos), lo que obliga al navegador a descargar y parsear el CSS local antes de descubrir que necesita el CSS remoto de Google, y solo entonces pedir las fuentes (`.woff2`). No hay `<link rel="preconnect">` en `index.html` para adelantar la conexión.
5. **`loading="lazy"` en imágenes visibles sin scroll.** La imagen de cada tarjeta del catálogo (`src/views/Catalogo.tsx:361-367`) usa `loading="lazy"` aunque las primeras tarjetas están siempre por encima del pliegue, retrasando el inicio de su descarga.

Esta spec cubre optimización de rendimiento de carga en el sitio público (imágenes, fuentes, alcance de datos por ruta). **No cubre** cambios de arquitectura (SSR/prerendering, CDN, cambio de proveedor de base de datos) ni el panel Admin, salvo el flujo de subida de imágenes que es la causa raíz del problema #1.

Instrucciones generales para el agente que implemente esta spec:
- Ningún cambio debe alterar el sistema de diseño visual documentado en `DESIGN.md` (tamaños, proporciones ni disposición de las tarjetas/imagenes).
- Mantener el stack actual (`AGENTS.md` sección 4); cualquier dependencia nueva debe justificarse por un beneficio claro y estar acotada al menor alcance posible (ver sección 1.3).
- No modificar el copy de precios, WhatsApp ni las reglas de negocio de `AGENTS.md` — esta spec es puramente técnica/rendimiento.

---

## 1. Optimización de imágenes de disfraces (prioridad crítica)

Las imágenes explican más de la mitad del tiempo de carga observado (~2 s de los ~2.5 s totales) y es la causa con mayor impacto/menor esfuerzo de corregir.

### 1.1 Redimensionar y comprimir en el momento de subida (Admin)
- **Actual:** `uploadCostumeImage()` (`src/services/adminService.ts:251-301`) sube el `File` seleccionado tal cual al bucket `costume-images`, sin redimensionar ni comprimir. El único control es tipo MIME permitido y tamaño máximo de 5MB (`ALLOWED_MIME_TYPES`, `MAX_IMAGE_BYTES`).
- **Requisito:** antes de subir el archivo a Supabase Storage, procesarlo en el navegador usando la Canvas API (sin dependencias nuevas): redimensionar al ancho máximo que realmente se consume en UI (ficha de detalle / galería, ver `src/views/CatalogoDetail.tsx`) — sugerido 1600px de ancho máximo para imagen principal/galería — y recodificar a `WEBP` con calidad ~80. Conservar JPG como fallback si el navegador no soporta `canvas.toBlob('image/webp')` (poco probable en navegadores modernos, pero cubrir el caso).
- **Criterio de aceptación:** una imagen subida desde Admin en formato PNG de >1MB queda almacenada en Storage como `.webp` de un tamaño sustancialmente menor (referencia: <300kB para una imagen de disfraz a 1600px de ancho), sin degradación visible en la ficha de detalle.

### 1.2 Migrar las imágenes ya existentes en Storage
- **Contexto:** las imágenes que hoy causan los ~2 s de carga en el ejemplo diagnosticado (`30ef1a75-...png` de 1,153 kB y `6d31e84f-...png` de 1,388 kB) ya están subidas; el fix de 1.1 solo cubre subidas futuras.
- **Requisito:** crear un script de migración en `scripts/` (ej. `scripts/optimize-existing-images.ts`, ejecutado manualmente vía `tsx`, no como parte del build) que recorra `costume_images` y `site_assets`, descargue cada imagen original, la redimensione/convierta a WebP con los mismos parámetros de 1.1, la vuelva a subir a Storage y actualice `storage_path` en la tabla correspondiente. Dado que este script corre en Node (no en navegador), requiere una librería de procesamiento de imágenes — usar `sharp` como dependencia de desarrollo (`devDependencies`), acotada a este script; no debe formar parte del bundle público.
- **Criterio de aceptación:** tras ejecutar el script, las imágenes de `costume-images` y `site-assets` en Storage son `.webp` livianas (mismo umbral de referencia de 1.1) y el catálogo/ficha de detalle siguen mostrando las imágenes correctas (sin URLs rotas).
- **Nota:** este punto requiere acceso a las credenciales de servicio de Supabase (`SUPABASE_SERVICE_ROLE_KEY` o equivalente ya usado por `supabaseAdmin`) para ejecutarse; coordinarlo como paso manual antes de cerrar la spec, no como parte del pipeline automático de build.

### 1.3 Imagen principal visible sin `lazy`
- **Actual:** todas las imágenes de tarjeta en `src/views/Catalogo.tsx:361-367` usan `loading="lazy"`, incluidas las primeras tarjetas de la grilla que están siempre por encima del pliegue (visibles sin hacer scroll).
- **Requisito:** quitar `loading="lazy"` de las primeras 3 tarjetas de la grilla (las que corresponden a la primera fila en desktop) y, si es viable sin alterar el diseño, añadir `fetchpriority="high"` a la primera. El resto de tarjetas (fuera del pliegue) mantiene `loading="lazy"`. Aplicar el mismo criterio a la imagen principal de `src/views/CatalogoDetail.tsx:121`.
- **Criterio de aceptación:** en el timeline de Network, la descarga de las imágenes de la primera fila arranca en paralelo con las peticiones de datos, no después de que el resto del layout ya se pintó.

---

## 2. Carga de fuentes web

### 2.1 `preconnect` a Google Fonts
- **Actual:** `index.html` no declara ningún `<link rel="preconnect">`; la primera petición a `fonts.googleapis.com` paga el costo completo de DNS+TLS antes de poder pedir el CSS de fuentes.
- **Requisito:** agregar en el `<head>` de `index.html`:
  ```html
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  ```
- **Criterio de aceptación:** en Network, la conexión a `fonts.gstatic.com` se establece en paralelo con la carga del HTML, no como paso secuencial posterior.

### 2.2 Reemplazar `@import` por `<link>` directo, y cargar el CSS de fuentes antes del bundle de la app
- **Actual:** `src/index.css:1` carga las tres familias vía `@import url(...)` dentro de la hoja de estilos local, lo que obliga a una cadena secuencial: HTML → `index.css` (bundle) → descubrir el `@import` → CSS remoto de Google → `.woff2`.
- **Requisito:** mover la carga de fuentes a un `<link rel="stylesheet">` directo en `index.html` (con el mismo `href` de Google Fonts que hoy arma el `@import`), eliminando el `@import` de `src/index.css`. Esto permite que el navegador descubra y empiece a descargar el CSS de fuentes en paralelo con el bundle de JS/CSS de la app, en vez de esperar a que Vite resuelva y sirva `index.css`.
- **Requisito adicional:** revisar los pesos de fuente realmente usados en el proyecto (grep de `font-` en componentes/Tailwind) y recortar la lista de `wght` solicitados a Google Fonts si hay pesos declarados que no se usan en ninguna vista, para reducir el payload de `.woff2` descargado.
- **Criterio de aceptación:** el `@import` de fuentes ya no existe en `src/index.css`; `index.html` carga el CSS de fuentes vía `<link>`; el peso total de `.woff2` descargados no aumenta respecto al actual (ideal: se reduce si se recortan pesos no usados).

---

## 3. Alcance de datos por ruta

### 3.1 No cargar `site_stats` / `reviews` en rutas que no los consumen
- **Actual:** `PublicDataProvider` (`src/context/PublicDataContext.tsx:29-59`) envuelve **todas** las rutas en `App.tsx:72` y dispara las tres peticiones (`fetchContactInfo`, `fetchSiteStats`, `fetchReviews`) en cada carga de página, incluida `/catalogo` y `/catalogo/:costumeSlug`, donde ninguno de esos datos se renderiza hoy.
- **Requisito:** identificar qué vistas consumen realmente `usePublicData()` (`src/context/PublicDataContext.tsx:68-70`) y diferir la carga de cada dato a la vista que lo necesita, en vez de dispararlos globalmente al montar la app. Alternativas válidas (elegir la que menos altere la estructura actual):
  - (a) mover el `useEffect` de carga desde el `Provider` global a un hook por vista (ej. `useContactInfo()`, `useSiteStats()`, `useReviews()`) que cada vista llama solo si los necesita; o
  - (b) mantener el contexto único pero cargar los datos de forma perezosa (lazy) la primera vez que algún componente activo realmente los solicita, no en el montaje inicial de `PublicDataProvider`.
- **Precisión encontrada en la implementación:** `contactInfo` (que incluye `working_hours`) **no puede diferirse** — lo consumen `Footer.tsx` y `WhatsAppButton.tsx`, ambos renderizados en **todas** las rutas fuera de `<Routes>` (`App.tsx`), además de `Catalogo.tsx`, `CatalogoDetail.tsx`, `Contacto.tsx` y `Servicios.tsx`. Solo `siteStats` y `reviews` los consume exclusivamente `Inicio.tsx`. Por eso el fix implementado mantiene `contactInfo` en `PublicDataProvider` (global, igual que antes) y saca `siteStats`/`reviews` a un hook aparte (`src/hooks/useHomeData.ts`) que solo usa `Inicio`.
- **Criterio de aceptación:** al navegar a `/catalogo` o `/catalogo/:costumeSlug` sin haber visitado antes `/`, el panel de Network ya no muestra peticiones a `site_stats` ni `reviews` (sí sigue apareciendo `contact_info`/`working_hours`, que es necesario en toda ruta).

### 3.2 Acotar columnas en `costumes_full` — congelada
- Este punto se retiró del alcance de esta spec: `/catalogo` y `/catalogo/:costumeSlug` comparten un único fetch (`useCostumes` en `App.tsx`) con todas las columnas del disfraz, así que recortar el `select` solo para la grilla requiere separar ese fetch en uno liviano (grilla) y uno completo (ficha) — un cambio de arquitectura mayor al previsto, para un ahorro marginal dado que el payload medido ya es pequeño (~1.5kB) y el cuello de botella real es la latencia de red (ver sección 4), no el tamaño del payload.
- Se documentó como spec aparte, congelada sin fecha de retoma: [docs/specs/specs_freeze/optimizacion_rendimiento_split_fetch_catalogo_ficha.spec.md](../specs_freeze/optimizacion_rendimiento_split_fetch_catalogo_ficha.spec.md).

---

## 4. Latencia de infraestructura Supabase (seguimiento operativo, fuera del código)

- **Hallazgo:** peticiones con payload de 1-1.7 kB tardan consistentemente ~700-720 ms. Esto no se explica por tamaño de datos ni por el código de la app; apunta a la región del proyecto Supabase (posible distancia geográfica desde Barranquilla/Colombia) o a un plan con cold start (proyectos free se "duermen" tras inactividad).
- **Acción recomendada (no es un cambio de código de esta spec):** verificar en el dashboard de Supabase la región del proyecto y el plan contratado. Si el proyecto está en una región lejana (ej. EE.UU. este, Europa) y existe una región más cercana a Latinoamérica disponible, evaluar migrar el proyecto. Si está en plan free, evaluar el impacto de cold starts y si se justifica un plan de pago.
- **Nota:** dejar esta sección documentada como hallazgo del diagnóstico; su resolución depende de una decisión de infraestructura/costos del negocio, no de un cambio en el repositorio.

---

## 5. Bundle JS del sitio público (prioridad baja, opcional)

- **Hallazgo:** el bundle público (`dist/assets/index-*.js`) pesa ~673 kB sin comprimir (~197 kB gzip). El panel Admin ya está separado con `lazy()` (`src/App.tsx:27`), lo cual es correcto. El resto de vistas públicas (`Inicio`, `Catalogo`, `CatalogoDetail`, `Servicios`, `NuestraHistoria`, `Contacto`) se importan de forma estática en `src/App.tsx:11-16`, todas en el bundle inicial.
- **Requisito (opcional, aplicar solo si el tiempo lo permite y no complica la navegación):** evaluar `lazy()` + `Suspense` para las vistas que no son la de aterrizaje más común (ej. `NuestraHistoria`, `Servicios`), replicando el patrón ya usado para `Admin`. No aplicar a `Inicio` ni `Catalogo`, que son las rutas de entrada más frecuentes y se benefician más de estar precargadas.
- **Criterio de aceptación:** si se implementa, el bundle inicial (`index-*.js`) se reduce en tamaño respecto al valor de referencia de 673 kB, sin introducir parpadeos ni estados de carga visibles perceptibles en la navegación normal.

---

## 6. Checklist de validación específico de esta spec

- [ ] Las imágenes nuevas subidas desde Admin se almacenan como WebP optimizado (sección 1.1).
- [ ] Script de migración (`scripts/optimize-existing-images.ts`, `npm run optimize-images`) entregado y documentado; **pendiente de ejecución manual** por el usuario con `SUPABASE_SERVICE_ROLE_KEY` propio — no se corrió contra producción en esta implementación (sección 1.2).
- [ ] Las primeras tarjetas visibles del catálogo y la imagen principal de la ficha ya no usan `loading="lazy"` (sección 1.3).
- [ ] `index.html` tiene `preconnect` a Google Fonts y el `@import` fue removido de `src/index.css` (sección 2).
- [ ] `/catalogo` y `/catalogo/:costumeSlug` ya no disparan peticiones a `site_stats` ni `reviews` (`contact_info`/`working_hours` sí siguen apareciendo, por ser necesarios en toda ruta) (sección 3.1).
- [x] Sección 3.2 (acotar columnas de `costumes_full`) congelada: ver spec aparte en `specs_freeze`, no bloquea el cierre de esta spec.
- [ ] Se documentó en esta spec (sección 4) el hallazgo de latencia de Supabase como pendiente operativo, sin bloquear el resto de la implementación.
- [ ] Ningún cambio alteró el sistema de diseño (`DESIGN.md`) ni las reglas de negocio de `AGENTS.md` (precios visibles, WhatsApp, sin mapas/dirección exacta).
- [ ] Se validó de nuevo con DevTools → Network (Disable cache activo) que `/catalogo?categoria=Negrita+Puloy` reduce su tiempo total de carga respecto a la línea base de ~2.5 s documentada en el diagnóstico inicial.
