# LEGO Inventory

Aplicación web para organizar y gestionar una colección personal de piezas LEGO.

## Stack

- [Next.js](https://nextjs.org/) (App Router)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)

## Configuración de Supabase

Este proyecto usa [Supabase](https://supabase.com/) como backend (aún sin tablas ni funcionalidades, solo la conexión preparada).

1. Copia `.env.example` como `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
2. Rellena las variables con los valores de tu proyecto de Supabase (Panel de Supabase → Project Settings → API):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

`.env.local` no se sube a Git (está en `.gitignore`).

## Desarrollo

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) para ver la aplicación.

## Scripts disponibles

- `npm run dev` — servidor de desarrollo
- `npm run build` — build de producción
- `npm run start` — servidor de producción (tras build)
- `npm run lint` — linter

## Estado del proyecto

Proyecto en construcción por pasos. Consulta el historial de commits para ver el progreso.
