# SPEC — Optimización SEO y posicionamiento en buscadores

## Contexto y alcance

El sitio es una SPA 100% client-side (`React 19` + `react-router-dom`, sin SSR ni prerendering) desplegada como estática con fallback de rutas (`public/_redirects`: `/* /index.html 200`). Hoy no existe ninguna infraestructura de SEO:

- `index.html` tiene un único `<title>` estático para todas las rutas y **ningún** `<meta name="description">`, Open Graph, Twitter Card ni `<link rel="canonical">`.
- No hay `sitemap.xml` ni `robots.txt` en `public/`.
- No hay favicon (`find` no encontró ningún `favicon.*` en el repo).
- No hay datos estructurados (`JSON-LD`) de ningún tipo (`LocalBusiness`, `Product`, `BreadcrumbList`).
- Las imágenes del catálogo usan `alt={costume.name}` genérico (`CatalogoDetail.tsx:95,129`, `Catalogo.tsx:334`); el modelo admin ya tiene un campo `alt_text` editable por imagen (`AdminCostumeImage.alt_text`, `src/types.ts:123`) pero el modelo público `Costume`/`gallery: string[]` no lo expone, así que ese contenido nunca llega al frontend.
- El contenido de contacto (`src/data.ts`) ya usa el copy autorizado por `AGENTS.md` ("Visitas exclusivas con cita previa" / "Barranquilla, Atlántico, Colombia"), sin dirección exacta — cualquier dato estructurado de `LocalBusiness` debe reutilizar exactamente ese copy, nunca una dirección real.

Esta spec cubre SEO técnico de base, contenido/keywords y SEO local, **sin** introducir SSR/prerendering (cambio de arquitectura descartado explícitamente para esta iteración). Se deja constancia de esa limitación en la sección 6, ya que afecta directamente a las vistas previas de enlaces en WhatsApp/redes sociales (canal principal de conversión del negocio).

Instrucciones generales para el agente que implemente esta spec:
- Todo copy nuevo (títulos, descripciones meta, contenido de página) debe respetar el tono cercano/artesanal y las reglas de negocio de `AGENTS.md` (precios visibles, sin dirección exacta ni mapas, WhatsApp como único CTA).
- Ningún cambio de esta spec debe alterar el sistema de diseño visual documentado en `DESIGN.md`.

---

## 1. Meta tags dinámicos por ruta

### 1.1 Título y descripción únicos por vista
- **Actual:** `index.html:6` define un único `<title>` estático (`"Disfraces Madi - Alquiler de disfraces del Carnaval de Barranquilla."`) para todas las rutas; no existe ningún `<meta name="description">`.
- **Requisito:** cada ruta pública (`/`, `/catalogo`, `/catalogo/:costumeSlug`, `/servicios`, `/nuestra-historia`, `/contacto`) debe establecer su propio `<title>` y `<meta name="description">` al montarse, mediante un hook/componente reutilizable (ej. `useDocumentMeta` en `src/hooks/`) que actualice `document.title` y el contenido de la etiqueta meta correspondiente vía `useEffect`, sin dependencias nuevas de terceros (no se requiere `react-helmet`, ya que solo se necesita mutar el `<head>` en cliente).
- **Contenido sugerido por ruta:**
  | Ruta | Título | Descripción |
  |---|---|---|
  | `/` | `Disfraces Madi \| Alquiler y Venta de Disfraces del Carnaval de Barranquilla` | Presentación general + CTA de agendar cita, mencionando Carnaval de Barranquilla y las categorías principales (Cumbia, Garabato, Marimonda, etc.) |
  | `/catalogo` | `Catálogo de Disfraces de Carnaval \| Disfraces Madi` | Menciona alquiler y venta, y que se puede filtrar por categoría/traje típico |
  | `/catalogo/:costumeSlug` | `{costume.name} \| Alquiler y Venta \| Disfraces Madi` | Generada a partir de `costume.description` (primeros ~155 caracteres), incluyendo precio de alquiler cuando esté disponible |
  | `/servicios` | `Servicios \| Disfraces Madi` | Resumen de servicios ofrecidos |
  | `/nuestra-historia` | `Nuestra Historia \| Disfraces Madi` | Resumen de la trayectoria/artesanía del Atelier |
  | `/contacto` | `Contacto y Cita Previa \| Disfraces Madi` | Menciona "visitas exclusivas con cita previa" y Barranquilla, sin dirección exacta |
- **Criterio de aceptación:** al navegar entre rutas (sin recargar), `document.title` y el contenido de `<meta name="description">` cambian correctamente para reflejar la vista activa; ver el HTML fuente de cada ruta (`view-source:`) confirma el título correcto tras la carga inicial.

### 1.2 Open Graph y Twitter Cards
- **Requisito:** agregar meta tags Open Graph (`og:title`, `og:description`, `og:type`, `og:url`, `og:image`, `og:locale=es_CO`) y Twitter Card (`twitter:card=summary_large_image`, `twitter:title`, `twitter:description`, `twitter:image`) actualizados dinámicamente junto con 1.1, reutilizando el mismo hook.
- **`og:image`:** usar `costume.primaryImage` en la ficha de detalle; en el resto de rutas usar una imagen de marca fija (ej. logo/hero del Atelier) alojada en `public/` o Supabase Storage, con dimensiones recomendadas 1200×630px.
- **Criterio de aceptación:** las etiquetas OG/Twitter están presentes en el DOM tras la carga de cada ruta. **Nota:** por ser una SPA sin SSR, esto solo sirve para crawlers que ejecutan JavaScript (ver limitación documentada en la sección 6) — no resuelve por sí solo la vista previa en WhatsApp.

### 1.3 `<link rel="canonical">`
- **Requisito:** cada ruta debe declarar su URL canónica absoluta (ej. `https://<dominio>/catalogo/marimonda-real`), actualizada dinámicamente igual que 1.1/1.2, para evitar contenido duplicado entre variantes de URL (ej. con/sin query params de categoría en `/catalogo`).
- **Criterio de aceptación:** el `<link rel="canonical">` apunta siempre a la URL "limpia" de la vista (sin parámetros de tracking si los hubiera).

---

## 2. Indexación: `robots.txt` y `sitemap.xml`

### 2.1 `robots.txt`
- **Requisito:** crear `public/robots.txt` permitiendo el rastreo de todas las rutas públicas y bloqueando explícitamente `/admin` (el panel administrativo no debe indexarse), y referenciando el sitemap.
- **Contenido base:**
  ```
  User-agent: *
  Allow: /
  Disallow: /admin
  Sitemap: https://<dominio>/sitemap.xml
  ```
- **Criterio de aceptación:** `https://<dominio>/robots.txt` es accesible tras el build y bloquea `/admin`.

### 2.2 `sitemap.xml`
- **Requisito:** generar un `sitemap.xml` con las rutas estáticas (`/`, `/catalogo`, `/servicios`, `/nuestra-historia`, `/contacto`) y una entrada por cada disfraz disponible (`/catalogo/:slug`), incluyendo `<lastmod>`.
- **Decisión de generación:** dado que el catálogo vive en Supabase y cambia dinámicamente (altas/bajas de disfraces vía Admin), un archivo estático en `public/` quedaría desactualizado. Se recomienda un script de build (`scripts/generate-sitemap.ts` o similar, ejecutado como paso previo a `vite build`, ej. `"build": "tsx scripts/generate-sitemap.ts && vite build"`) que consulte Supabase (mismo cliente que `dataService.ts`) y escriba `public/sitemap.xml` antes de que Vite copie `public/` a `dist/`.
- **Criterio de aceptación:** tras `npm run build`, `dist/sitemap.xml` contiene todas las rutas estáticas y una entrada por cada disfraz con `is_available = true`.

### 2.3 Favicon y metadatos de PWA básicos
- **Hallazgo:** no existe ningún favicon en el repo; el sitio no tiene ícono en pestañas del navegador ni en resultados de búsqueda/compartidos.
- **Requisito:** agregar `public/favicon.ico` (o `favicon.svg` + variantes PNG) basado en la identidad visual del Atelier (ver `DESIGN.md`), y referenciarlo en `index.html` (`<link rel="icon">`).
- **Criterio de aceptación:** el ícono aparece en la pestaña del navegador y en `dist/` tras el build.

---

## 3. Datos estructurados (JSON-LD)

### 3.1 `LocalBusiness` en la página de inicio
- **Requisito:** inyectar un bloque `<script type="application/ld+json">` con schema.org `LocalBusiness` (o `ClothingStore`) en `/`, usando **exclusivamente** el copy ya autorizado de `src/data.ts` (`contactInfo.address = "Visitas exclusivas con cita previa"`, `contactInfo.city = "Barranquilla, Atlántico, Colombia"`), el teléfono/WhatsApp público, horarios (`workingHours`) y redes sociales si existen.
- **Restricción explícita (`AGENTS.md`):** el campo `address` de schema.org (`PostalAddress`) **no debe** incluir calle/número exactos; usar únicamente `addressLocality: "Barranquilla"`, `addressRegion: "Atlántico"`, `addressCountry: "CO"`, sin `streetAddress`. No integrar coordenadas geográficas (`geo`) que permitan ubicar la tienda con precisión.
- **Criterio de aceptación:** el JSON-LD valida en la herramienta de prueba de resultados enriquecidos de Google sin errores, y no expone ninguna dirección de calle.

### 3.2 `Product` en la ficha de disfraz
- **Requisito:** en `/catalogo/:costumeSlug`, inyectar JSON-LD `Product` con `name`, `description`, `image`, y `offers` (precio de alquiler y/o venta en COP, `priceCurrency: "COP"`, `availability` según `costume.isAvailable`).
- **Criterio de aceptación:** el JSON-LD de cada ficha valida correctamente y refleja el precio visible en pantalla (consistente con `AGENTS.md` sección 1, transparencia de precios).

### 3.3 `BreadcrumbList` en catálogo y ficha
- **Requisito:** agregar breadcrumbs estructurados (`Inicio > Catálogo > {categoría} > {nombre del disfraz}`) para mejorar la presentación en resultados de búsqueda. No es necesario que sean visibles en UI si no encajan con el diseño actual (ver `DESIGN.md`); pueden ser solo JSON-LD.
- **Criterio de aceptación:** el JSON-LD de breadcrumbs valida y refleja jerárquicamente la ruta real de navegación.

---

## 4. Contenido, encabezados y palabras clave

### 4.1 Jerarquía de encabezados (`h1`–`h3`)
- **Requisito:** auditar cada vista pública y asegurar que exista un único `<h1>` por página, descriptivo y con palabra clave relevante (ej. en `/catalogo/:costumeSlug`, el `<h1>` debe ser el nombre del disfraz; en `/`, el `<h1>` debe mencionar "Carnaval de Barranquilla" y "disfraces"). Corregir cualquier vista que hoy no tenga `<h1>` o que use encabezados fuera de orden (`h3` sin `h2` previo, etc.).
- **Criterio de aceptación:** cada ruta pública tiene exactamente un `<h1>` y una jerarquía de encabezados sin saltos.

### 4.2 Texto alternativo (`alt`) real por imagen
- **Actual:** `CatalogoDetail.tsx:95,129` y `Catalogo.tsx:334` usan `alt={costume.name}` (y una variante con índice) para todas las imágenes de un disfraz, ignorando el campo `alt_text` que ya existe por imagen en el modelo admin (`AdminCostumeImage.alt_text`).
- **Requisito:** extender el modelo público `Costume`/`gallery` (hoy `gallery: string[]` en `src/types.ts:16`) para transportar el `alt_text` de cada imagen junto a su URL (ej. `gallery: { url: string; alt: string }[]`), actualizando `dataService.ts` (`normalizeCostumeRecord`) para mapear `alt_text` desde Supabase, con fallback a `costume.name` cuando el campo esté vacío. Actualizar `Catalogo.tsx` y `CatalogoDetail.tsx` para consumir el nuevo shape.
- **Criterio de aceptación:** las imágenes de la galería usan el `alt_text` cargado desde Admin cuando existe, y solo caen al nombre genérico del disfraz si el campo está vacío.

### 4.3 Contenido enfocado en palabras clave locales
- **Requisito:** revisar el copy de `Inicio.tsx`, `Servicios.tsx` y `NuestraHistoria.tsx` para asegurar presencia natural (sin keyword stuffing) de términos de búsqueda relevantes: "disfraces Carnaval de Barranquilla", "alquiler de disfraces Barranquilla", nombres de las categorías del modelo (`Cumbia`, `Garabato`, `Mapalé`, `Marimonda`, `Negrita Puloy`, `Congo`, `Monocuco`, `Muerte`, `Fantasía`), y "disfraces artesanales"/"a la medida". No agregar párrafos nuevos solo por SEO si rompen el tono cercano; priorizar ajustar copy ya existente.
- **Criterio de aceptación:** el copy revisado mantiene el tono de marca (`AGENTS.md` sección 1) y no introduce ningún dato de precio/dirección que contradiga las reglas de negocio.

---

## 5. Rendimiento y Core Web Vitals (soporte a SEO)

### 5.1 Imágenes optimizadas
- **Requisito:** confirmar que las imágenes servidas desde Supabase Storage/`public/` incluyan `loading="lazy"` en imágenes fuera del viewport inicial (galería de catálogo, thumbnails), y `width`/`height` explícitos (o `aspect-ratio` en CSS) para evitar layout shift (CLS). Revisar `Catalogo.tsx` y `CatalogoDetail.tsx`.
- **Criterio de aceptación:** Lighthouse (Performance) no reporta imágenes sin dimensiones ni imágenes above-the-fold cargadas con `lazy` (eso perjudica LCP).

### 5.2 Auditoría Lighthouse de referencia
- **Requisito:** correr Lighthouse (Chrome DevTools o CLI) sobre `/`, `/catalogo` y una ficha de detalle antes y después de implementar esta spec, documentando el puntaje de SEO/Performance/Accessibility como referencia. No es necesario alcanzar un puntaje específico, solo dejar constancia de la mejora.
- **Criterio de aceptación:** existe un registro (puede ir en la sección de notas de cierre de esta spec) del puntaje antes/después.

---

## 6. Limitación conocida: SPA sin SSR/prerendering (fuera de alcance)

- **Problema:** al ser una SPA 100% client-side, el HTML inicial servido (`dist/index.html`) no contiene el contenido real de cada página (títulos, descripciones, precios) hasta que React ejecuta en el navegador. Los crawlers de **WhatsApp, Facebook y otras redes sociales no ejecutan JavaScript** al generar vistas previas de enlaces, por lo que los meta tags dinámicos de la sección 1 **no se reflejarán** al compartir un link (ej. de una ficha de disfraz) por WhatsApp — que es el canal principal de conversión del negocio (`AGENTS.md` sección 2). Google sí suele ejecutar JS para indexar, aunque con retraso frente a HTML estático.
- **Decisión de esta spec:** no se aborda SSR/SSG/prerendering en esta iteración (cambio de arquitectura mayor, descartado explícitamente en el alcance acordado con el usuario).
- **Mitigación mínima recomendada (dejar documentada, no implementar aquí salvo que el usuario lo pida al revisar):** los meta tags **estáticos** de `index.html` (título, descripción y `og:image` genéricos, sección 1) sí se ven reflejados en cualquier link compartido de la home, porque están en el HTML servido sin necesidad de JS. El problema afecta específicamente a fichas de disfraz individuales (`/catalogo/:costumeSlug`), donde cada producto necesitaría su propio `og:image`/título para verse bien al compartirse.
- **Recomendación a futuro (spec separada):** evaluar prerendering estático solo para las rutas de ficha de producto (ej. un paso de build que genere un `index.html` por disfraz con sus meta tags ya embebidos, sin necesidad de SSR completo), o migrar a un framework con soporte SSR/SSG (Next.js, Astro, Remix) si el negocio prioriza que cada disfraz se vea bien al compartirse por WhatsApp.

---

## 7. Fuera de alcance / no tocar

- SSR, SSG o prerendering (ver sección 6).
- Cambios al flujo o las opciones del botón flotante de WhatsApp (`AGENTS.md` sección 2).
- Cualquier integración de mapas o exposición de dirección de calle exacta (`AGENTS.md` sección 1).
- Cambios al sistema de diseño visual (`DESIGN.md`) más allá de agregar el favicon.
- Analítica/tracking (Google Search Console, Google Analytics) — se puede dejar como nota para una spec futura si el usuario lo solicita, pero no está incluido aquí.

---

## Notas para el agente de implementación

- Priorizar en este orden: 2.3 (favicon, rápido y de alto impacto visual) → 1.1/1.2/1.3 (meta tags dinámicos) → 2.1/2.2 (robots.txt/sitemap) → 3.x (JSON-LD) → 4.x (contenido/alt) → 5.x (performance).
- El dominio real de producción (`https://<dominio>`) debe confirmarse con el usuario antes de cerrar 1.3, 2.1, 2.2 y 3.x, ya que todos requieren URLs absolutas.
- Para 2.2 (sitemap dinámico), confirmar con el usuario si prefiere el enfoque de script de build propuesto u otra alternativa (ej. función serverless/Edge que genere el sitemap on-demand), según lo que ya soporte el hosting actual.
- Validar manualmente con Lighthouse y con el validador de resultados enriquecidos de Google (JSON-LD) antes de dar por cerrada la spec.
