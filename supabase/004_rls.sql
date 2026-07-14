-- RLS policies for Disfraces Madi

-- Enable RLS on public-facing tables
alter table categories enable row level security;
alter table designers enable row level security;
alter table costumes enable row level security;
alter table costume_details enable row level security;
alter table fabrics enable row level security;
alter table costume_fabrics enable row level security;
alter table accessories enable row level security;
alter table costume_accessories enable row level security;
alter table costume_sizes enable row level security;
alter table costume_images enable row level security;
alter table reviews enable row level security;
alter table site_stats enable row level security;
alter table contact_info enable row level security;
alter table working_hours enable row level security;
alter table site_assets enable row level security;

-- Public read-only policies
create policy "Public select categories" on categories
  for select using (true);
create policy "Public select designers" on designers
  for select using (true);
create policy "Public select costumes" on costumes
  for select using (true);
create policy "Public select costume_details" on costume_details
  for select using (true);
create policy "Public select fabrics" on fabrics
  for select using (true);
create policy "Public select costume_fabrics" on costume_fabrics
  for select using (true);
create policy "Public select accessories" on accessories
  for select using (true);
create policy "Public select costume_accessories" on costume_accessories
  for select using (true);
create policy "Public select costume_sizes" on costume_sizes
  for select using (true);
create policy "Public select costume_images" on costume_images
  for select using (true);
create policy "Public select reviews" on reviews
  for select using (is_published = true);
create policy "Public select site_stats" on site_stats
  for select using (true);
create policy "Public select contact_info" on contact_info
  for select using (true);
create policy "Public select working_hours" on working_hours
  for select using (true);
create policy "Public select site_assets" on site_assets
  for select using (true);

-- Optional: Block all direct writes from anon
create policy "Anon cannot insert" on costumes for insert with check (auth.role() != 'anon');
create policy "Anon cannot update" on costumes for update using (auth.role() != 'anon');
create policy "Anon cannot delete" on costumes for delete using (auth.role() != 'anon');

create policy "Anon cannot insert reviews" on reviews for insert with check (auth.role() != 'anon');
create policy "Anon cannot update reviews" on reviews for update using (auth.role() != 'anon');
create policy "Anon cannot delete reviews" on reviews for delete using (auth.role() != 'anon');

create policy "Anon cannot insert contact_info" on contact_info for insert with check (auth.role() != 'anon');
create policy "Anon cannot update contact_info" on contact_info for update using (auth.role() != 'anon');
create policy "Anon cannot delete contact_info" on contact_info for delete using (auth.role() != 'anon');

create policy "Anon cannot insert site_stats" on site_stats for insert with check (auth.role() != 'anon');
create policy "Anon cannot update site_stats" on site_stats for update using (auth.role() != 'anon');
create policy "Anon cannot delete site_stats" on site_stats for delete using (auth.role() != 'anon');

-- These write policies are intentionally broad and assume admin/service role writes happen outside anon.
