import { createBrowserClient } from "@supabase/ssr";

/**
 * Crea un cliente de Supabase para usar en el navegador (Client Components).
 *
 * ⚠️ NO USADO TODAVÍA, A PROPÓSITO: ningún componente cliente llama hoy a
 * Supabase directamente; todo pasa por Server Actions que usan
 * `createAdminClient` (ver src/lib/supabase/admin.ts). Este cliente usa la
 * clave "anon", y como todas las tablas tienen RLS activado sin políticas
 * (ver supabase/migrations), cualquier lectura o escritura hecha con él
 * será denegada (0 filas o error de permisos) hasta que se implemente
 * autenticación y se creen las políticas de RLS correspondientes. Si vas a
 * usarlo, añade antes esas políticas o vas a depurar un "bug" que en
 * realidad es RLS funcionando como se espera.
 *
 * Ejemplo de uso (cuando corresponda):
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
