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
- `OPENAI_API_KEY`: clave de la API de OpenAI para el flujo "Nuevo disfraz desde foto". Va **solo** como secreto de las Edge Functions (sección 8), nunca en `.env` del frontend.

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
13. `supabase/013_whatsapp_click_sources.sql`
14. `supabase/014_ai_usage_log.sql`

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

El proyecto tiene dos Edge Functions para el flujo **"Nuevo disfraz desde foto"** del panel
(spec `crear_disfraz_desde_foto`). Ambas exigen una sesión de admin (`public.is_admin()`) y llaman a OpenAI
desde el servidor, así que la clave nunca llega al navegador.

| Función | Qué hace | Límite por admin |
|---|---|---|
| `edit-costume-photo` | Edita la foto con el prompt de catálogo (fondo de estudio, 3:4). | 20 por hora |
| `extract-costume-data` | Convierte la descripción dictada o escrita en datos del formulario. | 60 por hora |

El código está en `supabase/functions/` (prompts compartidos en `_shared/prompts.ts`, alineados con `docs/prompts/`).
El uso queda registrado en la tabla `ai_usage_log` (migración `014`).

### 8.1 Requisitos

1. Migración `supabase/014_ai_usage_log.sql` aplicada.
2. Una clave de la **API de OpenAI** con facturación activa (platform.openai.com). La suscripción de ChatGPT no sirve.
   Recomendado: fijar un límite de gasto mensual en la cuenta de OpenAI.
3. Supabase CLI instalada (`npm i -g supabase` o `brew install supabase/tap/supabase`) y sesión iniciada (`supabase login`).

### 8.2 Secretos

Son cuatro secretos. Solo `OPENAI_API_KEY` y `OPENAI_TEXT_MODEL` son obligatorios:

| Nombre | Valor |
|---|---|
| `OPENAI_API_KEY` | Clave de la API de OpenAI (`sk-...`). |
| `OPENAI_TEXT_MODEL` | ID exacto de un modelo de texto actual, pequeño y económico, que soporte Structured Outputs en la API de Responses. Recomendado a nov. 2026: `gpt-6-luna` (si extrae mal descripciones complejas, `gpt-6.1-sol`). Verificar en la documentación de Models de platform.openai.com. |
| `OPENAI_IMAGE_MODEL` | Opcional. Por defecto `gpt-image-2`. |
| `OPENAI_IMAGE_QUALITY` | Opcional. `low`, `medium` o `high`; por defecto `medium` (mejor equilibrio costo/resultado). |

No crees secretos que empiecen por `SUPABASE_`: ese prefijo está reservado. `SUPABASE_URL`, `SUPABASE_ANON_KEY`
y `SUPABASE_SERVICE_ROLE_KEY` los inyecta Supabase automáticamente.

**Opción A — Dashboard (sin instalar nada)**

1. En supabase.com, abre el proyecto y ve a **Edge Functions → Secrets**.
2. Agrega cada secreto (Key y Value). Se pueden pegar varios a la vez.
3. Presiona **Save**.

**Opción B — CLI**

1. Instala la CLI (`brew install supabase/tap/supabase` o `npm i -g supabase`) e inicia sesión con `supabase login`.
2. El `<project-ref>` es el subdominio de `VITE_SUPABASE_URL` (`https://<project-ref>.supabase.co`).
3. Guarda los secretos en un archivo **fuera del repositorio** (para que la clave no quede en el historial
   de la terminal ni en git), por ejemplo `~/openai-madi.env`:
   ```
   OPENAI_API_KEY=sk-...
   OPENAI_TEXT_MODEL=gpt-6-luna
   OPENAI_IMAGE_MODEL=gpt-image-2
   OPENAI_IMAGE_QUALITY=medium
   ```
4. Súbelos y verifica (el listado muestra nombres, no valores):
   ```bash
   supabase secrets set --env-file ~/openai-madi.env --project-ref <project-ref>
   supabase secrets list --project-ref <project-ref>
   ```
5. Borra el archivo `~/openai-madi.env`.

### 8.3 Despliegue

Desde la raíz del proyecto:

```bash
supabase functions deploy edit-costume-photo --project-ref <project-ref>
supabase functions deploy extract-costume-data --project-ref <project-ref>
```

Orden recomendado: migración `014` → secretos → funciones → frontend.

### 8.4 Verificación

- En el panel (desde el celular), **Disfraces → Desde foto**: toma o elige una foto, espera la edición y prellena con una descripción.
- Consumo:
  ```sql
  select kind, model, count(*), max(created_at) from ai_usage_log group by kind, model;
  ```
- Errores: logs de cada función en Dashboard → Edge Functions.

Nunca expongas `SUPABASE_SERVICE_ROLE_KEY` ni `OPENAI_API_KEY` en el frontend.

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
