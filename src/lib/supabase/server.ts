import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Crea un cliente de Supabase para usar en el servidor
 * (Server Components, Route Handlers y Server Actions).
 *
 * Debe crearse una instancia nueva en cada request; no se debe
 * reutilizar entre peticiones ni guardar en una variable global.
 *
 * ⚠️ NO USADO TODAVÍA, A PROPÓSITO: hoy toda la app lee/escribe con
 * `createAdminClient` (ver src/lib/supabase/admin.ts), que usa la clave
 * "service_role" y salta RLS porque todavía no hay autenticación. Este
 * cliente usa la clave "anon" ligada a la sesión del usuario; como todas
 * las tablas tienen RLS activado sin políticas (ver supabase/migrations),
 * cualquier lectura o escritura hecha con él será denegada (0 filas o
 * error de permisos) hasta que exista autenticación real y se definan esas
 * políticas. Está pensado para conectarse en el paso en que se implemente
 * el login, no antes.
 *
 * Ejemplo de uso (cuando corresponda):
 *   import { createClient } from "@/lib/supabase/server";
 *   const supabase = await createClient();
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // `setAll` puede fallar si se llama desde un Server Component.
            // Esto es seguro de ignorar aquí porque, cuando llegue el
            // middleware de sesión (paso de autenticación), será quien
            // se encargue de refrescar las cookies.
          }
        },
      },
    },
  );
}
