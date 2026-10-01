-- ============================================================================
-- LEGO Inventory — Nombre opcional y pieza+color única también sin ubicación
--
-- ANTES DE EJECUTAR, comprueba que no hay duplicados (si los hay, el paso 2
-- falla y no se aplica nada):
--
--   select p.lego_id, c.name as color, p.location_id,
--          count(*) as filas, sum(p.quantity) as cantidad_total,
--          array_agg(p.id order by p.created_at) as ids
--   from pieces p
--   join colors c on c.id = p.color_id
--   group by p.lego_id, c.name, p.location_id
--   having count(*) > 1;
--
-- No borra columnas ni datos.
-- ============================================================================

-- 1. El formulario de pieza ya no pide nombre: la pieza se identifica por su
--    ID de diseño (lego_id). Donde no hay nombre, la app muestra el lego_id.
--    La restricción pieces_name_not_blank se mantiene: con name = null no
--    falla, y sigue impidiendo nombres vacíos.
alter table pieces alter column name drop not null;

-- 2. Las piezas nuevas se crean sin ubicación (location_id = null). Con un
--    unique normal cada null cuenta como distinto y se podía repetir la misma
--    pieza+color sin ubicación. Con "nulls not distinct" (Postgres 15+) dos
--    null cuentan como iguales.
alter table pieces
  drop constraint pieces_lego_id_color_location_unique,
  add constraint pieces_lego_id_color_location_unique
    unique nulls not distinct (lego_id, color_id, location_id);
