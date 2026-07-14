-- Supabase schema for Disfraces Madi

create extension if not exists "pgcrypto";

create type costume_size_enum as enum ('XS', 'S', 'M', 'L', 'XL', 'XXL');

create table categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table designers (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  bio text,
  created_at timestamptz not null default now()
);

create table costumes (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  category_id uuid not null references categories(id),
  description text not null,
  designer_id uuid references designers(id),
  rental_price numeric(12,2) not null,
  sale_price numeric(12,2),
  is_available boolean not null default true,
  featured boolean not null default false,
  rating numeric(2,1) not null default 0,
  reviews_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on costumes (category_id);
create index on costumes (featured);
create index on costumes (is_available);

create table costume_details (
  id uuid primary key default gen_random_uuid(),
  costume_id uuid not null references costumes(id) on delete cascade,
  detail text not null,
  sort_order integer not null default 0
);

create table fabrics (
  id uuid primary key default gen_random_uuid(),
  name text not null unique
);

create table costume_fabrics (
  costume_id uuid not null references costumes(id) on delete cascade,
  fabric_id uuid not null references fabrics(id) on delete cascade,
  primary key (costume_id, fabric_id)
);

create table accessories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique
);

create table costume_accessories (
  costume_id uuid not null references costumes(id) on delete cascade,
  accessory_id uuid not null references accessories(id) on delete cascade,
  primary key (costume_id, accessory_id)
);

create table costume_sizes (
  costume_id uuid not null references costumes(id) on delete cascade,
  size costume_size_enum not null,
  primary key (costume_id, size)
);

create table costume_images (
  id uuid primary key default gen_random_uuid(),
  costume_id uuid not null references costumes(id) on delete cascade,
  storage_path text not null,
  is_primary boolean not null default false,
  sort_order integer not null default 0,
  alt_text text
);
create unique index one_primary_per_costume on costume_images (costume_id) where (is_primary);

create table reviews (
  id uuid primary key default gen_random_uuid(),
  costume_id uuid references costumes(id) on delete set null,
  author_name text not null,
  author_role text,
  rating smallint not null check (rating between 1 and 5),
  comment text not null,
  avatar_storage_path text,
  review_date text,
  is_published boolean not null default true,
  created_at timestamptz not null default now()
);

create table site_stats (
  id boolean primary key default true check (id),
  years_of_tradition text,
  carnivals_lived text,
  costumes_rented text,
  happy_hearts text,
  updated_at timestamptz not null default now()
);

create table contact_info (
  id boolean primary key default true check (id),
  address text,
  city text,
  phone text,
  whatsapp text,
  email text,
  updated_at timestamptz not null default now()
);

create table working_hours (
  id uuid primary key default gen_random_uuid(),
  days text not null,
  hours text not null,
  sort_order integer not null default 0
);

create table site_assets (
  key text primary key,
  storage_path text not null
);
