-- ============================================================================
-- LEGO Inventory — Las piezas usan los colores oficiales de Rebrickable
--
-- REQUISITO: migración 20261003090000_rebrickable_catalog.sql aplicada y
-- catálogo importado (npm run catalog:import).
--
-- No convierte datos: el inventario está vacío. Si hubiera alguna pieza,
-- la migración da error y no cambia nada.
--
-- 1. pieces.color_id pasa de uuid (tabla colors) a integer (catalog_colors).
-- 2. Se borra la tabla colors, que ya no usa nada.
-- 3. Vista inventory_pieces: inventario con nombre, fotos y color del
--    catálogo en una sola consulta.
-- ============================================================================

begin;

do $$
begin
  if exists (select 1 from pieces) then
    raise exception 'pieces no está vacía: esta migración no convierte colores existentes.';
  end if;
  if not exists (select 1 from catalog_colors) then
    raise exception 'catalog_colors está vacía: ejecuta antes npm run catalog:import.';
  end if;
end $$;

-- Al borrar la columna se borran también su clave foránea, su índice y la
-- restricción única que la incluye; se recrean sobre la columna nueva.
alter table pieces drop column color_id;
alter table pieces add column color_id integer not null references catalog_colors(id);
alter table pieces add constraint pieces_lego_id_color_location_unique
  unique nulls not distinct (lego_id, color_id, location_id);
create index if not exists idx_pieces_color_id on pieces(color_id);

comment on column pieces.color_id is 'Color oficial de Rebrickable (catalog_colors.id).';

drop table colors;

create or replace view inventory_pieces with (security_invoker = true) as
select
  p.*,
  cp.name as catalog_name,
  cp.img_url as part_img_url,
  pc.img_url as color_img_url,
  c.name as color_name,
  c.rgb as color_rgb,
  c.is_trans as color_is_trans
from pieces p
join catalog_colors c on c.id = p.color_id
left join catalog_parts cp on cp.part_num = p.lego_id
left join catalog_part_colors pc on pc.part_num = p.lego_id and pc.color_id = p.color_id;

comment on view inventory_pieces is 'Inventario con nombre, fotos y color del catálogo de Rebrickable.';

commit;
