-- Adds child sizes to costume_size_enum and makes rental_price optional

-- Postgres no permite usar un valor de enum recien agregado dentro de la
-- misma transaccion en la que se agrego. Cada ALTER TYPE ... ADD VALUE debe
-- ejecutarse como sentencia independiente (asi lo hace por defecto el SQL
-- Editor de Supabase, que confirma cada sentencia por separado).
alter type costume_size_enum add value if not exists '4';
alter type costume_size_enum add value if not exists '6';
alter type costume_size_enum add value if not exists '8';
alter type costume_size_enum add value if not exists '10';
alter type costume_size_enum add value if not exists '12';
alter type costume_size_enum add value if not exists '14';
alter type costume_size_enum add value if not exists '16';

alter table costumes alter column rental_price drop not null;
