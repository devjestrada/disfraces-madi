-- Publicación programada de carruseles en Instagram (spec: publicacion_carruseles_instagram).
--
-- Tablas de conexión, carruseles, reglas, campañas y registro; bucket público para las imágenes 4:5
-- que Meta descarga al publicar. Todo es solo para admins; el token de Instagram vive en una tabla
-- sin políticas (solo la service role de las Edge Functions puede leerlo).

-- 1. Conexión con Instagram ------------------------------------------------------------------

create table if not exists public.instagram_connection (
  id boolean primary key default true check (id),
  ig_user_id text not null,
  username text,
  account_name text,
  connected_at timestamptz not null default now(),
  -- El token del inicio de sesión unificado (usuario del sistema) no vence: queda nulo salvo que Meta indique lo contrario.
  token_expires_at timestamptz,
  last_checked_at timestamptz,
  last_error text,
  updated_at timestamptz not null default now()
);

-- Por si la tabla se creó con la primera versión de esta migración (inicio de sesión de Instagram).
alter table public.instagram_connection add column if not exists account_name text;
alter table public.instagram_connection add column if not exists last_checked_at timestamptz;
alter table public.instagram_connection drop column if exists account_type;
alter table public.instagram_connection drop column if exists last_refresh_at;

create table if not exists public.instagram_tokens (
  id boolean primary key default true check (id),
  access_token text not null,
  updated_at timestamptz not null default now()
);

alter table public.instagram_connection enable row level security;
alter table public.instagram_tokens enable row level security;

drop policy if exists instagram_connection_admin_select on public.instagram_connection;
create policy instagram_connection_admin_select on public.instagram_connection
  for select to authenticated using (public.is_admin());
-- instagram_tokens: sin políticas a propósito (solo service role).

-- 2. Campañas y reglas ------------------------------------------------------------------------

create table if not exists public.instagram_campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  start_date date not null,
  end_date date not null,
  weekdays smallint[] not null,
  publish_time time not null,
  items_per_post smallint not null check (items_per_post between 2 and 10),
  grouping text not null default 'categoria' check (grouping in ('categoria', 'mezclado', 'destacados_primero')),
  filters jsonb not null default '{}'::jsonb,
  milestones jsonb not null default '[]'::jsonb,
  requires_approval boolean not null default true,
  include_new_costumes boolean not null default true,
  status text not null default 'activa' check (status in ('activa', 'pausada', 'cancelada', 'terminada')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_date >= start_date)
);

create table if not exists public.instagram_rules (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('novedades', 'mas_alquilados', 'categoria_semana')),
  name text not null,
  cadence text not null default 'semanal' check (cadence in ('semanal', 'mensual')),
  weekday smallint not null check (weekday between 0 and 6),
  publish_time time not null,
  items_count smallint not null check (items_count between 2 and 10),
  requires_approval boolean not null default true,
  active boolean not null default true,
  state jsonb not null default '{}'::jsonb,
  last_generated_for timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. Carruseles -------------------------------------------------------------------------------

create table if not exists public.instagram_posts (
  id uuid primary key default gen_random_uuid(),
  source text not null default 'manual' check (source in ('manual', 'regla', 'campana')),
  rule_id uuid references public.instagram_rules(id) on delete set null,
  campaign_id uuid references public.instagram_campaigns(id) on delete set null,
  title text,
  caption text not null default '',
  scheduled_at timestamptz not null,
  status text not null default 'borrador' check (
    status in ('borrador', 'pendiente', 'programado', 'publicando', 'publicado', 'fallido', 'cancelado')
  ),
  approved_at timestamptz,
  approved_by uuid references auth.users(id) on delete set null,
  attempts smallint not null default 0,
  next_attempt_at timestamptz,
  last_error text,
  locked_until timestamptz,
  ig_container_id text,
  ig_media_id text,
  permalink text,
  published_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists instagram_posts_status_time_idx on public.instagram_posts (status, scheduled_at);
create index if not exists instagram_posts_campaign_idx on public.instagram_posts (campaign_id);

create table if not exists public.instagram_post_items (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.instagram_posts(id) on delete cascade,
  position smallint not null check (position between 0 and 9),
  costume_id uuid references public.costumes(id) on delete set null,
  source_bucket text not null,
  source_path text not null,
  alt_text text,
  unique (post_id, position)
);

-- Versión 4:5 (1080 × 1350) de cada imagen de origen, generada por la Edge Function.
create table if not exists public.instagram_image_variants (
  id uuid primary key default gen_random_uuid(),
  source_bucket text not null,
  source_path text not null,
  variant_path text not null,
  created_at timestamptz not null default now(),
  unique (source_bucket, source_path)
);

create table if not exists public.instagram_publish_log (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references public.instagram_posts(id) on delete cascade,
  level text not null check (level in ('info', 'error')),
  message text not null,
  created_at timestamptz not null default now()
);

create index if not exists instagram_publish_log_post_idx on public.instagram_publish_log (post_id, created_at);

-- RLS: CRUD solo admins en todas las tablas de trabajo.
do $$
declare
  t text;
begin
  foreach t in array array[
    'instagram_campaigns', 'instagram_rules', 'instagram_posts', 'instagram_post_items',
    'instagram_image_variants', 'instagram_publish_log'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists %I on public.%I', t || '_admin_all', t);
    execute format(
      'create policy %I on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())',
      t || '_admin_all', t
    );
  end loop;
end $$;

-- 4. Registro de uso de IA: nuevo tipo para los textos de carruseles --------------------------

alter table public.ai_usage_log drop constraint if exists ai_usage_log_kind_check;
alter table public.ai_usage_log
  add constraint ai_usage_log_kind_check check (kind in ('photo_edit', 'data_extract', 'caption'));

-- 5. Storage: imágenes públicas para Instagram ------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('instagram-media', 'instagram-media', true, 8388608, array['image/jpeg', 'image/png', 'image/webp']::text[])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists instagram_media_admin_insert on storage.objects;
create policy instagram_media_admin_insert on storage.objects
  for insert to authenticated with check (bucket_id = 'instagram-media' and public.is_admin());

drop policy if exists instagram_media_admin_update on storage.objects;
create policy instagram_media_admin_update on storage.objects
  for update to authenticated using (bucket_id = 'instagram-media' and public.is_admin());

drop policy if exists instagram_media_admin_delete on storage.objects;
create policy instagram_media_admin_delete on storage.objects
  for delete to authenticated using (bucket_id = 'instagram-media' and public.is_admin());

comment on table public.instagram_posts is
  'Carruseles de Instagram programados desde el panel (manuales, reglas y campañas).';
