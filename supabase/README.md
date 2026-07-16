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

## Orden de ejecución

Ejecuta las migraciones en orden numérico, sin saltos: `001` -> `007`.

## Guía completa obligatoria

Para configuración paso a paso (Dashboard, Auth, buckets, políticas, variables, verificación y rollback), usar:

- `docs/SUPABASE_SETUP.md`

Ese documento es la fuente principal para onboarding de entornos nuevos.
