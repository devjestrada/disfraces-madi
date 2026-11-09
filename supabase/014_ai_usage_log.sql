-- Registro de uso de IA (spec: crear_disfraz_desde_foto).
--
-- Cada llamada exitosa de las Edge Functions `edit-costume-photo` y `extract-costume-data`
-- deja una fila aquí. Sirve para aplicar el límite por hora de cada admin (control de costos)
-- y para revisar el consumo. Solo las Edge Functions escriben (con la service role key);
-- los admins pueden leer.

create table if not exists public.ai_usage_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('photo_edit', 'data_extract')),
  model text,
  created_at timestamptz not null default now()
);

create index if not exists ai_usage_log_user_kind_time_idx
  on public.ai_usage_log (user_id, kind, created_at);

alter table public.ai_usage_log enable row level security;

drop policy if exists ai_usage_log_admin_select on public.ai_usage_log;
create policy ai_usage_log_admin_select
  on public.ai_usage_log
  for select
  to authenticated
  using (public.is_admin());

-- Sin políticas de INSERT/UPDATE/DELETE: solo la service role (Edge Functions) escribe.

comment on table public.ai_usage_log is
  'Uso de IA por admin (edición de fotos y extracción de datos) para límites por hora y control de costos.';
