-- LEGO Inventario · Enlazar tus piezas con el catálogo de Rebrickable
-- SOLO AÑADE 2 columnas nuevas (vacías) a la tabla "piezas":
--   part_num  = número de la pieza en Rebrickable (ej. '3034')
--   color_rb  = número del color en Rebrickable (ej. 4 = rojo)
-- No cambia ni borra ninguna de tus piezas ni ninguna columna que ya existe.
-- Cómo usarlo: Neon > SQL Editor > pegar todo > Run.

alter table piezas add column if not exists part_num text;
alter table piezas add column if not exists color_rb integer;

create index if not exists piezas_part_num on piezas (part_num);
