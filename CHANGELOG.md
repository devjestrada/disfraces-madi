## [Unreleased]

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
