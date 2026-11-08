-- LEGO Inventario · Tablas del catálogo de Rebrickable
-- SOLO AÑADE 3 tablas nuevas. No cambia ni borra nada de "piezas" ni de "piezas_copia".
-- Cómo usarlo: Neon > SQL Editor > pegar todo > Run.

-- Categorías de Rebrickable, con su nombre en español y la forma (de las 7) donde van.
create table if not exists rb_categorias (
  id         integer primary key,          -- número de categoría en Rebrickable
  nombre_en  text not null,                -- nombre original en inglés
  nombre     text not null,                -- nombre sencillo en español
  forma      text not null
             check (forma in ('alta', 'fina', 'lisa', 'rampa', 'agujeros', 'muneco', 'rara')),
  orden      integer not null              -- orden dentro de su forma
);

-- Colores de Rebrickable, con su nombre en español.
create table if not exists rb_colores (
  id            integer primary key,       -- número de color en Rebrickable
  nombre_en     text not null,
  nombre        text not null,
  hex           text not null,             -- ej. '#C91A09'
  transparente  boolean not null default false,
  actual        boolean not null default false,   -- LEGO lo fabrica ahora
  familia       text,                      -- blancos, rojos, verdes...
  orden         integer
);

-- Piezas de Rebrickable (sin las versiones impresas, salvo en muñecos).
create table if not exists rb_piezas (
  part_num      text primary key,          -- número de pieza en Rebrickable, ej. '3034'
  nombre_en     text not null,             -- ej. 'Plate 2 x 8'
  categoria_id  integer not null references rb_categorias (id),
  foto          text,                      -- dirección de la foto en Rebrickable
  medida        text,                      -- ej. '2 × 8' (sacada del nombre)
  busqueda      text not null              -- texto preparado para el buscador
);

create index if not exists rb_piezas_categoria on rb_piezas (categoria_id);
