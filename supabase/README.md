# Esquema de base de datos

Las migraciones SQL de este directorio definen el esquema de la base de
datos y quedan versionadas en Git para poder reproducirlo en cualquier
momento.

## Cómo aplicar las migraciones a tu proyecto de Supabase

**Opción A — Editor SQL del panel de Supabase (más rápida, sin instalar nada)**
1. Abre tu proyecto en [supabase.com](https://supabase.com/dashboard).
2. Ve a **SQL Editor**.
3. Copia el contenido de `migrations/20260903070044_initial_schema.sql` y ejecútalo.

**Opción B — Supabase CLI (recomendada a largo plazo, mantiene el historial de migraciones sincronizado)**
```bash
npx supabase login
npx supabase link --project-ref <tu-project-ref>
npx supabase db push
```

## Contenido de esta primera migración

- Tablas: `colors`, `locations`, `pieces`, `projects`, `project_pieces`.
- Restricciones para evitar cantidades negativas y datos duplicados.
- Índices para búsquedas (incluidas búsquedas parciales por texto).
- RLS activado en todas las tablas, sin políticas todavía (acceso denegado
  por defecto hasta que se implemente la autenticación en un paso posterior).

No contiene datos reales ni claves de ningún tipo.

## Segunda migración (Paso 4)

`migrations/20260903090000_seed_colors.sql` añade los 8 colores base
(Rojo, Azul, Verde, Amarillo, Negro, Blanco, Gris, Transparente). Es
necesaria porque `pieces.color_id` es obligatorio y la tabla `colors` se
creó vacía — sin esto no se puede crear ninguna pieza. Aplícala igual que
la primera (SQL Editor o `supabase db push`).

## Tercera migración (element ID y fotos)

`migrations/20261001090000_element_id_and_piece_images.sql` añade la
columna opcional `pieces.element_id` (ID de pieza de LEGO) y crea el bucket
de Storage `piece-images` (lectura pública, máx. 4 MB, solo imágenes) donde
se guardan las fotos de las piezas. La subida y el borrado se hacen desde el
servidor con la clave service_role. Aplícala igual que las anteriores, antes
de desplegar el código que la usa.

## Cuarta migración (nombre opcional y pieza+color única)

`migrations/20261002090000_pieces_name_optional_unique_nulls.sql` hace
opcional `pieces.name` (el formulario ya no lo pide) y cambia la
restricción única `(lego_id, color_id, location_id)` a `nulls not distinct`,
para que no se pueda repetir la misma pieza en el mismo color sin ubicación.
Antes de ejecutarla, lanza la consulta de duplicados que hay en la cabecera
del archivo: si devuelve filas, hay que resolverlas primero.

## Quinta migración (catálogo de Rebrickable)

`migrations/20261003090000_rebrickable_catalog.sql` crea las tablas de
catálogo (`catalog_colors`, `catalog_part_categories`, `catalog_parts`,
`catalog_elements`, `catalog_part_colors`), separadas del inventario, y la
función `search_catalog_parts` para las sugerencias al añadir una pieza.

Después de aplicarla, rellena el catálogo desde tu ordenador:

1. Pon `NEXT_PUBLIC_SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` en `.env.local`.
2. Ejecuta `npm run catalog:import` (Node 20.9 o superior; tarda unos minutos).
3. Comprueba los recuentos con la consulta de la cabecera de la migración.

Para actualizar el catálogo más adelante, basta con repetir el paso 2: solo
añade o actualiza filas. Datos: [Rebrickable](https://rebrickable.com/downloads/).
