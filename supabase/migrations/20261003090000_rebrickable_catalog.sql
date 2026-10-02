-- ============================================================================
-- LEGO Inventory — Catálogo de Rebrickable (https://rebrickable.com/downloads/)
--
-- Tablas de solo catálogo, separadas del inventario (pieces). Se rellenan y
-- actualizan con `npm run catalog:import` (scripts/import-rebrickable.mjs).
-- Es idempotente: se puede ejecutar más de una vez.
--
-- Después de importar, comprueba:
--   select (select count(*) from catalog_colors) as colores,
--          (select count(*) from catalog_part_categories) as categorias,
--          (select count(*) from catalog_parts) as piezas,
--          (select count(*) from catalog_elements) as elementos,
--          (select count(*) from catalog_part_colors) as piezas_color;
-- ============================================================================

create table if not exists catalog_colors (
  id integer primary key,              -- id de color de Rebrickable
  name text not null,
  rgb text not null,                   -- sin '#', p. ej. 'C91A09'
  is_trans boolean not null default false
);

comment on table catalog_colors is 'Colores oficiales de Rebrickable.';

create table if not exists catalog_part_categories (
  id integer primary key,
  name text not null
);

comment on table catalog_part_categories is 'Categorías de pieza de Rebrickable.';

create table if not exists catalog_parts (
  part_num text primary key,
  name text not null,
  part_cat_id integer references catalog_part_categories(id),
  part_material text,
  img_url text                         -- foto representativa (color con más apariciones en sets)
);

comment on table catalog_parts is 'Piezas del catálogo de Rebrickable (part_num = ID de diseño en Rebrickable).';

create table if not exists catalog_elements (
  element_id text primary key,
  part_num text not null references catalog_parts(part_num) on delete cascade,
  color_id integer not null references catalog_colors(id),
  design_id text                       -- ID de diseño de LEGO (a veces distinto de part_num)
);

comment on table catalog_elements is 'Element IDs de LEGO (pieza + color) según Rebrickable.';

-- Colores en los que existe cada pieza (en sets o con element ID), con su foto
-- oficial y el element ID que se guarda al añadirla al inventario.
create table if not exists catalog_part_colors (
  part_num text not null references catalog_parts(part_num) on delete cascade,
  color_id integer not null references catalog_colors(id),
  img_url text,
  element_id text,
  primary key (part_num, color_id)
);

comment on table catalog_part_colors is 'Colores oficiales en los que existe cada pieza, con foto y element ID preferido.';

create index if not exists idx_catalog_parts_name_trgm on catalog_parts using gin (name gin_trgm_ops);
create index if not exists idx_catalog_parts_part_num_trgm on catalog_parts using gin (part_num gin_trgm_ops);
create index if not exists idx_catalog_elements_design_id on catalog_elements(design_id);
create index if not exists idx_catalog_elements_part_color on catalog_elements(part_num, color_id);

-- Mismo criterio que el resto de tablas: RLS sin políticas, solo accede el
-- servidor con la clave service_role.
alter table catalog_colors enable row level security;
alter table catalog_part_categories enable row level security;
alter table catalog_parts enable row level security;
alter table catalog_elements enable row level security;
alter table catalog_part_colors enable row level security;

-- Sugerencias al escribir: por part_num (prefijo), por ID de diseño de LEGO
-- (exacto) o por nombre (contiene). Primero la coincidencia exacta, luego el
-- ID de diseño de LEGO, luego los prefijos y por último los IDs más cortos.
create or replace function search_catalog_parts(q text, max_results integer default 10)
returns table (part_num text, name text, img_url text)
language sql
stable
as $$
  with term as (
    select btrim(q) as raw,
           replace(replace(replace(btrim(q), '\', '\\'), '%', '\%'), '_', '\_') as esc
  ),
  by_design as (
    select distinct e.part_num from catalog_elements e, term where e.design_id = term.raw
  )
  select p.part_num, p.name, p.img_url
  from catalog_parts p, term
  where term.raw <> ''
    and (p.part_num ilike term.esc || '%'
         or p.name ilike '%' || term.esc || '%'
         or p.part_num in (select bd.part_num from by_design bd))
  order by
    lower(p.part_num) = lower(term.raw) desc,
    p.part_num in (select bd.part_num from by_design bd) desc,
    p.part_num ilike term.esc || '%' desc,
    length(p.part_num),
    p.part_num
  limit max_results;
$$;
