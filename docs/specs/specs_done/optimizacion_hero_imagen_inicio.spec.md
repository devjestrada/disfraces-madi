# SPEC — Optimización de la carga del hero (imagen de fondo) de Inicio

## Contexto y alcance

Nuevo diagnóstico realizado sobre `/` (Inicio) en producción (`disfracesmadi.com`, DevTools → Network, "Disable cache" activo), a solicitud del usuario tras reportar que la carga de Inicio vuelve a sentirse lenta y señalar específicamente **la imagen de fondo del hero** como la responsable visual del retraso.

Hallazgo: el archivo en sí (`carnival_main_banner.webp`, 1376×768, ~185kB) **no tiene una regresión de peso** — corresponde exactamente a la optimización WebP ya aplicada en la spec cerrada `docs/specs/specs_done/optimizacion_carga_inicio.spec.md` (sección 4), y su transferencia de red por sí sola es rápida (~70-90ms en el waterfall capturado). El problema no es cuánto tarda en descargarse, sino **cuándo el navegador empieza a pedirlo**:

- `Inicio.tsx:116-121` renderiza `<img src={ASSETS.carnival_main_banner}>`.
- `ASSETS.carnival_main_banner` (`src/data.ts:1,10`) es un `import` de ES module del archivo `.webp`. Vite lo empaqueta como una URL con hash **incrustada solo dentro del bundle JS** (`index-*.js`), no como una referencia visible en el HTML inicial.
- El *preload scanner* del navegador (el mecanismo que descubre imágenes desde el HTML/CSS antes de ejecutar JS) no puede ver esta URL. La petición del hero solo se dispara después de: documento HTML → descarga del bundle JS → parseo/ejecución de JS → render de React → inserción del `<img>` en el DOM.
- En el waterfall de producción capturado, esto se ve como el hero image agrupado junto con `index-*.js`, `index-*.css` y las fuentes al final de la cadena de carga, en vez de arrancar en paralelo con el documento — pese a que, una vez solicitado, tarda muy poco en llegar. Es el patrón clásico de "imagen LCP descubierta tarde" en una SPA sin SSR.

Esta spec cubre **exclusivamente** la estrategia de carga de la imagen de fondo del hero de Inicio (y, de forma incidental, la prioridad de otras imágenes de la misma vista que compiten con ella por ancho de banda). **No reabre** los puntos ya cerrados en `optimizacion_carga_inicio.spec.md`:
- Sección 1 (TTFB del documento / hosting): si el retraso del documento HTML (~58-60s) sigue presente en el diagnóstico de producción, continúa siendo el hallazgo operativo de infraestructura ya documentado ahí, ajeno al código y fuera del alcance de esta spec.
- Secciones 2 y 3 (doble fetch de `costumes_full`, query de `reviews` apagada): ya implementadas.
- Sección 5 (consolidar efectos de datos): opcional, sin relación con este hallazgo.

Instrucciones generales para el agente que implemente esta spec:
- Ningún cambio debe alterar el sistema de diseño visual documentado en `DESIGN.md` (el hero debe verse idéntico: mismo recorte, mismo filtro `brightness-45 contrast-105`, mismo overlay).
- Mantener el stack actual (`AGENTS.md` sección 4); no agregar dependencias nuevas (nada de plugins de Vite para imágenes) — el fix es de ubicación/atributos, no de herramienta de build.
- No modificar copy, precios, WhatsApp ni reglas de negocio de `AGENTS.md` — esta spec es puramente técnica/rendimiento.

---

## 1. [Alto] Hacer descubrible el hero image antes de que cargue el bundle de JS

- **Actual:** el hero (`ASSETS.carnival_main_banner`) se importa como módulo ES en `src/data.ts:1,10` y se renderiza vía `<img>` en `Inicio.tsx:116-121`. Al depender del bundle JS para existir como URL, el navegador no puede empezar a descargarlo hasta que ese bundle se haya descargado, parseado y ejecutado — el paso más lento de toda la cadena de carga de una SPA sin SSR.
- **Requisito:**
  1. Mover el archivo a `public/` con un nombre estable y sin hash (ej. `public/hero-carnaval.webp`), y referenciarlo en `src/data.ts` por ruta absoluta (`/hero-carnaval.webp`) en vez de un `import` de módulo.
  2. Agregar en `index.html`, dentro de `<head>`, un `<link rel="preload" as="image" href="/hero-carnaval.webp" fetchpriority="high">` para que el navegador dispare la descarga desde el preload scanner del HTML, en paralelo con el JS/CSS, sin esperar a React.
  3. Agregar `fetchPriority="high"` al `<img>` del hero en `Inicio.tsx` (mismo patrón ya usado en `src/views/Catalogo.tsx:369` para la primera imagen del catálogo), para reforzar la prioridad una vez que React lo renderiza.
- **Criterio de aceptación:** en el panel Network de producción (Disable cache activo), la petición al hero image aparece entre las primeras del waterfall, iniciando en paralelo con `index-*.js`/`index-*.css` (no después de que estos terminen de ejecutarse), independientemente de cuánto tarde el documento HTML en responder.

---

## 2. [Medio] Bajar prioridad de otras imágenes de Inicio que compiten con el hero

- **Actual:** la imagen del Atelier Spotlight (`Inicio.tsx:267-272`, sección muy por debajo del pliegue) y las imágenes de las tarjetas de Categorías Destacadas (`Inicio.tsx:229-234`, también debajo del pliegue) no tienen atributo `loading`, por lo que el navegador las trata como eager por defecto, compitiendo por ancho de banda con el hero durante la carga inicial.
- **Requisito:** agregar `loading="lazy"` a la imagen de Atelier Spotlight y a las imágenes de las tarjetas de categorías destacadas. El hero (sección 1) queda como la única imagen eager/alta prioridad de la vista.
- **Criterio de aceptación:** en Network, al cargar `/`, las imágenes de categorías y del Atelier Spotlight se solicitan después del hero (o se difieren hasta acercarse al scroll, según soporte del navegador), sin degradar su apariencia final una vez visibles.

---

## 3. [Bajo, informativo] Confirmar que no hay regresión de peso/resolución del hero

- **Actual:** el archivo vigente (`carnival_main_banner.webp`, 1376×768, ~185kB) corresponde a la compresión aplicada en `optimizacion_carga_inicio.spec.md` sección 4 (WebP, calidad ~80). No se detectó regresión de peso en este diagnóstico.
- **Requisito:** no se requiere recomprimir el archivo en esta spec. Queda documentado como línea base para futuras revisiones: si la foto del hero se reemplaza más adelante, el nuevo archivo debe pasar por el mismo criterio (WebP, calidad ~80, ancho ajustado al render real, referencia <200kB).
- **Criterio de aceptación:** n/a — hallazgo informativo, sin acción de código asociada.

---

## 4. Checklist de validación específico de esta spec

- [ ] El hero se sirve desde una ruta estática (`public/`) con `<link rel="preload" as="image" fetchpriority="high">` en `index.html`, y ya no depende de la ejecución del bundle JS para iniciar su descarga (sección 1).
- [ ] El `<img>` del hero en `Inicio.tsx` tiene `fetchPriority="high"` (sección 1).
- [ ] Las imágenes del Atelier Spotlight y de las tarjetas de Categorías Destacadas usan `loading="lazy"` (sección 2).
- [ ] No hay regresión de peso/resolución del hero respecto a la línea base ya optimizada (~185kB, 1376×768) (sección 3).
- [ ] El hero se ve visualmente idéntico (recorte, filtro, overlay) — sin cambios de `DESIGN.md`.
- [ ] Ningún cambio alteró las reglas de negocio de `AGENTS.md` (precios visibles, WhatsApp, sin mapas/dirección exacta).
- [ ] Se validó de nuevo con DevTools → Network (Disable cache activo) en producción que la petición del hero arranca junto con el documento/JS/CSS, no al final de la cadena de carga.
