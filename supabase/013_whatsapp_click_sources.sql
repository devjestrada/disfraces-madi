-- Medición completa de clics a WhatsApp (spec: tracking_clicks_whatsapp).
--
-- Hasta ahora solo se registraba el CTA de la ficha de disfraz, y costume_id era obligatorio,
-- así que no se podían registrar clics del botón flotante ni de otras páginas.
-- Esta migración:
--   1. hace opcional costume_id (los clics generales no tienen disfraz),
--   2. agrega `source` para saber de qué CTA viene cada clic,
--   3. exige que las visitas sigan teniendo disfraz,
--   4. marca los clics existentes como `costume_detail` (único CTA medido antes),
--   5. agrega un índice para los conteos por periodo.
-- Las políticas RLS (INSERT anon / SELECT admin) no cambian.

alter table public.costume_events
  alter column costume_id drop not null;

alter table public.costume_events
  add column if not exists source text;

update public.costume_events
set source = 'costume_detail'
where event_type = 'whatsapp_click'
  and source is null;

alter table public.costume_events
  drop constraint if exists costume_events_source_check;

alter table public.costume_events
  add constraint costume_events_source_check
  check (
    source is null
    or source in (
      'floating_button',
      'costume_detail',
      'catalog',
      'home_hero',
      'home_footer_cta',
      'services_card',
      'services_cta',
      'contact',
      'contact_direct',
      'footer'
    )
  );

alter table public.costume_events
  drop constraint if exists costume_events_view_requires_costume;

alter table public.costume_events
  add constraint costume_events_view_requires_costume
  check (event_type <> 'view' or costume_id is not null);

create index if not exists costume_events_type_time_idx
  on public.costume_events (event_type, occurred_at);

comment on column public.costume_events.source is
  'Origen del clic a WhatsApp (CTA del sitio). Nulo para eventos de tipo view.';
