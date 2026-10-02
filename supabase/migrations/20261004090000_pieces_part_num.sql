-- ============================================================================
-- LEGO Inventory — Pieza del catálogo de Rebrickable para cada pieza
--
-- pieces.lego_id sigue siendo el ID de diseño de LEGO tal como se escribe
-- (p. ej. 28653, el de Pick a Brick). pieces.part_num es la pieza de
-- Rebrickable que le corresponde (p. ej. 3023): la rellena la app al guardar
-- y sirve para fotos, nombres, colores y para agrupar diseños.
-- null = no está en el catálogo o el ID es ambiguo.
--
-- Después: supabase/fixes/20261004_rellenar_part_num.sql para las piezas ya guardadas.
-- ============================================================================

begin;

alter table pieces
  add column if not exists part_num text references catalog_parts(part_num) on delete set null;
create index if not exists idx_pieces_part_num on pieces(part_num);

comment on column pieces.part_num is
  'Pieza de Rebrickable (catalog_parts) que corresponde a lego_id; null si no está en el catálogo o es ambigua.';

-- La vista se recrea (p.* cambia de columnas) y ahora une el catálogo por part_num.
drop view if exists inventory_pieces;
create view inventory_pieces with (security_invoker = true) as
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
left join catalog_parts cp on cp.part_num = p.part_num
left join catalog_part_colors pc on pc.part_num = p.part_num and pc.color_id = p.color_id;

comment on view inventory_pieces is 'Inventario con nombre, fotos y color del catálogo de Rebrickable (por part_num).';

commit;
