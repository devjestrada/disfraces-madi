-- View and triggers for Disfraces Madi Supabase schema

create or replace view costumes_full as
select
  c.id,
  c.slug,
  c.name,
  cat.name as category,
  cat.slug as category_slug,
  c.description,
  d.name as designer,
  c.rental_price,
  c.sale_price,
  c.is_available,
  c.featured,
  c.rating,
  c.reviews_count,
  (
    select array_agg(cd.detail order by cd.sort_order)
    from costume_details cd
    where cd.costume_id = c.id
  ) as details,
  (
    select array_agg(f.name order by f.name)
    from costume_fabrics cf
    join fabrics f on f.id = cf.fabric_id
    where cf.costume_id = c.id
  ) as fabrics,
  (
    select array_agg(a.name order by a.name)
    from costume_accessories ca
    join accessories a on a.id = ca.accessory_id
    where ca.costume_id = c.id
  ) as accessories,
  (
    select array_agg(cs.size order by cs.size)
    from costume_sizes cs
    where cs.costume_id = c.id
  ) as sizes,
  (
    select ci.storage_path
    from costume_images ci
    where ci.costume_id = c.id and ci.is_primary
    limit 1
  ) as primary_image,
  (
    select array_agg(ci.storage_path order by ci.sort_order)
    from costume_images ci
    where ci.costume_id = c.id
  ) as gallery
from costumes c
left join designers d on d.id = c.designer_id
left join categories cat on cat.id = c.category_id;

create or replace function recalc_costume_rating() returns trigger as $$
declare
  target_id uuid;
begin
  target_id := coalesce(new.costume_id, old.costume_id);
  if target_id is null then
    return coalesce(new, old);
  end if;

  update costumes set
    rating = coalesce((
      select round(avg(r.rating)::numeric, 1)
      from reviews r
      where r.costume_id = target_id and r.is_published
    ), 0),
    reviews_count = (
      select count(*)
      from reviews r
      where r.costume_id = target_id and r.is_published
    ),
    updated_at = now()
  where id = target_id;

  return coalesce(new, old);
end;
$$ language plpgsql;

create trigger trg_recalc_costume_rating
after insert or update or delete on reviews
for each row execute function recalc_costume_rating();
