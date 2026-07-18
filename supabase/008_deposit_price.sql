-- Adds deposit price to costumes and republishes costumes_full to expose it

alter table costumes add column if not exists deposit_price numeric(12,2);

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
  ) as gallery,
  c.deposit_price
from costumes c
left join designers d on d.id = c.designer_id
left join categories cat on cat.id = c.category_id;
