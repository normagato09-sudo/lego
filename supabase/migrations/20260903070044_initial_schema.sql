-- ============================================================================
-- LEGO Inventory — Esquema inicial de base de datos (Paso 3)
--
-- Contiene: colores, ubicaciones (jerárquicas), piezas (inventario),
-- proyectos y la relación piezas-por-proyecto.
--
-- Todavía NO incluye: autenticación, datos reales, ni lógica de
-- descuento/devolución de inventario al montar/desmontar proyectos
-- (eso se construirá en un paso posterior).
-- ============================================================================

-- Extensiones necesarias
create extension if not exists "pgcrypto";   -- gen_random_uuid()
create extension if not exists "pg_trgm";    -- índices para búsqueda parcial de texto

-- Función genérica para mantener "updated_at" al día
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================================
-- COLORES
-- ============================================================================
create table if not exists colors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  hex_code text,
  created_at timestamptz not null default now(),
  constraint colors_name_not_blank check (btrim(name) <> ''),
  constraint colors_name_unique unique (name),
  constraint colors_hex_code_format check (hex_code is null or hex_code ~* '^#[0-9a-f]{6}$')
);

comment on table colors is 'Colores disponibles para las piezas LEGO.';

-- ============================================================================
-- UBICACIONES (jerárquicas: p.ej. Caja 1 -> Compartimento A)
-- ============================================================================
create table if not exists locations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  parent_id uuid references locations(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint locations_name_not_blank check (btrim(name) <> ''),
  constraint locations_name_parent_unique unique (parent_id, name)
);

comment on table locations is 'Ubicaciones físicas jerárquicas (p.ej. Caja 1 > Compartimento A).';

create index if not exists idx_locations_parent_id on locations(parent_id);

-- ============================================================================
-- PIEZAS (inventario)
-- Cada fila es una combinación única de pieza + color + ubicación.
-- ============================================================================
create table if not exists pieces (
  id uuid primary key default gen_random_uuid(),
  lego_id text not null,
  name text not null,
  description text,
  color_id uuid not null references colors(id) on delete restrict,
  quantity integer not null default 0,
  location_id uuid references locations(id) on delete set null,
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pieces_lego_id_not_blank check (btrim(lego_id) <> ''),
  constraint pieces_name_not_blank check (btrim(name) <> ''),
  constraint pieces_quantity_non_negative check (quantity >= 0),
  constraint pieces_lego_id_color_location_unique unique (lego_id, color_id, location_id)
);

comment on table pieces is 'Piezas LEGO en el inventario, cada fila es una combinación única de pieza+color+ubicación.';

create index if not exists idx_pieces_lego_id on pieces(lego_id);
create index if not exists idx_pieces_color_id on pieces(color_id);
create index if not exists idx_pieces_location_id on pieces(location_id);
create index if not exists idx_pieces_name_trgm on pieces using gin (name gin_trgm_ops);
create index if not exists idx_pieces_lego_id_trgm on pieces using gin (lego_id gin_trgm_ops);

create trigger trg_pieces_set_updated_at
before update on pieces
for each row
execute function set_updated_at();

-- ============================================================================
-- PROYECTOS
-- ============================================================================
create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint projects_name_not_blank check (btrim(name) <> '')
);

comment on table projects is 'Proyectos LEGO (modelos/construcciones) del usuario.';

create index if not exists idx_projects_name_trgm on projects using gin (name gin_trgm_ops);

create trigger trg_projects_set_updated_at
before update on projects
for each row
execute function set_updated_at();

-- ============================================================================
-- PIEZAS UTILIZADAS EN CADA PROYECTO (N:M con cantidad)
-- ============================================================================
create table if not exists project_pieces (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  piece_id uuid not null references pieces(id) on delete restrict,
  quantity integer not null,
  created_at timestamptz not null default now(),
  constraint project_pieces_quantity_positive check (quantity > 0),
  constraint project_pieces_project_piece_unique unique (project_id, piece_id)
);

comment on table project_pieces is 'Relación N:M entre proyectos y piezas, con la cantidad usada de cada pieza. La lógica de descuento/devolución de inventario se implementará en un paso posterior.';

create index if not exists idx_project_pieces_project_id on project_pieces(project_id);
create index if not exists idx_project_pieces_piece_id on project_pieces(piece_id);

-- ============================================================================
-- SEGURIDAD (Row Level Security)
--
-- La aplicación todavía no tiene autenticación. Para no exponer datos a
-- través de la clave anon (pública en el cliente del navegador), se activa
-- RLS en todas las tablas SIN políticas: por defecto Supabase/PostgREST
-- deniega todo acceso hasta que se definan políticas explícitas. Esas
-- políticas (por ejemplo, "solo el propietario ve sus piezas") se crearán
-- en el paso en el que se implemente la autenticación.
-- ============================================================================
alter table colors enable row level security;
alter table locations enable row level security;
alter table pieces enable row level security;
alter table projects enable row level security;
alter table project_pieces enable row level security;
