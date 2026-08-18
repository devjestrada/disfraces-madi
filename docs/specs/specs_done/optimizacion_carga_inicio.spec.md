# SPEC — Optimización de la carga de Inicio (home)

## Contexto y alcance

Diagnóstico realizado sobre `/` (Inicio) en producción (`disfracesmadi.com`, DevTools → Network, "Disable cache" activo): la carga completa de la página tarda cerca de **70 segundos** punta a punta. El waterfall muestra un problema dominante y varios secundarios, todos encadenados:

1. **TTFB del documento HTML ~60s (crítico).** La petición a `disfracesmadi.com` (0.8kB, tipo `document`) reporta ~1 min de tiempo total. Para un `index.html` estático de una SPA, ese tiempo solo se explica por el servidor/hosting (cold start de contenedor o función serverless, DNS/TLS lento, o el proceso Express generado en build — ver `package.json` script `clean: "rm -rf dist server.js"` — tardando en arrancar), no por el tamaño del recurso. Todo lo demás en el waterfall (JS, CSS, fuentes, datos, imágenes) solo empieza a pedirse después de que el documento termina de responder, así que este único factor explica la mayor parte de los ~70s totales.
2. **`costumes_full` se pide dos veces en cada carga de Home.** `App.tsx:43` llama `useCostumes(activeCatalogCategory)` de forma incondicional en **todas** las rutas (incluida `/`), y por separado `Inicio.tsx:67` llama a su propio `useCostumes()`. Resultado: dos preflight `OPTIONS` + dos `fetch` idénticos a `costumes_full?select=*` en paralelo, visibles como entradas duplicadas en el panel de Network, sin que Home use el resultado del hook de `App.tsx` para nada.
3. **`reviews` se pide aunque la sección de testimonios está apagada.** `Inicio.tsx:314` envuelve toda la sección "Our Queens" en `{false && (...)}` (nunca se renderiza), pero `useHomeData()` (`src/hooks/useHomeData.ts:27`) sigue trayendo `fetchReviews()` en cada carga de Home vía `Promise.all`, una query completa desperdiciada.
4. **Imágenes estáticas del hero y del Atelier Spotlight sin optimizar.** `src/assets/init_page/images/carnival_main_banner.jpg` pesa 452kB (1376×768) y `sra_madi_nuestra_historia.jpg` pesa 320kB (1000×750); ambas se sirven como JPEG sin recomprimir ni convertir a WebP, a diferencia de las imágenes de disfraces en Supabase Storage que ya pasan por el pipeline de optimización de `docs/specs/specs_done/optimizacion_rendimiento.spec.md` (sección 1).
5. **Efectos de datos de Home escalonados en vez de arrancar juntos.** `PublicDataProvider` (`fetchContactInfo`), `useHomeData` (`fetchSiteStats` + `fetchReviews`) y `useCostumes` de `Inicio.tsx` son tres efectos independientes en distintos niveles del árbol de componentes, cada uno con su propio preflight `OPTIONS`, que se disparan en momentos de montaje ligeramente distintos en vez de arrancar todos en el mismo tick.

Esta spec cubre exclusivamente la carga de `/` (Inicio). **No cubre** el split de fetch catálogo/ficha (ya documentado y congelado en `docs/specs/specs_freeze/optimizacion_rendimiento_split_fetch_catalogo_ficha.spec.md`) ni cambios de arquitectura mayores (SSR/prerendering).

Instrucciones generales para el agente que implemente esta spec:
- Ningún cambio debe alterar el sistema de diseño visual documentado en `DESIGN.md`.
- Mantener el stack actual (`AGENTS.md` sección 4); no agregar dependencias nuevas sin justificación clara.
- No modificar el copy de precios, WhatsApp ni las reglas de negocio de `AGENTS.md` — esta spec es puramente técnica/rendimiento.

---

## 1. [Crítico] Investigar el TTFB del documento (~60s)

- **Actual:** la petición al documento HTML de `/` tarda ~1 min en responder en producción. Esto no es reproducible corriendo `npm run dev` o `npm run preview` localmente porque depende del hosting/infraestructura de producción, no del código de la app.
- **Requisito:** este punto no se resuelve con un cambio de código en este repositorio; se documenta como hallazgo operativo con pasos de diagnóstico a ejecutar por el usuario en el panel del proveedor de hosting actual:
  1. Confirmar si el hosting tiene **cold start** (contenedor o función serverless que se "duerme" tras inactividad y tarda en despertar en la primera petición).
  2. Revisar si el `server.js` generado en build (Express, ver `package.json`) es el que sirve el sitio público en producción; si es así, evaluar si ese proceso es necesario para servir la SPA estática o si puede separarse (dejar Express solo para endpoints que sí lo requieran, ej. integraciones con `@google/genai`) sirviendo `dist/` como estático puro vía CDN/hosting estático.
  3. Si el proveedor ofrece "min instances" o plan sin cold start, evaluar el costo de habilitarlo frente al impacto medido (~60s en la primera visita de cada sesión de usuario).
- **Criterio de aceptación:** repetir el diagnóstico de Network en producción (Disable cache activo) tras el ajuste de hosting/config y confirmar que el TTFB del documento baja a un rango normal para HTML estático (referencia: <1s).

---

## 2. [Alto] Eliminar el doble fetch de `costumes_full` en Home

- **Actual:** `App.tsx:43` llama `useCostumes(activeCatalogCategory)` sin condicionar por ruta, así que dispara la query en **todas** las rutas, incluida `/`, aunque solo `/catalogo` y `/catalogo/:costumeSlug` usan su resultado (`App.tsx` pasa `costumes` a `<Catalogo>` y resuelve `activeCostume` para `<CatalogoDetail>`). En paralelo, `Inicio.tsx:67` llama a su **propio** `useCostumes()` para armar las tarjetas de categorías destacadas. El resultado son dos fetch idénticos a `costumes_full?select=*` (con sus dos preflight `OPTIONS`) en cada carga de Home, sin que el hook de `App.tsx` aporte nada en esa ruta.
- **Requisito:** condicionar el `useCostumes()` de `App.tsx` a las rutas que realmente consumen su resultado (`isCatalogRoute`, ya calculado en `App.tsx:39`), de forma que no dispare la query cuando la ruta activa es `/`, `/servicios`, `/nuestra-historia` o `/contacto`. `Inicio.tsx` conserva su propio `useCostumes()` sin cambios (ya filtra por `featured` internamente para las tarjetas de categorías).
- **Criterio de aceptación:** en Network, al cargar `/` aparece una única petición `costumes_full?select=*` (no dos). Al navegar a `/catalogo` o `/catalogo/:costumeSlug` la petición sigue apareciendo exactamente una vez, igual que hoy.

---

## 3. [Medio] No pedir `reviews` mientras la sección de testimonios está apagada

- **Actual:** `Inicio.tsx:314` envuelve la sección "Our Queens" (testimonios) en `{false && (...)}`, por lo que nunca se renderiza en producción. Sin embargo `useHomeData()` (`src/hooks/useHomeData.ts:27`) sigue disparando `fetchReviews()` junto a `fetchSiteStats()` en cada carga de `/`, pagando una query completa (preflight + fetch) por un dato que no se muestra.
- **Requisito:** mientras la sección de testimonios permanezca apagada, dejar de traer `reviews` en `useHomeData` (solo `fetchSiteStats`), documentando en el propio hook con un comentario que apunte a esta sección de la spec, para reactivarlo el día que se reactive la sección visual. Si el usuario prefiere mantener la sección apagada de forma permanente en vez de temporal, evaluar directamente remover el bloque muerto de `Inicio.tsx` en la misma spec (a decidir junto con el usuario en la revisión).
- **Criterio de aceptación:** en Network, al cargar `/` ya no aparece ninguna petición a `reviews?select=*`.

---

## 4. [Medio] Optimizar imágenes estáticas del hero y del Atelier Spotlight

- **Actual:** `src/assets/init_page/images/carnival_main_banner.jpg` (452kB, 1376×768) y `src/assets/init_page/images/sra_madi_nuestra_historia.jpg` (320kB, 1000×750) se importan y sirven tal cual (`src/data.ts`), sin recompresión ni conversión a WebP/AVIF. Ambas se cargan de forma *eager* (correcto, están sobre el pliegue en `Inicio.tsx:116` y `Inicio.tsx:267`), pero su peso es alto para lo que realmente se muestra en pantalla.
- **Requisito:** recomprimir ambos archivos a WebP con calidad ~80 (mismo criterio que `scripts/optimize-existing-images.ts` usa para Storage), manteniendo la resolución actual o ajustándola al ancho máximo real de renderizado, y actualizar las referencias en `src/data.ts`. Puede hacerse manualmente o extendiendo un script en `scripts/` que corra sobre `src/assets/` (separado del que ya cubre Supabase Storage).
- **Criterio de aceptación:** ambos archivos bajan de peso sustancialmente respecto a la línea base (452kB / 320kB — referencia objetivo: <150-200kB cada uno) sin degradación visible en el hero ni en la sección "El Corazón de Madi".

---

## 5. [Bajo, opcional] Consolidar el arranque de los efectos de datos de Home

- **Actual:** `PublicDataProvider` (`fetchContactInfo`), `useHomeData` (`fetchSiteStats`, y `fetchReviews` mientras siga activo antes de aplicar la sección 3) y `useCostumes` de `Inicio.tsx` son tres efectos independientes en distintos niveles del árbol de componentes (`App.tsx` → `PublicDataProvider` → `Inicio.tsx`), cada uno con su propio preflight `OPTIONS`, que se disparan en momentos de montaje ligeramente distintos en vez de arrancar todos en el mismo tick.
- **Requisito (opcional, bajo impacto frente a las secciones 1-3):** evaluar si conviene disparar estas queries de forma más sincronizada al montar Home, sin cambiar el reparto de responsabilidades ya documentado en `PublicDataContext.tsx` y `useHomeData.ts`. Abordar solo si el tiempo lo permite y sin complicar la estructura actual.
- **Criterio de aceptación (si se implementa):** en el waterfall de Network, las peticiones de datos de Home arrancan agrupadas en vez de escalonadas, sin cambiar el comportamiento funcional de ninguna vista.

---

## 6. Checklist de validación específico de esta spec

- [ ] Se documentó el hallazgo de TTFB (~60s) y los pasos de diagnóstico de hosting recomendados; su resolución de infraestructura queda a criterio/ejecución del usuario, sin bloquear el resto de la implementación (sección 1).
- [ ] Al cargar `/` en Network aparece una única petición `costumes_full?select=*`, no dos (sección 2).
- [ ] Al cargar `/` ya no aparece ninguna petición a `reviews?select=*` (o, alternativamente, se removió el bloque muerto de testimonios si así se acordó con el usuario) (sección 3).
- [ ] `carnival_main_banner.jpg` y `sra_madi_nuestra_historia.jpg` quedan optimizados (WebP, peso reducido) sin degradación visible (sección 4).
- [ ] (Opcional) Los efectos de datos de Home arrancan de forma más agrupada, sin romper el reparto de responsabilidades documentado entre `PublicDataContext.tsx` y `useHomeData.ts` (sección 5).
- [ ] Ningún cambio alteró el sistema de diseño (`DESIGN.md`) ni las reglas de negocio de `AGENTS.md` (precios visibles, WhatsApp, sin mapas/dirección exacta).
- [ ] Se validó de nuevo con DevTools → Network (Disable cache activo) en producción que `/` reduce su tiempo total de carga respecto a la línea base de ~70s documentada en este diagnóstico.
