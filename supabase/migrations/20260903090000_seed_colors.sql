-- ============================================================================
-- LEGO Inventory — Colores base (Paso 4)
--
-- La tabla `colors` se creó vacía en la migración inicial. Como
-- `pieces.color_id` es obligatorio (not null), hace falta al menos un color
-- para poder crear una pieza. Esta migración añade los colores básicos ya
-- definidos en el diseño visual aprobado.
--
-- Es idempotente (ON CONFLICT DO NOTHING): se puede ejecutar más de una vez
-- sin duplicar filas, y no borra colores que ya hayas añadido a mano.
-- ============================================================================

insert into colors (name, hex_code) values
  ('Rojo', '#c4281c'),
  ('Azul', '#0055bf'),
  ('Verde', '#237841'),
  ('Amarillo', '#f2cd37'),
  ('Negro', '#0b0d0e'),
  ('Blanco', '#ffffff'),
  ('Gris', '#6c6e68'),
  ('Transparente', null)
on conflict (name) do nothing;
