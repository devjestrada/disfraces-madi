## [Unreleased]

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
