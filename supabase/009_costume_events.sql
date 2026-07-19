-- Internal tracking events (costume detail views and WhatsApp CTA clicks)
-- No third-party analytics; anonymous session_id only, no PII stored.

create table if not exists public.costume_events (
  id uuid primary key default gen_random_uuid(),
  costume_id uuid not null references public.costumes(id) on delete cascade,
  event_type text not null check (event_type in ('view', 'whatsapp_click')),
  session_id text not null,
  occurred_at timestamptz not null default now()
);

create index if not exists costume_events_costume_type_time_idx
  on public.costume_events (costume_id, event_type, occurred_at);

alter table public.costume_events enable row level security;

drop policy if exists costume_events_anon_insert on public.costume_events;
create policy costume_events_anon_insert
  on public.costume_events
  for insert
  to anon
  with check (true);

drop policy if exists costume_events_admin_select on public.costume_events;
create policy costume_events_admin_select
  on public.costume_events
  for select
  to authenticated
  using (public.is_admin());

comment on table public.costume_events is
  'Anonymous internal tracking of costume detail views and WhatsApp CTA clicks. No third-party analytics, no PII.';
