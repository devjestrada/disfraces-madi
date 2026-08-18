## [Unreleased]

## [0.11.0] - 2026-08-17

### Added
- Compresión de imágenes a WebP (Canvas API) en el momento de subida desde Admin, tanto para imágenes de disfraces como para assets del sitio.
- `scripts/optimize-existing-images.ts` (`npm run optimize-images`) para migrar a WebP redimensionado las imágenes ya subidas a Storage antes de este cambio; script manual, no forma parte del build.
- `src/hooks/useHomeData.ts` para cargar `site_stats`/`reviews` solo en Inicio.

### Changed
- Las fuentes de Google se cargan vía `<link rel="preconnect">` + `<link rel="stylesheet">` en `index.html` en vez de `@import` bloqueante dentro de `index.css`; se recortó el peso 300 de Inter (sin uso en el proyecto).
- Las primeras tarjetas del catálogo (visibles sin scroll) ya no usan `loading="lazy"`; la primera además prioriza su descarga con `fetchPriority="high"`.
- `PublicDataContext` deja de cargar `site_stats`/`reviews` de forma global: solo `contactInfo`/`working_hours` se cargan en toda ruta (los necesitan Footer y WhatsAppButton); `/catalogo` y la ficha de disfraz dejan de disparar esas dos consultas.
- Servicios y Nuestra Historia se cargan con `lazy()`/`Suspense`, igual que el panel Admin, para reducir el bundle inicial del sitio público.

## [0.10.0] - 2026-08-12

### Changed
- Botón de acceso a Admin en el Navbar: ícono `User` a 22px con hover de fondo circular (según `DESIGN.md`), indicador de estado activo al estar en `/admin`, y reubicación al inicio del drawer mobile para evitar tener que hacer scroll para encontrarlo.

## [0.9.0] - 2026-07-26

### Added
- Meta tags dinámicos por ruta (title, description, Open Graph, Twitter Card, canonical) para Inicio, Catálogo, ficha de disfraz, Servicios, Nuestra Historia y Contacto.
- Datos estructurados JSON-LD: `LocalBusiness` en Inicio, `Product` (con precios y disponibilidad) y `BreadcrumbList` en catálogo y ficha de disfraz.
- Favicon del sitio (a partir del logo del Atelier) y `og-image.jpg` para vistas previas de enlaces.
- `robots.txt` (bloquea `/admin`) y `sitemap.xml` generado dinámicamente en cada build desde el catálogo de Supabase.
- Migración `supabase/012_gallery_alt_text.sql`: expone el `alt_text` real de cada imagen de la galería (antes solo se usaba en Admin, nunca llegaba al frontend público).

### Changed
- `Costume.gallery` pasa de `string[]` a `{ url, alt }[]` para transportar el texto alternativo real de cada imagen; se actualizó la normalización de datos y la ficha de disfraz en consecuencia.
- Imágenes del catálogo y miniaturas de la ficha de disfraz cargan con `loading="lazy"` para mejorar el rendimiento fuera del viewport inicial.

## [0.8.0] - 2026-07-26

### Added
- Panel Admin - Telas y Accesorios: conteo de disfraces asociados a cada tela/accesorio, con tooltip al hover que detalla los nombres.

### Changed
- Inicio: la sección "Categorías Destacadas" pasó de mostrar 4 categorías fijas a tarjetas dinámicas por cada categoría del catálogo con disfraces marcados como destacados, con foto elegida al azar entre ellos en cada carga de página; las categorías sin destacados dejan de mostrarse.

### Fixed
- Panel Admin - Disfraces: el contenedor de las vistas Lista/Galería ya no mantenía una altura fija igualada al formulario cuando una búsqueda dejaba pocos resultados, dejando un hueco vacío; ahora se ajusta al contenido filtrado.

## [0.7.0] - 2026-07-25

### Added
- Tallas de niño (4, 6, 8, 10, 12, 14, 16) disponibles junto a las tallas de adulto (XS-XXL) en cada disfraz.
- Las URLs de ficha de disfraz ahora usan el slug (`/catalogo/<slug>`) en vez del uuid, con redirección automática desde enlaces antiguos por uuid.
- Nueva pestaña **Telas y Accesorios** en el panel Admin, con CRUD completo (crear, editar, eliminar); el borrado se bloquea si la tela/accesorio está en uso por algún disfraz.
- Búsqueda rápida por texto en las vistas Tabla/Lista/Galería de Disfraces y en las listas de Telas y Accesorios.
- Autocompletado del texto alternativo de cada imagen con el nombre del disfraz al subir imágenes en la Galería.
- Tags de telas y accesorios seleccionados, visibles debajo de cada checklist en la Ficha técnica.
- Migración `supabase/011_child_sizes_and_optional_rental.sql`: agrega las tallas de niño al enum `costume_size_enum` y vuelve opcional `costumes.rental_price`.

### Changed
- El precio de alquiler y la descripción dejan de ser obligatorios al crear/editar un disfraz en Admin; se ocultan en catálogo/ficha cuando no están definidos.
- Los campos de precio en Admin (alquiler, venta, depósito) ahora muestran una máscara de moneda en vivo (ej. `$ 150.000`).
- Se quitó la funcionalidad "Ordenar Por" del catálogo público.
- El panel Admin - Disfraces usa un layout de 2 columnas en escritorio (listado a la izquierda, formulario/galería/ficha técnica a la derecha), con la altura del listado sincronizada dinámicamente para terminar justo donde termina la Ficha técnica.
- La vista "Lista" del listado de Disfraces pasó de una columna a un grid de 3 columnas en escritorio; ya no muestra el slug (tampoco la vista "Tabla").
- `docs/specs/specs_done/admin_insights_dashboard.spec.md`: se acotó definitivamente a la Fase 1 (ya implementada); las "propuestas adicionales" (tasa de interés, valor gestionado, destacados sin movimiento, estacionalidad, exportar CSV) se trasladaron a `docs/specs/specs_freeze/admin_insights_dashboard_fase2.spec.md`, en espera sin fecha definida.
- `AGENTS.md`: se documentó el propósito de la carpeta `docs/specs/specs_freeze` (specs en espera indefinida, ni pendientes activas ni implementadas).

## [0.6.0] - 2026-07-18

### Added
- Nueva pestaña **Insights** en el panel Admin (Fase 1): selector de periodo, KPI de total de alquileres con variación, tops de disfraces más alquilados/visualizados con drawer de detalle completo, tabla histórica de alquileres con búsqueda/filtro/orden/paginación, importación de CSV desde el navegador y utilidad de vinculación manual con sugerencias automáticas.
- Tracking interno propio (sin analítica de terceros): tabla `costume_events` (vistas de ficha y clics de "Agendar por WhatsApp"), instrumentado en `CatalogoDetail.tsx`, con deduplicación anti-sobreconteo en `localStorage`.
- Migraciones `009_costume_events.sql` y `010_rental_history.sql` (+ tabla `costume_label_aliases`), documentadas en `supabase/README.md` y `docs/SUPABASE_SETUP.md`.

## [0.5.0] - 2026-07-18

### Added
- Se agregó el campo de depósito (`depositPrice`/`deposit_price`) al modelo de datos, con migración `supabase/008_deposit_price.sql` (columna nueva + vista `costumes_full` actualizada) y su registro en `docs/SUPABASE_SETUP.md`.
- La ficha de disfraz ahora muestra precio de alquiler, venta (si aplica) y depósito reembolsable en COP, agrupados semánticamente (alquiler + depósito en una tarjeta, venta en otra); el catálogo muestra alquiler y venta (sin depósito) en cada tarjeta.
- Se agregó un botón de acceso a `/admin` en el `NavBar` (desktop y menú móvil).
- El panel Admin permite asignar el depósito de cada disfraz, muestra progreso individual y tolerancia a fallos al subir varias imágenes a la vez (concurrencia de 3), y autoguarda el texto alternativo de cada imagen con indicador de estado.

### Changed
- `App.tsx` ahora carga la vista `Admin` con `React.lazy()`/`Suspense` en vez de un import estático, sacando el panel administrativo (login, CRUD de disfraces, subida de imágenes) del bundle público inicial; queda en un chunk aparte (`Admin-*.js`, ~40KB) que solo se descarga al entrar a `/admin`.
- Se corrigieron textos menores: tilde de "Diseñadora" en `Admin.tsx`, y el copy de sanitización/devoluciones en `Catalogo.tsx` y `Servicios.tsx` ahora usa "higienizado(s)" en vez de "sanitizado(s)" y suaviza el plazo de devolución.
- `AGENTS.md`: se revirtió la política de precios — ahora se exige publicar precio de alquiler, venta y depósito en vez de ocultarlos.
- `AGENTS.md`: se formalizó el flujo de trabajo por spec con dos puntos de revisión explícitos del usuario (redacción de la spec y plan de implementación) antes de que el agente continúe.
- Se corrigió el copy del catálogo que afirmaba "no publicamos tarifas fijas", ahora coherente con la nueva política de precios públicos.

### Fixed
- Se corrigió el recorte de imágenes en viewports intermedios (tablet, ~640-1023px) en las tarjetas del catálogo, la imagen principal y las miniaturas de la ficha de disfraz.
- `AGENTS.md`: al finalizar una spec ahora se exigen dos Pull Requests independientes (código funcional en rama `feature`, y cierre documental en rama `chore` con bump de versión, `CHANGELOG.md` y el movimiento de la spec a `specs_done`), en vez de mezclarlo todo en un solo PR.
- `AGENTS.md`: la redacción de specs en `specs_backlog` ahora se delega a un subagente independiente por archivo cuando hay varios pendientes, y se permite renombrar el archivo de spec si el nombre no es descriptivo o colisiona con uno existente en `specs_done`/`specs_backlog`.

## [0.4.2] - 2026-07-18

### Changed
- Se redimensionaron y comprimieron las 7 imágenes locales de `src/assets/` (logo, banner del hero, 4 categorías destacadas y "nuestra historia") ajustando su resolución al tamaño real en pantalla y convirtiendo las fotos de PNG a JPEG; el peso total de estos assets bajó de ~13.8MB a ~1.6MB sin pérdida visible de calidad.
- Se aprobaron (fijados a versión exacta) los scripts de instalación de `@google/genai`, `esbuild`, `fsevents` y `protobufjs` en el nuevo campo `allowScripts` de `package.json` (npm 11), eliminando la advertencia de `npm install`.

### Removed
- Se eliminó la imagen local sin uso `atelier_madi_1783825203627.jpg` de `src/assets/images/`.

## [0.4.1] - 2026-07-17

### Changed
- `fetchCostumesFull` y `fetchReviews` en `src/services/dataService.ts` ya no sustituyen datos locales de muestra cuando Supabase falla o no está configurado; ahora retornan una lista vacía para que la app dependa exclusivamente de los datos reales de Supabase.

### Removed
- Se eliminaron los arrays de datos ficticios `COSTUMES` y `REVIEWS` de `src/data.ts` (disfraces y testimonios de muestra), junto con el fallback local correspondiente en `Catalogo.tsx` y `CatalogoDetail.tsx`.
- Se eliminaron las imágenes locales sin uso `gala_cumbia_dress_1783825177019.jpg` y `marimonda_costume_1783825190583.jpg` de `src/assets/images/`.

## [0.4.0] - 2026-07-17

### Added
- Se incorporó routing real basado en URLs con `react-router-dom` (`/`, `/catalogo`, `/catalogo/:costumeId`, `/servicios`, `/nuestra-historia`, `/contacto`, `/admin`), reemplazando el estado interno `currentView` de `App.tsx`.
- Se agregó una vista `NotFound` (`src/views/NotFound.tsx`) para rutas inexistentes, con tono de marca y CTA de vuelta a Inicio.
- Se agregó `public/_redirects` para el fallback SPA en Netlify, de forma que recargar en cualquier ruta interna (`/catalogo`, `/admin`, etc.) no produzca un 404 del servidor.

### Changed
- El filtro de categoría del catálogo ahora se refleja en la URL como query param (`/catalogo?categoria=...`), permitiendo compartir y recargar links con el filtro aplicado.
- El acceso al panel admin pasó del hash `#admin` a la ruta real `/admin`; los enlaces con el hash legado redirigen automáticamente.
- `Navbar.tsx` y `Footer.tsx` migraron de `onNavigate` a `Link`/`useNavigate` de `react-router-dom`, derivando el estado "activo" desde `useLocation()`.

## [0.3.0] - 2026-07-17

### Added
- Se agregó mensajería DOM propia en el panel admin (`src/components/Toast.tsx` y `src/components/ConfirmDialog.tsx`), reemplazando `window.confirm` en la eliminación de disfraces y estandarizando el feedback de éxito/error/advertencia.
- Se implementó un submenú de administración con secciones condicionales ("Disfraces" / "Configuración del sitio"), donde solo se renderiza la sección seleccionada.
- Se añadieron 3 vistas alternables (Tabla, Lista, Galería) para el listado de disfraces en el panel admin, cada una con altura limitada y scroll vertical propio.
- Se documentó en `DESIGN.md` (sección 5) el estándar obligatorio de no usar `alert`/`confirm`/`prompt` nativos.

### Changed
- Se corrigió el mapeo de datos en `src/services/dataService.ts` para traducir correctamente los campos `is_available`, `rental_price`, `sale_price` y `reviews_count` (snake_case de Supabase) a sus equivalentes camelCase usados por la UI pública.
- Se ajustaron las cards del catálogo público para no recortar la imagen del disfraz en viewports móviles.
- Se ajustó el texto del selector de talla en la ficha de producto ("Tallas Disponibles") y el aviso de ajuste por sastre.
- Se actualizó el copy del botón de "Nuestra Historia" a "Explorar".
- Se ajustaron las imágenes de la vista Galería (selector de disfraces y galería de imágenes por disfraz) a proporción retrato 4:5 para mostrar el disfraz completo.

### Removed
- Se eliminó el botón "Consultar por WhatsApp" duplicado en la ficha individual de producto.
- Se eliminó el botón de favoritos (corazón) de toda la aplicación (Navbar, Catálogo, ficha de producto e Inicio), incluyendo su estado y persistencia en `localStorage`.

## [0.2.0] - 2026-07-15

### Added
- Se agregaron las migraciones `005_admin_auth.sql`, `006_admin_rls.sql` y `007_storage_admin.sql` para iniciar el módulo administrativo en Supabase.
- Se creó la guía operativa `docs/SUPABASE_SETUP.md` con pasos de configuración, verificación y rollback para entornos nuevos.
- Se añadió la vista inicial de acceso administrativo en `src/views/Admin.tsx`, con login por Supabase Auth y validación de membresía admin.
- Se implementó `src/services/adminService.ts` con operaciones de catálogo e imágenes (CRUD de disfraces, carga múltiple, primaria, orden, alt text y eliminación).
- Se extendieron los tipos administrativos en `src/types.ts` para soportar flujos de panel.
- Se incorporó gestión de ficha técnica por disfraz (detalles, telas, accesorios y tallas) con guardado completo en tablas relacionales.
- Se añadieron altas rápidas de telas y accesorios desde el panel admin.
- Se implementó el módulo de configuración del sitio en el panel admin (estadísticas, contacto, horarios y assets institucionales).
- Se añadieron servicios para `site_stats`, `contact_info`, `working_hours` y `site_assets` con soporte de carga a bucket `site-assets`.

### Changed
- Se dejó siempre visible el texto descriptivo de las categorías destacadas en Inicio.
- La navegación desde las categorías destacadas ahora abre Catálogo con la categoría preaplicada y consulta filtrada desde Supabase.
- El filtro "Solo Disponibles" fue retirado del Catálogo y las tallas visibles ahora se ajustan a los disfraces mostrados.
- Los CTA y superficies de WhatsApp fueron estandarizados con un único icono compartido basado en `react-icons`.
- Se actualizó `supabase/README.md` para reflejar el nuevo orden de migraciones y apuntar a la guía completa de setup.
- Se incorporó un cliente dedicado de Supabase para sesión admin persistente en `src/lib/supabase.ts`.
- Se habilitó el acceso a la vista admin desde hash `#admin` en `src/App.tsx`.
- La vista `src/views/Admin.tsx` evolucionó a un panel funcional con listado, formulario de edición y galería operativa por disfraz.
- La vista `src/views/Admin.tsx` ahora incluye módulo de relaciones N:N y detalle ordenable por líneas para completar la ficha técnica.

## [0.1.0] - 2026-07-14

### Added
- Registro de cambios correspondiente a la PR #1: "chore: preparar cambios y validaciones locales".
- Se añadieron imágenes de assets y specs en `docs/specs/`.

### Changed
- Se ejecutaron validaciones locales (`tsc --noEmit` y `vite build`).
- Se mantuvieron las reglas de negocio de no publicar precios ni direcciones exactas en la UI.

---

## [0.0.0] - 2026-07-14

### Changed
- Merge de `feat/prepare-commit-202607141220` (PR #1): varios archivos actualizados y recursos añadidos.
