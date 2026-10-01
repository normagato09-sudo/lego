-- ============================================================================
-- LEGO Inventory — Element ID y bucket de fotos de piezas
--
-- 1. Añade `pieces.element_id` (ID de pieza de LEGO: diseño + color
--    concreto). Es opcional.
-- 2. Crea el bucket de Storage `piece-images` para las fotos de las piezas.
--    Lectura pública (la URL pública se guarda en `pieces.image_url`).
--    La subida y el borrado se hacen solo desde el servidor con la clave
--    service_role, que salta RLS, por eso no se crean políticas.
--
-- Es idempotente: se puede ejecutar más de una vez sin efectos duplicados.
-- ============================================================================

alter table pieces add column if not exists element_id text;

comment on column pieces.element_id is 'ID de pieza de LEGO (Element ID): diseño + color concreto. Opcional.';

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'piece-images',
  'piece-images',
  true,
  4194304, -- 4 MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do nothing;
