import { createClient } from "@supabase/supabase-js";

/**
 * Cliente de Supabase con la clave "service_role".
 *
 * IMPORTANTE: solo se debe importar desde código que se ejecuta en el
 * servidor (Server Components, Server Actions, Route Handlers). Nunca debe
 * usarse desde un componente cliente ("use client"), porque saltaría la
 * seguridad de la base de datos.
 *
 * Todas las tablas tienen Row Level Security activado sin políticas
 * (ver supabase/migrations) y la aplicación todavía no tiene autenticación.
 * Hasta que se implemente ese paso, este cliente es el único camino de
 * acceso a los datos: al usar la service_role key salta RLS de forma
 * controlada, en vez de abrir el acceso público a través de la clave
 * "anon" (que sí se expone en el navegador).
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en las variables de entorno (revisa .env.local).",
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
