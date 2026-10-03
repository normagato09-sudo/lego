-- ============================================================================
-- LEGO Inventory — Corregir colores según el element ID y las piezas "6114"
--
-- REQUISITO: migración 20261004090000_pieces_part_num.sql aplicada.
-- No es una migración (no cambia el esquema): se ejecuta a mano una vez.
--
-- 1. Piezas guardadas como 6114 (errata): sus element ID son de la 6141
--    (Plate Round 1 x 1) → lego_id 6141 y part_num 6141.
-- 2. Todo el inventario: si el color guardado no coincide con el color de su
--    element ID, se cambia al del element ID.
--
-- Las filas que al corregirse chocarían con otra (mismo ID de diseño + color,
-- o misma pieza del catálogo + color, en la misma ubicación) NO se cambian:
-- salen marcadas en la vista previa para que las juntes a mano.
--
-- Ejecuta primero solo el BLOQUE A (selecciónalo y Run) y, si te parece bien,
-- solo el BLOQUE B.
-- ============================================================================


-- ---------------------------------------------------------------------------
-- BLOQUE A — Vista previa (no cambia nada)
-- ---------------------------------------------------------------------------
with base as (
  select p.id, p.lego_id, p.part_num, p.element_id, p.color_id, p.location_id, p.quantity,
         e.part_num as element_part_num,
         -- 1. 6114 → 6141 (solo si el element ID es de la 6141)
         case when p.lego_id = '6114' and e.part_num = '6141' then '6141' else p.lego_id end as lego_id_nuevo,
         case when p.lego_id = '6114' and e.part_num = '6141' then '6141' else p.part_num end as part_num_nuevo,
         -- 2. color del element ID (si el element está en el catálogo)
         coalesce(e.color_id, p.color_id) as color_id_nuevo
  from pieces p
  left join catalog_elements e on e.element_id = p.element_id
),
final as (
  select b.*,
         (b.lego_id_nuevo, b.part_num_nuevo, b.color_id_nuevo)
           is distinct from (b.lego_id, b.part_num, b.color_id) as cambia,
         -- chocaría con la restricción única (ID de diseño + color + ubicación)
         count(*) over (partition by b.lego_id_nuevo, b.color_id_nuevo, b.location_id) > 1 as dup_unico,
         -- misma pieza del catálogo + color + ubicación (el aviso de "ya la tienes")
         count(*) over (partition by coalesce(b.part_num_nuevo, b.lego_id_nuevo), b.color_id_nuevo, b.location_id) > 1 as dup_pieza
  from base b
)
select f.lego_id, f.element_id, f.quantity,
       ca.name as color_actual,
       cn.name as color_nuevo,
       f.lego_id_nuevo, f.part_num_nuevo,
       case
         when f.dup_unico then 'DUPLICADO (ID de diseño + color): no se cambia, júntalas a mano'
         when f.dup_pieza then 'DUPLICADO (pieza + color): no se cambia, júntalas a mano'
         when f.element_part_num is not null
              and f.element_part_num is distinct from coalesce(f.part_num_nuevo, f.lego_id_nuevo)
           then 'se cambia (OJO: el element ID es de la pieza ' || f.element_part_num || ')'
         else 'se cambia'
       end as resultado
from final f
join catalog_colors ca on ca.id = f.color_id
join catalog_colors cn on cn.id = f.color_id_nuevo
where f.cambia or f.dup_unico or f.dup_pieza
order by resultado, f.lego_id, ca.name;


-- ---------------------------------------------------------------------------
-- BLOQUE B — Aplicar
-- ---------------------------------------------------------------------------
begin;

create temp table cambios on commit drop as
with base as (
  select p.id, p.lego_id, p.part_num, p.color_id, p.location_id,
         case when p.lego_id = '6114' and e.part_num = '6141' then '6141' else p.lego_id end as lego_id_nuevo,
         case when p.lego_id = '6114' and e.part_num = '6141' then '6141' else p.part_num end as part_num_nuevo,
         coalesce(e.color_id, p.color_id) as color_id_nuevo
  from pieces p
  left join catalog_elements e on e.element_id = p.element_id
),
final as (
  select b.*,
         (b.lego_id_nuevo, b.part_num_nuevo, b.color_id_nuevo)
           is distinct from (b.lego_id, b.part_num, b.color_id) as cambia,
         count(*) over (partition by b.lego_id_nuevo, b.color_id_nuevo, b.location_id) > 1 as dup_unico,
         count(*) over (partition by coalesce(b.part_num_nuevo, b.lego_id_nuevo), b.color_id_nuevo, b.location_id) > 1 as dup_pieza
  from base b
)
select id, lego_id_nuevo, part_num_nuevo, color_id_nuevo
from final
where cambia and not dup_unico and not dup_pieza;

-- Paso 1: apartar las filas que cambian. Los colores están encadenados (p. ej.
-- Dark Green → Green mientras la de Green pasa a Bright Green) y la restricción
-- única se comprueba fila a fila: con un solo UPDATE chocarían a mitad.
update pieces p
set lego_id = p.lego_id || ' (corrigiendo ' || p.id || ')'
from cambios c
where c.id = p.id;

-- Paso 2: valores definitivos.
update pieces p
set lego_id = c.lego_id_nuevo,
    part_num = c.part_num_nuevo,
    color_id = c.color_id_nuevo
from cambios c
where c.id = p.id
returning p.lego_id, p.part_num, p.element_id, p.color_id;

commit;
