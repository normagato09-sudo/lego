-- LEGO Inventario · Copia de seguridad antes de pasar al catálogo de Rebrickable
-- Crea la tabla piezas_copia con una copia EXACTA de todas tus piezas de ahora.
-- No cambia ni borra nada de la tabla piezas.
-- Cómo usarlo: Neon > SQL Editor > pegar todo > Run.

create table if not exists piezas_copia as
select * from piezas;

-- Comprobación: los dos números tienen que ser iguales.
select
  (select count(*) from piezas)       as piezas_ahora,
  (select count(*) from piezas_copia) as piezas_en_la_copia,
  (select coalesce(sum(cantidad), 0) from piezas)       as unidades_ahora,
  (select coalesce(sum(cantidad), 0) from piezas_copia) as unidades_en_la_copia;
