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
