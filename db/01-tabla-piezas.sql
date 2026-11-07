-- LEGO Inventario · Paso 3: tabla de piezas
-- Cada fila es un TIPO de pieza con su cantidad (no cada pieza suelta).
-- Cómo usarlo: Neon > SQL Editor > pegar todo > Run.

create table if not exists piezas (
  id          bigint generated always as identity primary key,
  forma       text not null
              check (forma in ('alta', 'fina', 'lisa', 'rampa', 'agujeros', 'muneco', 'rara')),
  subtipo     text not null,
  pieza       text not null,                    -- pieza exacta del catálogo, ej. 'fina-rect-2x8'
  color       text,                             -- vacío = sin color elegido
  cantidad    integer not null default 1 check (cantidad >= 0),
  ubicacion   text                              -- ej. 'C2-B03'; vacío = Sin ordenar
              check (ubicacion is null or ubicacion = upper(ubicacion)),
  creada      timestamptz not null default now(),
  actualizada timestamptz not null default now(),

  -- No puede haber dos filas con la misma pieza + color + ubicación.
  -- Si se añade una repetida, la app suma la cantidad.
  constraint piezas_sin_repetir unique nulls not distinct (pieza, color, ubicacion)
);
