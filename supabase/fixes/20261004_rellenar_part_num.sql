-- ============================================================================
-- LEGO Inventory — Rellenar pieces.part_num en las piezas ya guardadas
--
-- REQUISITO: migración 20261004090000_pieces_part_num.sql aplicada.
-- No es una migración (no cambia el esquema): se ejecuta a mano una vez.
--
-- Misma regla que la app (src/lib/catalog.ts, resolvePartNum):
--   1. element ID exacto, si es de ese ID de diseño (o de ese part_num);
--   2. el ID escrito ya es un part_num;
--   3. el design_id corresponde a una sola pieza.
-- Si es ambiguo o no está en el catálogo, part_num queda null.
--
-- Ejecuta primero el BLOQUE A (solo lee) y, si te parece bien, el BLOQUE B.
-- ============================================================================


-- ---------------------------------------------------------------------------
-- BLOQUE A — Vista previa (no cambia nada)
-- ---------------------------------------------------------------------------
with propuesta as (
  select p.id, p.lego_id, p.element_id, p.color_id, p.location_id, p.quantity,
         p.part_num as part_num_actual,
         ee.part_num as por_element,
         dp.part_num as directo,
         (select min(e.part_num) from catalog_elements e
           where e.design_id = p.lego_id having count(distinct e.part_num) = 1) as por_design_id,
         (select count(distinct e.part_num) from catalog_elements e
           where e.design_id = p.lego_id) as piezas_con_ese_design_id
  from pieces p
  -- 1. element ID exacto (si es de ese ID de diseño o de ese part_num)
  left join catalog_elements ee on ee.element_id = p.element_id
                               and (ee.design_id = p.lego_id or ee.part_num = p.lego_id)
  -- 2. el ID escrito ya es un part_num
  left join catalog_parts dp on dp.part_num = p.lego_id
),
r as (
  select *, coalesce(por_element, directo, por_design_id) as part_num_nuevo from propuesta
)
select r.lego_id, r.element_id, c.name as color, r.quantity,
       r.part_num_actual, r.part_num_nuevo,
       case
         when r.part_num_nuevo is null and r.piezas_con_ese_design_id > 1
           then 'AMBIGUO: ' || r.piezas_con_ese_design_id || ' piezas; elígela al editar'
         when r.part_num_nuevo is null then 'no está en el catálogo'
         when r.por_element is not null then 'por element ID'
         when r.directo is not null then 'directo'
         else 'por design_id (única)'
       end as como,
       -- Otras filas que pasarían a ser la misma pieza en el mismo color (p. ej.
       -- 28653 roja y 3023 roja). No bloquea: solo avisa por si quieres juntarlas.
       (select string_agg(o.lego_id, ', ') from r o
         where o.id <> r.id and o.part_num_nuevo = r.part_num_nuevo
           and o.color_id = r.color_id and o.location_id is not distinct from r.location_id
       ) as repetida_con
from r
join catalog_colors c on c.id = r.color_id
order by r.part_num_nuevo nulls first, r.lego_id, c.name;


-- ---------------------------------------------------------------------------
-- BLOQUE B — Aplicar (solo piezas que aún no tienen part_num)
-- ---------------------------------------------------------------------------
begin;

update pieces p
set part_num = coalesce(
  (select e.part_num from catalog_elements e
    where e.element_id = p.element_id and (e.design_id = p.lego_id or e.part_num = p.lego_id)),
  (select cp.part_num from catalog_parts cp where cp.part_num = p.lego_id),
  (select min(e.part_num) from catalog_elements e
    where e.design_id = p.lego_id having count(distinct e.part_num) = 1)
)
where p.part_num is null
returning p.lego_id, p.element_id, p.color_id, p.part_num;

commit;
