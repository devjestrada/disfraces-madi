# Especificación de Software — Backend Supabase para Disfraces Madi

## 1. Contexto

El archivo `data.ts` actual contiene toda la información del catálogo (disfraces, reseñas, estadísticas, contacto) hardcodeada en el frontend, junto con imágenes importadas localmente y otras referenciadas desde Unsplash. El objetivo es migrar esta data a **Supabase** (Postgres + Auth + Storage + API auto-generada), de modo que el sitio consuma todo dinámicamente y el negocio pueda administrar el catálogo sin tocar código.

---

## 2. Inventario de la data actual (mapeo desde `data.ts`)

| Entidad en el código | Campos | Observación |
|---|---|---|
| `ASSETS` | heroBanner, galaCumbia, marimonda, atelierMadi | Imágenes estáticas de marca/landing, no ligadas a un disfraz específico en catálogo (aunque `galaCumbia` y `marimonda` se reutilizan como `primaryImage`) |
| `COSTUMES[]` | id, name, category, rating, reviewsCount, description, details[], fabrics[], accessories[], sizes[], primaryImage, gallery[], rentalPrice, salePrice, isAvailable, featured, designer | Entidad principal del catálogo |
| `REVIEWS[]` | id, author, role, rating, comment, avatar, date | Reseñas generales (no ligadas a un disfraz puntual en el modelo actual) |
| `STATS` | yearsOfTradition, carnivalsLived, costumesRented, happyHearts | Contador tipo "singleton" para la sección de hitos |
| `CONTACT_INFO` | address, city, phone, whatsapp, email, workingHours[] | Info de contacto, también singleton |

Puntos a resolver en el modelado (ver sección 8, preguntas):
- `category` hoy es texto libre (`Tradicional`, `Comparsa`, `Fantasía`) → candidato a catálogo o `enum`.
- `fabrics`, `accessories`, `details` son arrays de string simples → decidir si se normalizan en tablas o se guardan como `text[]`/`jsonb`.
- `gallery` mezcla imágenes locales importadas y URLs externas de Unsplash → hay que unificar en Storage.
- `rating`/`reviewsCount` están en el disfraz pero las reseñas no tienen `costume_id` → hay que decidir si el rating se calcula desde `reviews` o se mantiene manual.

---

## 3. Modelo de datos propuesto (Postgres / Supabase)

### 3.1 Diagrama conceptual

```
designers 1───* costumes 1───* costume_images
                    │  1───* costume_details
                    │  1───* costume_sizes
                    │  *───* fabrics       (vía costume_fabrics)
                    │  *───* accessories   (vía costume_accessories)
                    │  1───* reviews (opcional, ver preguntas)
categories (o enum) ─┘

site_stats      (singleton)
contact_info    (singleton) 1───* working_hours
site_assets     (key → storage_path)
```

### 3.2 Tipos y tablas (DDL de referencia)

```sql
-- Extensión para UUID
create extension if not exists "pgcrypto";

-- Enums
create type costume_size_enum as enum ('XS','S','M','L','XL','XXL');

-- Categorías (editable por el negocio, sin requerir cambios de esquema)
create table categories (
  id    uuid primary key default gen_random_uuid(),
  name  text not null unique,        -- ej. 'Tradicional', 'Comparsa', 'Fantasía'
  slug  text not null unique,        -- ej. 'tradicional', usado en filtros de URL
  sort_order integer not null default 0
);

-- Diseñadores / talleres
create table designers (
  id           uuid primary key default gen_random_uuid(),
  name         text not null unique,
  bio          text,
  created_at   timestamptz not null default now()
);

-- Disfraces (entidad principal)
create table costumes (
  id             uuid primary key default gen_random_uuid(),
  slug           text not null unique,          -- ej. 'gala-cumbia-real', usado en URLs
  name           text not null,
  category_id    uuid not null references categories(id),
  description    text not null,
  designer_id    uuid references designers(id),
  rental_price   numeric(12,2) not null,
  sale_price     numeric(12,2),
  is_available   boolean not null default true,  -- se descarta calendario de fechas; solo este booleano manual
  featured       boolean not null default false,
  rating         numeric(2,1) not null default 0,   -- calculado automáticamente (ver trigger en 3.3.1)
  reviews_count  integer not null default 0,          -- calculado automáticamente (ver trigger en 3.3.1)
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index on costumes (category_id);
create index on costumes (featured);
create index on costumes (is_available);

-- Detalles tipo "bullet point" (características)
create table costume_details (
  id          uuid primary key default gen_random_uuid(),
  costume_id  uuid not null references costumes(id) on delete cascade,
  detail      text not null,
  sort_order  integer not null default 0
);

-- Telas: catálogo reutilizable
create table fabrics (
  id    uuid primary key default gen_random_uuid(),
  name  text not null unique
);

create table costume_fabrics (
  costume_id  uuid not null references costumes(id) on delete cascade,
  fabric_id   uuid not null references fabrics(id) on delete cascade,
  primary key (costume_id, fabric_id)
);

-- Accesorios: catálogo reutilizable
create table accessories (
  id    uuid primary key default gen_random_uuid(),
  name  text not null unique
);

create table costume_accessories (
  costume_id     uuid not null references costumes(id) on delete cascade,
  accessory_id   uuid not null references accessories(id) on delete cascade,
  primary key (costume_id, accessory_id)
);

-- Tallas disponibles (solo catálogo de tallas, sin control de stock)
create table costume_sizes (
  costume_id  uuid not null references costumes(id) on delete cascade,
  size        costume_size_enum not null,
  primary key (costume_id, size)
);

-- Imágenes de galería
create table costume_images (
  id             uuid primary key default gen_random_uuid(),
  costume_id     uuid not null references costumes(id) on delete cascade,
  storage_path   text not null,        -- ruta dentro del bucket, no URL absoluta
  is_primary     boolean not null default false,
  sort_order     integer not null default 0,
  alt_text       text
);
create unique index one_primary_per_costume
  on costume_images (costume_id) where (is_primary);

-- Reseñas
create table reviews (
  id                    uuid primary key default gen_random_uuid(),
  costume_id            uuid references costumes(id) on delete set null, -- nullable: reseña general
  author_name           text not null,
  author_role           text,
  rating                smallint not null check (rating between 1 and 5),
  comment               text not null,
  avatar_storage_path   text,
  review_date           date,
  is_published           boolean not null default true, -- moderación: campo listo para cuando se habilite el envío por clientes
  created_at            timestamptz not null default now()
);
-- Nota: por ahora las reseñas se siguen cargando manualmente (INSERT vía admin/Studio).
-- El formulario público de envío queda OCULTO en el frontend, pero el esquema (is_published,
-- created_at) ya soporta habilitarlo más adelante sin cambios de estructura.

-- 3.2.1 Trigger: recalcular rating y reviews_count del disfraz automáticamente
-- Solo cuentan las reseñas que están ligadas a un costume_id y publicadas (is_published = true)
create or replace function recalc_costume_rating() returns trigger as $$
declare
  target_id uuid;
begin
  target_id := coalesce(new.costume_id, old.costume_id);
  if target_id is null then
    return coalesce(new, old);
  end if;

  update costumes c
  set rating = coalesce((
        select round(avg(r.rating)::numeric, 1)
        from reviews r
        where r.costume_id = target_id and r.is_published
      ), 0),
      reviews_count = (
        select count(*) from reviews r
        where r.costume_id = target_id and r.is_published
      )
  where c.id = target_id;

  return coalesce(new, old);
end;
$$ language plpgsql;

create trigger trg_recalc_rating
after insert or update or delete on reviews
for each row execute function recalc_costume_rating();

-- Estadísticas del sitio (fila única)
create table site_stats (
  id                  boolean primary key default true check (id),
  years_of_tradition  text,
  carnivals_lived     text,
  costumes_rented     text,
  happy_hearts        text,
  updated_at          timestamptz not null default now()
);

-- Info de contacto (fila única)
create table contact_info (
  id         boolean primary key default true check (id),
  address    text,
  city       text,
  phone      text,
  whatsapp   text,
  email      text,
  updated_at timestamptz not null default now()
);

create table working_hours (
  id          uuid primary key default gen_random_uuid(),
  days_label  text not null,
  hours_label text not null,
  sort_order  integer not null default 0
);

-- Assets estáticos de marca (hero banner, etc.)
create table site_assets (
  key           text primary key,   -- 'heroBanner' | 'atelierMadi' | ...
  storage_path  text not null
);
```

### 3.3 Vista consolidada para el frontend

Para evitar que el frontend haga 5 queries por cada disfraz, conviene exponer una vista (o RPC) que arme el JSON completo:

```sql
create or replace view costumes_full as
select
  c.id, c.slug, c.name, cat.name as category, cat.slug as category_slug, c.description,
  d.name as designer,
  c.rental_price, c.sale_price, c.is_available, c.featured,
  c.rating, c.reviews_count,
  (select array_agg(cd.detail order by cd.sort_order)
     from costume_details cd where cd.costume_id = c.id) as details,
  (select array_agg(f.name)
     from costume_fabrics cf join fabrics f on f.id = cf.fabric_id
     where cf.costume_id = c.id) as fabrics,
  (select array_agg(a.name)
     from costume_accessories ca join accessories a on a.id = ca.accessory_id
     where ca.costume_id = c.id) as accessories,
  (select array_agg(cs.size order by cs.size)
     from costume_sizes cs where cs.costume_id = c.id) as sizes,
  (select ci.storage_path from costume_images ci
     where ci.costume_id = c.id and ci.is_primary limit 1) as primary_image,
  (select array_agg(ci.storage_path order by ci.sort_order)
     from costume_images ci where ci.costume_id = c.id) as gallery
from costumes c
left join designers d on d.id = c.designer_id
left join categories cat on cat.id = c.category_id;
```

### 3.4 Seguridad (RLS)

Con RLS habilitado en todas las tablas:

- **Lectura pública** (`select`) sobre: `categories`, `costumes`, `costume_details`, `fabrics`, `costume_fabrics`, `accessories`, `costume_accessories`, `costume_sizes`, `costume_images`, `reviews` (solo `is_published = true`), `site_stats`, `contact_info`, `working_hours`, `site_assets`.
- **Escritura** (`insert`/`update`/`delete`) restringida al **panel de administración a medida** (ver sección 3.5).

Ejemplo de policy:
```sql
alter table costumes enable row level security;

create policy "Catálogo público de lectura"
  on costumes for select
  using (true);

create policy "Solo admin escribe"
  on costumes for all
  using (auth.jwt() ->> 'role' = 'admin')
  with check (auth.jwt() ->> 'role' = 'admin');
```

### 3.5 Panel de administración (decisión: se construye a medida)

Como se definió un panel admin propio (no edición directa por Supabase Studio), se necesita:

- **Supabase Auth** con un usuario (o varios) de tipo administrador, usando login por email/password.
- Un **custom claim** `role = 'admin'` en el JWT (vía Auth Hook / `raw_app_meta_data`) o una tabla `admins (user_id uuid references auth.users)` que las policies consulten, ej.:
  ```sql
  create policy "Solo admin escribe"
    on costumes for all
    using (exists (select 1 from admins a where a.user_id = auth.uid()))
    with check (exists (select 1 from admins a where a.user_id = auth.uid()));
  ```
- El panel debe cubrir CRUD sobre: `costumes` (+ sus relaciones: detalles, telas, accesorios, tallas, imágenes), `categories`, `designers`, `reviews` (alta manual + moderación futura), `site_stats`, `contact_info`, `working_hours`, `site_assets`.
- Subida de imágenes desde el panel directo a los buckets de Storage (usando el cliente autenticado, con policies de Storage que solo permitan `insert`/`update`/`delete` al rol admin).
- Importante: esto es un login de **administrador del negocio**, separado de "cuentas de cliente" (que se descartaron, ver sección 7).

---

## 4. Persistencia de imágenes (Supabase Storage)

### 4.1 Buckets propuestos

| Bucket | Público | Contenido |
|---|---|---|
| `costume-images` | Sí | Imágenes principales y galería de cada disfraz |
| `review-avatars` | Sí | Avatares de quienes dejan reseñas |
| `site-assets` | Sí | Hero banner, foto del atelier, logo, imágenes de marca |

Todos públicos porque es un catálogo de e-commerce/vitrina (no hay datos sensibles). Si más adelante se necesita restringir descargas en alta resolución, se puede mover a bucket privado + URLs firmadas.

### 4.2 Convención de rutas

```
costume-images/
  {costume_id}/
    primary.jpg
    gallery-01.jpg
    gallery-02.jpg

review-avatars/
  {review_id}/
    avatar.jpg

site-assets/
  hero-banner.jpg
  atelier-madi.jpg
```

La tabla `costume_images.storage_path` guarda la ruta relativa (`{costume_id}/gallery-01.jpg`), y el frontend construye la URL pública con:

```ts
supabase.storage.from('costume-images').getPublicUrl(storage_path)
```

### 4.3 Transformación / optimización

Supabase Storage soporta transformación de imágenes on-the-fly (`?width=&height=&resize=`) en planes que lo habilitan. Recomendado usarlo para:
- Miniaturas de listado (ej. 400px de ancho).
- Imagen completa en la ficha del producto (ej. 1200px).

Esto evita subir múltiples resoluciones manualmente.

### 4.4 Migración de imágenes existentes — **Decisión: se migra todo a Storage**

Hay dos orígenes distintos hoy, y **ambos se suben a Supabase Storage** (no se deja ninguna imagen como URL externa a Unsplash), para no depender de un tercero:
1. **Imágenes locales importadas** (`./assets/images/*.jpg`) → se suben directamente a Storage con el script de migración.
2. **URLs de Unsplash** (usadas hoy como placeholder en varios disfraces) → se descargan y se suben también a Storage, quedando con el mismo esquema de rutas que las imágenes propias (`{costume_id}/gallery-01.jpg`, etc.). Al finalizar la migración, ningún `storage_path` en la base de datos apunta a un dominio externo.

Script de migración (pseudocódigo):
```ts
for (const costume of COSTUMES) {
  const primaryPath = await uploadToStorage(costume.primaryImage, `${costume.id}/primary.jpg`);
  const galleryPaths = await Promise.all(
    costume.gallery.map((url, i) => uploadToStorage(url, `${costume.id}/gallery-${i}.jpg`))
  );
  await insertCostumeImages(costume.id, primaryPath, galleryPaths);
}
```

---

## 5. Consumo dinámico desde el frontend

Ejemplo de queries con `supabase-js`:

```ts
// Listado de destacados
const { data } = await supabase
  .from('costumes_full')
  .select('*')
  .eq('featured', true);

// Ficha de un disfraz por slug
const { data } = await supabase
  .from('costumes_full')
  .select('*')
  .eq('slug', 'gala-cumbia-real')
  .single();

// Reseñas publicadas
const { data } = await supabase
  .from('reviews')
  .select('*')
  .eq('is_published', true)
  .order('created_at', { ascending: false });

// Stats y contacto (fila única)
const { data: stats } = await supabase.from('site_stats').select('*').single();
const { data: contact } = await supabase.from('contact_info').select('*, working_hours(*)').single();
```

---

## 6. Plan de trabajo sugerido

1. Crear proyecto en Supabase y ejecutar el DDL (sección 3.2) vía migraciones (`supabase migration new`).
2. Crear los 3 buckets de Storage y sus policies.
3. Escribir script de migración (Node/Deno) que lea `data.ts`, suba imágenes y haga los `insert` correspondientes.
4. Generar la vista `costumes_full` y validar que reproduce exactamente la forma del actual `Costume` de `types.ts`.
5. Reemplazar los `import` estáticos del frontend por llamadas a `supabase-js` (con caching/SWR o React Query).
6. (Opcional) Construir panel admin básico para CRUD de disfraces, reseñas y contacto.

---

## 7. Decisiones finales

Todas las decisiones de alcance quedaron cerradas:

1. **Reservas/disponibilidad** → Descartado: no habrá calendario de fechas ocupadas. Solo `is_available` como booleano manual.
2. **Reseñas enviadas por clientes** → Se posterga: por ahora se cargan manualmente. El esquema ya soporta habilitar el envío público más adelante sin rediseño.
3. **Imágenes de Unsplash** → Se migran todas a Storage junto con las locales; no queda ninguna imagen como URL externa.
4. **Stock por talla** → Descartado: `costume_sizes` solo lista qué tallas existen, sin control de inventario.
5. **Rating y reviews_count** → Calculado automáticamente por trigger a partir de `reviews.rating` (ver 3.2.1).
   - ⚠️ Al migrar los datos, hay que asignar `costume_id` a las 3 reseñas actuales de `data.ts` según a qué disfraz corresponde cada comentario, o el rating de ningún disfraz las contará.
6. **Cuentas de cliente** → Descartado: catálogo 100% público, sin Auth ni login de clientes.
7. **Administración** → Se construye un **panel admin a medida** (no Supabase Studio directo), con su propio login de administrador vía Supabase Auth (ver 3.5).
8. **Moneda/idioma** → Solo COP y español; no se modela multi-moneda ni multi-idioma. Los precios quedan como `numeric` simple.
9. **Categorías** → Editables por el negocio: se modela como tabla `categories` (no `enum`), con FK `costumes.category_id`, para poder agregar categorías nuevas sin cambios técnicos.

## 8. Próximos pasos

Con el alcance ya definido, el esquema de este documento (secciones 3 y 4) queda como versión final para implementar. Los siguientes pasos son:

1. Ejecutar las migraciones SQL en el proyecto Supabase.
2. Configurar Auth con el/los usuario(s) admin y la tabla/claim de rol.
3. Crear los buckets de Storage y sus policies (solo admin escribe, lectura pública).
4. Correr el script de migración de datos e imágenes (incluye asignar `category_id` y `costume_id` de reseñas).
5. Construir el panel admin (CRUD de disfraces, categorías, diseñadores, reseñas, stats, contacto, assets) y conectar el frontend público a `costumes_full` y las demás tablas de lectura.
