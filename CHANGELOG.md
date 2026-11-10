## [Unreleased]

## [0.15.1] - 2026-11-10

### Fixed
- Las campañas de Instagram con 2 disfraces por carrusel ya no generan un carrusel de una sola foto cuando el número de disfraces (de una categoría o en total) es impar; el sobrante se suma a otro carrusel, que queda de 3. Instagram rechaza los carruseles de menos de 2 imágenes.

## [0.15.0] - 2026-11-09

### Added
- Sección **Instagram** en el panel administrativo para programar carruseles del feed, con pestañas Calendario, Campañas, Reglas y Conexión. Toda la programación es en hora de Colombia.
- Conexión de una cuenta profesional de Instagram con el **inicio de sesión unificado** de Meta (el único disponible para apps nuevas): token de usuario del sistema sin vencimiento, guardado solo del lado del servidor y comprobado cada hora; si Meta lo rechaza, no se publica y se avisa para reconectar.
- Carruseles manuales de 2 a 10 imágenes (disfraces del catálogo o imágenes propias): reordenar, vista previa 4:5, texto escrito o generado con IA (precios de alquiler, venta y depósito reembolsable, invitación a agendar por WhatsApp, sin dirección), texto alternativo por imagen, programar o "Publicar ahora".
- Calendario mensual y de lista con estados (borrador, pendiente de aprobación, programado, publicando, publicado con enlace, fallido con motivo y "Reintentar", cancelado), aprobación individual o en bloque, edición, cambio de fecha y cancelación.
- Reglas recurrentes **Novedades**, **Los más alquilados del mes** y **Categoría de la semana**, semanales o mensuales: generan su carrusel 3 días antes de cada fecha, pendiente de aprobación salvo que se desactive.
- Campañas con planificador (caso principal: "Todo el catálogo antes del Carnaval 2027"): fechas, días y hora, filtros por categoría, destacados y adulto/niño, exclusión manual, agrupación, hitos de la Lectura del Bando y cuenta regresiva al Carnaval, validación de que el plan cabe con sugerencias y vista previa antes de crear. Cada disfraz disponible con foto aparece al menos una vez. Se pueden pausar, reanudar o cancelar, y opcionalmente suman los disfraces nuevos a los carruseles aún no aprobados.
- Publicación automática cada 5 minutos (`pg_cron` → Edge Function `instagram-scheduler`): imágenes del catálogo llevadas a JPEG 4:5 de 1080 × 1350 extendiendo el fondo de estudio (sin IA), contenedores de carrusel con texto alternativo, hasta 3 reintentos con espera creciente, respeto del límite diario de Instagram y bloqueo para no publicar dos veces.
- Avisos en **Resumen**: carruseles por aprobar en las próximas 48 h, carruseles fallidos y conexión de Instagram con error.
- Edge Functions `instagram-auth`, `instagram-oauth-callback`, `instagram-caption` e `instagram-scheduler`.
- Migración `015_instagram_publishing.sql`: conexión y token (este último solo accesible por la service role), carruseles e imágenes, variantes 4:5, reglas, campañas y registro de publicaciones, todo con RLS de solo admin; bucket público `instagram-media`; nuevo tipo `caption` en `ai_usage_log`.
- Guía `docs/INSTAGRAM_SETUP.md`: app de Meta con inicio de sesión unificado (sin App Review para la cuenta propia), secretos, despliegue, tarea `pg_cron` y verificación.

## [0.14.0] - 2026-11-09

### Added
- Flujo **"Nuevo disfraz desde foto"** en el panel (botón "Desde foto" en Resumen y Disfraces), pensado para el celular: tomar la foto o elegirla de la galería, edición con IA (OpenAI) con el prompt de catálogo, foto final 3:4 de 800 × 1067 px, hasta 3 regeneraciones, y prellenado del formulario desde la descripción dictada o escrita.
- Borrador en el formulario con la foto editada, texto alternativo sugerido, campos llenados por la IA resaltados, telas y accesorios nuevos con opción de crearlos, y notas de la descripción. Al guardar se crean el disfraz, su ficha técnica y la foto principal; si algo falla, se puede reintentar sin duplicar el disfraz.
- Edge Functions `edit-costume-photo` y `extract-costume-data` (primeras del proyecto): solo para admins, con la clave de OpenAI como secreto, salida estructurada (JSON Schema) y límites por hora (20 ediciones, 60 extracciones).
- Migración `014_ai_usage_log.sql`: registro de uso de IA por admin.
- Documentación de secretos, despliegue y verificación en `docs/SUPABASE_SETUP.md` §8.

### Changed
- La ficha técnica se muestra también para un disfraz nuevo cuando viene de "Desde foto", para revisar lo sugerido antes de guardar.
- `tsconfig.json` excluye `supabase/functions` (código Deno, verificado con `deno check`).

### Fixed
- `.env.example` usaba `//` para un comentario, sintaxis que la CLI de Supabase no acepta al desplegar funciones; ahora usa `#`.
- El panel ya no vuelve a "Validando permisos admin…" cuando Supabase refresca la sesión del mismo usuario (por ejemplo, al volver de la cámara del celular), lo que desmontaba la pantalla y hacía perder el trabajo en curso.

## [0.13.0] - 2026-11-09

### Added
- Migración `013_whatsapp_click_sources.sql`: `costume_events.costume_id` opcional y columna `source` con el origen de cada clic a WhatsApp (los clics previos quedan como `costume_detail`); índice `(event_type, occurred_at)`.
- Registro de clics a WhatsApp en todos los CTA del sitio público: botón flotante (con el disfraz cuando se usa desde una ficha), ficha de disfraz, catálogo, Inicio (portada y llamado final), Servicios (tarjeta y llamado final), Contacto (agendar cita y número directo) y pie de página.
- Insights: KPI "Clics a WhatsApp en el periodo", tarjeta "Clics a WhatsApp por origen" y ranking "Disfraces con más clics a WhatsApp" con detalle completo.
- Nota "Medición completa desde…" junto a los clics, calculada a partir del primer clic registrado desde un origen distinto a la ficha.

### Changed
- `trackWhatsAppClick` recibe `{ source, costumeId? }` e ignora clics repetidos del mismo origen y disfraz dentro de 10 segundos.
- Los totales de visitas y clics de Resumen e Insights se calculan con conteos exactos en Supabase; las filas de eventos se descargan paginadas para que los rankings no se corten en 1.000 registros.

### Fixed
- No se registran visitas ni clics desde entornos locales (`localhost`, `127.0.0.1`, `*.local`), para no contaminar las métricas de producción.
- "Clics a WhatsApp" dejaba fuera el botón flotante y el resto de CTA del sitio.

## [0.12.0] - 2026-11-09

### Added
- Sección **Resumen** en el panel administrativo (sección por defecto al iniciar sesión): indicadores del periodo (alquileres, visitas a fichas, clics a WhatsApp, disfraces disponibles), rankings y pendientes del catálogo (alquileres sin vincular, disfraces sin depósito, disfraces sin fotos, fotos sin texto alternativo).
- Al eliminar un disfraz, el diálogo ofrece ocultarlo del catálogo como alternativa recomendada, muestra las consecuencias (fotos y alquileres del histórico afectados) y exige escribir el slug para confirmar.
- `ConfirmDialog` acepta props opcionales `destructive`, `details`, `confirmText` y `secondaryAction`; cierra con Escape.
- Consultas de solo lectura en `adminService`: `countRentalHistoryForCostume` y `fetchCatalogImageHealth`.

### Changed
- El panel administrativo y sus componentes (Insights, Toast, ConfirmDialog) usan la paleta, tipografías e iconografía de `DESIGN.md`; los errores usan rojo de sistema en vez de Rojo Madi.
- Navegación del panel en barra lateral con iconos; en móvil se apila arriba.
- Vista Tabla de disfraces: categoría bajo el nombre, precio de alquiler y depósito en JetBrains Mono ("Solo venta" cuando no hay precio de alquiler, "Sin depósito" cuando falta) e interruptores accesibles de disponible/destacado.
- Formulario de disfraz organizado en bloques (datos básicos, precios, visibilidad) con interruptores accesibles; tallas agrupadas en Adulto y Niño.

## [0.11.3] - 2026-08-17

### Changed
- El hero de Inicio (`carnival_main_banner`) se sirve desde `public/hero-carnaval.webp` (ruta estática, sin hash) en vez de importarse como módulo JS, con `<link rel="preload" fetchpriority="high">` en `index.html` y `fetchPriority="high"` en el `<img>`, para que el navegador empiece a descargarlo en paralelo con el documento en vez de esperar a que se ejecute el bundle.
- Las imágenes del Atelier Spotlight y de las tarjetas de Categorías Destacadas en Inicio usan `loading="lazy"` para no competir por ancho de banda con el hero durante la carga inicial.

## [0.11.2] - 2026-08-17

### Fixed
- Inicio ya no dispara dos peticiones idénticas a `costumes_full`: `App.tsx` solo llama a `useCostumes()` en `/catalogo` y en la ficha de disfraz (rutas que realmente consumen su resultado), no en todas las rutas.
- `useHomeData` deja de traer `reviews` en cada carga de Inicio mientras la sección de testimonios permanece apagada (`{false && (...)}` en `Inicio.tsx`), evitando una consulta desperdiciada.

### Changed
- `carnival_main_banner.jpg` (452kB) y `sra_madi_nuestra_historia.jpg` (320kB), usadas en el hero y en "El Corazón de Madi" de Inicio, se reemplazan por WebP optimizado (185kB y 144kB) sin degradación visible.

## [0.11.1] - 2026-08-17

### Security
- Actualizadas dependencias transitivas para resolver 3 alertas de Dependabot: `nanoid` 3.3.16 → 3.3.18 (GHSA-2v37-7h3g-55p8, DoS por bucle infinito con `size: 0`), `postcss` 8.5.18 → 8.5.26 (GHSA-fxqj-rqcc-2cmp, lectura de archivos `.map` fuera del árbol esperado) y `react-router-dom`/`react-router` 7.18.1 → 7.18.2 (GHSA-qwww-vcr4-c8h2, bypass de CSRF en el modo experimental RSC, no usado en este proyecto). Cambio acotado a `package-lock.json`; ninguna de las tres tenía explotabilidad real confirmada en el código del sitio.

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
