# Supabase Setup for Disfraces Madi

Este directorio contiene las migraciones SQL versionadas del proyecto.

## Migraciones actuales

- `001_init.sql`: esquema base y constraints.
- `002_seed.sql`: datos iniciales del catálogo.
- `003_views.sql`: vista `costumes_full` y trigger de rating/reviews.
- `004_rls.sql`: RLS de lectura pública.
- `005_admin_auth.sql`: modelo de autorización admin (`admin_users` + `is_admin()`).
- `006_admin_rls.sql`: políticas INSERT/UPDATE/DELETE exclusivas para admins.
- `007_storage_admin.sql`: buckets y políticas de Storage para assets administrados.
- `008_deposit_price.sql`: columna `deposit_price` en `costumes` y actualización de la vista `costumes_full`.
- `009_costume_events.sql`: tabla `costume_events` (tracking anónimo interno de vistas de ficha y clics de WhatsApp), con INSERT abierto a `anon` y SELECT restringido a admin.
- `010_rental_history.sql`: tablas `costume_rental_history` (histórico de alquileres importado del CSV digitalizado) y `costume_label_aliases` (vinculación reutilizable de etiquetas), ambas admin-only.
- `011_child_sizes_and_optional_rental.sql`: tallas infantiles (`4`–`16`) en `costume_size_enum` y precio de alquiler opcional.
- `012_gallery_alt_text.sql`: expone el texto alternativo de cada imagen en `costumes_full.gallery`.
- `013_whatsapp_click_sources.sql`: `costume_events.costume_id` opcional y columna `source` con el origen de cada clic a WhatsApp; los clics previos se marcan como `costume_detail`.
- `014_ai_usage_log.sql`: tabla `ai_usage_log` con el uso de IA por admin (límites por hora y control de costos del flujo "Nuevo disfraz desde foto").
- `015_instagram_publishing.sql`: publicación programada de carruseles en Instagram (conexión y token solo para la service role, carruseles, imágenes 4:5, reglas, campañas y registro), bucket público `instagram-media` y tipo `caption` en `ai_usage_log`. Configuración en `docs/INSTAGRAM_SETUP.md`.

## Orden de ejecución

Ejecuta las migraciones en orden numérico, sin saltos: `001` -> `015`.

## Guía completa obligatoria

Para configuración paso a paso (Dashboard, Auth, buckets, políticas, variables, verificación y rollback), usar:

- `docs/SUPABASE_SETUP.md`

Ese documento es la fuente principal para onboarding de entornos nuevos.

## Edge Functions

`functions/` contiene `edit-costume-photo` y `extract-costume-data` (flujo "Nuevo disfraz desde foto"). Secretos, despliegue y verificación: `docs/SUPABASE_SETUP.md` §8.
