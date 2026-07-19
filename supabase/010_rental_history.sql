-- Historical rental records imported from digitized invoices (non_public_assets/alquileres_definitivo.csv)
-- Contains real customer PII (customer_name/address/phone) — admin-only access, no anon access at all.

create table if not exists public.costume_rental_history (
  id uuid primary key default gen_random_uuid(),
  source_file text,
  invoice_number text,
  customer_name text,
  customer_address text,
  customer_phone text,
  rental_date date,
  costume_label text not null,
  category_label text,
  accessories_text text,
  total_value numeric(12,2),
  deposit_value numeric(12,2),
  notes text,
  matched_costume_id uuid references public.costumes(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists costume_rental_history_matched_costume_idx
  on public.costume_rental_history (matched_costume_id);
create index if not exists costume_rental_history_rental_date_idx
  on public.costume_rental_history (rental_date);

-- Alias table: once a free-text costume_label is matched once, future imports
-- with that same label auto-resolve without repeating the matching work.
create table if not exists public.costume_label_aliases (
  id uuid primary key default gen_random_uuid(),
  label_norm text not null unique,
  matched_costume_id uuid references public.costumes(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.costume_rental_history enable row level security;
alter table public.costume_label_aliases enable row level security;

do $$
declare
  target_table text;
  target_tables text[] := array[
    'costume_rental_history',
    'costume_label_aliases'
  ];
begin
  foreach target_table in array target_tables
  loop
    execute format('drop policy if exists admin_select_%1$s on %1$I;', target_table);
    execute format('drop policy if exists admin_insert_%1$s on %1$I;', target_table);
    execute format('drop policy if exists admin_update_%1$s on %1$I;', target_table);
    execute format('drop policy if exists admin_delete_%1$s on %1$I;', target_table);

    execute format(
      'create policy admin_select_%1$s on %1$I for select to authenticated using (public.is_admin());',
      target_table
    );

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

comment on table public.costume_rental_history is
  'Historical rental records imported from digitized invoices. Contains real customer PII — admin-only, no anon access.';
comment on table public.costume_label_aliases is
  'Maps free-text costume labels from the historical CSV to a real costume_id, reused across future imports.';
