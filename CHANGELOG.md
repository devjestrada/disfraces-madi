## [Unreleased]

### Changed
- `App.tsx` ahora carga la vista `Admin` con `React.lazy()`/`Suspense` en vez de un import estático, sacando el panel administrativo (login, CRUD de disfraces, subida de imágenes) del bundle público inicial; queda en un chunk aparte (`Admin-*.js`, ~40KB) que solo se descarga al entrar a `/admin`.
- `AGENTS.md`: se revirtió la política de precios — ahora se exige publicar precio de alquiler, venta y depósito en vez de ocultarlos (pendiente agregar `depositPrice` al modelo de datos para reflejarlo en la UI).
- `AGENTS.md`: se formalizó el flujo de trabajo por spec con dos puntos de revisión explícitos del usuario (redacción de la spec y plan de implementación) antes de que el agente continúe.

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
