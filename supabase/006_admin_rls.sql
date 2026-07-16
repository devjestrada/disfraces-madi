-- Admin write policies for management module

-- Replace broad non-anon write rules with strict admin-only rules.
drop policy if exists "Anon cannot insert" on costumes;
drop policy if exists "Anon cannot update" on costumes;
drop policy if exists "Anon cannot delete" on costumes;

drop policy if exists "Anon cannot insert reviews" on reviews;
drop policy if exists "Anon cannot update reviews" on reviews;
drop policy if exists "Anon cannot delete reviews" on reviews;

drop policy if exists "Anon cannot insert contact_info" on contact_info;
drop policy if exists "Anon cannot update contact_info" on contact_info;
drop policy if exists "Anon cannot delete contact_info" on contact_info;

drop policy if exists "Anon cannot insert site_stats" on site_stats;
drop policy if exists "Anon cannot update site_stats" on site_stats;
drop policy if exists "Anon cannot delete site_stats" on site_stats;

do $$
declare
  target_table text;
  target_tables text[] := array[
    'categories',
    'designers',
    'costumes',
    'costume_details',
    'fabrics',
    'costume_fabrics',
    'accessories',
    'costume_accessories',
    'costume_sizes',
    'costume_images',
    'reviews',
    'site_stats',
    'contact_info',
    'working_hours',
    'site_assets'
  ];
begin
  foreach target_table in array target_tables
  loop
    execute format('drop policy if exists admin_insert_%1$s on %1$I;', target_table);
    execute format('drop policy if exists admin_update_%1$s on %1$I;', target_table);
    execute format('drop policy if exists admin_delete_%1$s on %1$I;', target_table);

    execute format(
      'create policy admin_insert_%1$s on %1$I for insert to authenticated with check (public.is_admin());',
      target_table
    );

    execute format(
      'create policy admin_update_%1$s on %1$I for update to authenticated using (public.is_admin()) with check (public.is_admin());',
      target_table
    );

    execute format(
      'create policy admin_delete_%1$s on %1$I for delete to authenticated using (public.is_admin());',
      target_table
    );
  end loop;
end $$;
