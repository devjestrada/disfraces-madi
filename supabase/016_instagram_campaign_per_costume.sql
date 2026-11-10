-- Campañas de Instagram "un disfraz por carrusel" (spec: campanas_carrusel_por_disfraz).
-- Nuevo valor de agrupación, orden de publicación y estado (disfraces sin fecha disponible).

alter table public.instagram_campaigns drop constraint if exists instagram_campaigns_grouping_check;
alter table public.instagram_campaigns
  add constraint instagram_campaigns_grouping_check
  check (grouping in ('categoria', 'mezclado', 'destacados_primero', 'por_disfraz'));

-- En "un disfraz por carrusel" no aplica: se guarda nulo.
alter table public.instagram_campaigns alter column items_per_post drop not null;

alter table public.instagram_campaigns
  add column if not exists post_order text not null default 'destacados_primero';
alter table public.instagram_campaigns drop constraint if exists instagram_campaigns_post_order_check;
alter table public.instagram_campaigns
  add constraint instagram_campaigns_post_order_check
  check (post_order in ('destacados_primero', 'alternando'));

-- state.sin_fecha: [{ costume_id, name, detected_at }] disfraces que no cupieron en las fechas libres.
alter table public.instagram_campaigns
  add column if not exists state jsonb not null default '{}'::jsonb;

comment on column public.instagram_campaigns.post_order is
  'Orden de publicación en campañas por disfraz: destacados primero o alternando categorías.';
