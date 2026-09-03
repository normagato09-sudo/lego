import { createBrowserClient } from "@supabase/ssr";

/**
 * Crea un cliente de Supabase para usar en el navegador (Client Components).
 *
 * Ejemplo de uso:
 *   "use client";
 *   import { createClient } from "@/lib/supabase/client";
 *   const supabase = createClient();
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
