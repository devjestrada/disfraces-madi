# Supabase Setup for Disfraces Madi

Este directorio contiene los scripts SQL para inicializar la base de datos de Supabase con el esquema y los datos de seed del catálogo.

## Archivos

- `001_init.sql` — crea todas las tablas necesarias para el catálogo, diseñadores, categorías, imágenes, tallas, accesorios, reseñas, datos de contacto y estadísticas del sitio.
- `002_seed.sql` — inserta los datos iniciales mapeados desde `src/data.ts`, incluyendo disfraces, diseñadores, categorías, tallas, accesorios, reseñas y datos de contacto.
- `003_views.sql` — define la vista `costumes_full` y el trigger que recalcula automáticamente `rating` y `reviews_count` al insertar o actualizar reseñas.
- `004_rls.sql` — habilita RLS y crea políticas públicas de solo lectura para el frontend, más bloqueos generales para inserts/updates deletes anónimos.

## Pasos de despliegue

### Opción A: Supabase Studio
1. Accede a tu proyecto en Supabase.
2. Ve a la sección SQL Editor.
3. Ejecuta primero `001_init.sql`.
4. Ejecuta después `002_seed.sql`.
5. Ejecuta finalmente `003_views.sql`.

### Opción B: Supabase CLI
Asegúrate de tener configurado `supabase` CLI y estar autenticado.

```bash
cd /Users/jorge/Projects/disfraces-madi/supabase
supabase db reset --project-ref <project-ref>
supabase db push --project-ref <project-ref>
```

> Si no usas `db reset`, puedes ejecutar los scripts SQL desde el CLI o desde Studio.

### Opción C: psql / cliente SQL
Si tienes acceso directo a la base de datos PostgreSQL:

```bash
psql "postgresql://<user>:<password>@<host>:<port>/<database>" -f 001_init.sql
psql "postgresql://<user>:<password>@<host>:<port>/<database>" -f 002_seed.sql
psql "postgresql://<user>:<password>@<host>:<port>/<database>" -f 003_views.sql
```

## Consideraciones

- El proyecto frontend ya está preparado para usar Supabase mediante las variables de entorno `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.
- El view `costumes_full` es el que debe consumirse desde el frontend para obtener la data completa del catálogo con arrays de tallas, accesorios, telas y galería.
- Las imágenes de disfraces pueden mantenerse como URLs externas o cargarse al bucket de Supabase Storage, en cuyo caso `storage_path` deberá referirse a la ruta dentro del bucket.

## Recomendaciones

- Configura RLS y permisos de solo lectura para las tablas públicas si vas a exponer datos desde el frontend.
- El seed se basa en datos actuales del frontend para mantener consistencia con la experiencia actual de `src/data.ts`.
- Si necesitas actualizar el catálogo más adelante, añade nuevas migraciones SQL en el mismo directorio con prefijos incrementales.
