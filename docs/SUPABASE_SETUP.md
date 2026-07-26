# Supabase Setup Guide - Admin Module (Disfraces Madi)

Esta guia permite levantar un entorno nuevo (dev, staging o prod) con soporte completo para el modulo administrativo.

## 1. Prerrequisitos

- Cuenta en Supabase.
- Node.js y npm instalados.
- Supabase CLI opcional para despliegue por terminal.
- Acceso al repositorio de este proyecto.

## 2. Crear proyecto en Supabase

1. Crear un nuevo proyecto en Supabase Dashboard.
2. Elegir region y password de base de datos.
3. Esperar a que el proyecto quede activo.

## 3. Variables de entorno

Configura estas variables antes de iniciar la app o desplegar funciones.

## Variables publicas (frontend)

- `VITE_SUPABASE_URL`: URL del proyecto.
- `VITE_SUPABASE_ANON_KEY`: llave anon publica.

## Variables secretas (no exponer en cliente)

- `SUPABASE_SERVICE_ROLE_KEY`: llave con privilegios elevados para operaciones administrativas.
- `SUPABASE_DB_PASSWORD`: solo si automatizas operaciones CLI que la necesiten.

## 4. Orden de migraciones SQL

Ejecuta en este orden exacto:

1. `supabase/001_init.sql`
2. `supabase/002_seed.sql`
3. `supabase/003_views.sql`
4. `supabase/004_rls.sql`
5. `supabase/005_admin_auth.sql`
6. `supabase/006_admin_rls.sql`
7. `supabase/007_storage_admin.sql`
8. `supabase/008_deposit_price.sql`
9. `supabase/009_costume_events.sql`
10. `supabase/010_rental_history.sql`
11. `supabase/011_child_sizes_and_optional_rental.sql`
12. `supabase/012_gallery_alt_text.sql`

## Opcion A: SQL Editor (Dashboard)

Ejecuta cada archivo manualmente respetando el orden anterior.

## Opcion B: CLI

Desde la raiz del proyecto:

```bash
supabase db push --project-ref <project-ref>
```

Si administras migraciones por archivo, aplica una por una en el mismo orden.

## 5. Configuracion de Auth

1. En Authentication -> Providers, habilitar Email/Password.
2. Crear el primer usuario admin (Dashboard -> Authentication -> Users -> Invite user o Create user).
3. Obtener su `id` (UUID) desde la tabla de usuarios.
4. Insertar ese UUID en `public.admin_users`:

```sql
insert into public.admin_users (user_id)
values ('<auth-user-uuid>')
on conflict (user_id) do nothing;
```

Con esto, `public.is_admin()` devuelve true para ese usuario autenticado.

## 6. Buckets y politicas de Storage

La migracion `007_storage_admin.sql` crea estos buckets:

- `costume-images` (public read, admin write)
- `review-avatars` (public read, admin write)
- `site-assets` (public read, admin write)

Limites por defecto configurados:

- `costume-images`: 5 MB, JPG/PNG/WEBP
- `review-avatars`: 2 MB, JPG/PNG/WEBP
- `site-assets`: 5 MB, JPG/PNG/WEBP/SVG

Si prefieres hacerlo manual en Dashboard, usa exactamente esos nombres y limites.

## 7. Politicas RLS administrativas

`006_admin_rls.sql` aplica INSERT/UPDATE/DELETE solo a usuarios autenticados que cumplan `public.is_admin()` para:

- categories
- designers
- costumes
- costume_details
- fabrics
- costume_fabrics
- accessories
- costume_accessories
- costume_sizes
- costume_images
- reviews
- site_stats
- contact_info
- working_hours
- site_assets

Lectura publica se mantiene segun politicas ya existentes en `004_rls.sql`.

## 8. Edge Functions y secrets

Para cualquier funcion que requiera `service_role`, configura secrets en Supabase:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Nunca expongas `SUPABASE_SERVICE_ROLE_KEY` en frontend.

## 9. Pasos de verificacion

1. Login con usuario admin.
2. Intentar crear o editar un registro administrable (debe funcionar).
3. Login con usuario autenticado no admin e intentar escribir (debe fallar por RLS).
4. Con sesion anon, validar que solo hay lectura publica.
5. Subir imagen al bucket `costume-images` y confirmar que se crea objeto.
6. Intentar borrar/subir objeto con usuario no admin (debe fallar).

## 10. Rollback basico

Si una migracion falla en entorno de prueba:

1. Revertir cambios con una migracion correctiva (recomendado).
2. Si es necesario, eliminar politicas nuevas conflictivas:

```sql
drop policy if exists admin_insert_costumes on costumes;
drop policy if exists admin_update_costumes on costumes;
drop policy if exists admin_delete_costumes on costumes;
```

3. Reaplicar migracion corregida.
4. Repetir pruebas de verificacion.

Para produccion, evitar rollback destructivo; usar migraciones forward-only auditables.

## 11. Checklist rapido de onboarding

- Proyecto Supabase creado
- Variables publicas y secretas configuradas
- Migraciones 001 a 007 aplicadas en orden
- Usuario admin creado y registrado en `public.admin_users`
- Buckets y politicas validados
- Pruebas de escritura admin y bloqueo no-admin completadas

## 12. Notas de compatibilidad

- El frontend actual soporta `storage_path` como URL externa o ruta de bucket.
- Todas las cargas nuevas deben guardarse como ruta de bucket para consistencia operativa.
