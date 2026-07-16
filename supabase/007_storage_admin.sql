-- Storage buckets and policies for admin-managed uploads

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'costume-images',
    'costume-images',
    true,
    5242880,
    array['image/jpeg', 'image/png', 'image/webp']::text[]
  ),
  (
    'review-avatars',
    'review-avatars',
    true,
    2097152,
    array['image/jpeg', 'image/png', 'image/webp']::text[]
  ),
  (
    'site-assets',
    'site-assets',
    true,
    5242880,
    array['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']::text[]
  )
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

do $$
declare
  bucket text;
  policy_suffix text;
  managed_buckets text[] := array['costume-images', 'review-avatars', 'site-assets'];
begin
  foreach bucket in array managed_buckets
  loop
    policy_suffix := replace(bucket, '-', '_');

    execute format('drop policy if exists public_read_%1$s on storage.objects;', policy_suffix);
    execute format('drop policy if exists admin_insert_%1$s on storage.objects;', policy_suffix);
    execute format('drop policy if exists admin_update_%1$s on storage.objects;', policy_suffix);
    execute format('drop policy if exists admin_delete_%1$s on storage.objects;', policy_suffix);

    execute format(
      'create policy public_read_%1$s on storage.objects for select to public using (bucket_id = %2$L);',
      policy_suffix,
      bucket
    );

    execute format(
      'create policy admin_insert_%1$s on storage.objects for insert to authenticated with check (bucket_id = %2$L and public.is_admin());',
      policy_suffix,
      bucket
    );

    execute format(
      'create policy admin_update_%1$s on storage.objects for update to authenticated using (bucket_id = %2$L and public.is_admin()) with check (bucket_id = %2$L and public.is_admin());',
      policy_suffix,
      bucket
    );

    execute format(
      'create policy admin_delete_%1$s on storage.objects for delete to authenticated using (bucket_id = %2$L and public.is_admin());',
      policy_suffix,
      bucket
    );
  end loop;
end $$;
