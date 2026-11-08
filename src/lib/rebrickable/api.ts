import "server-only";

// Llamadas a la API de Rebrickable. La clave (REBRICKABLE_API_KEY) solo se usa
// aquí, en el servidor: nunca llega al navegador.

const BASE = "https://rebrickable.com/api/v3/lego";

export type PiezaApi = {
  part_num: string;
  name: string;
  part_cat_id: number;
  part_img_url: string | null;
  print_of?: string | null;
};

export type ColorApi = { id: number; name: string; rgb: string; is_trans: boolean };

export type PaginaApi<T> = { count: number; next: string | null; results: T[] };

const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Como pedirRebrickable, pero devuelve null si Rebrickable dice que no existe (404). */
export async function pedirRebrickableSiExiste<T>(ruta: string): Promise<T | null> {
  try {
    return await pedirRebrickable<T>(ruta);
  } catch (e) {
    if (e instanceof Error && e.message.includes("respondió 404")) return null;
    throw e;
  }
}

/** Fotos de una pieza en cada color en que existe. */
export type ColorDePiezaApi = { color_id: number; part_img_url: string | null };

/** Pide una dirección a Rebrickable. Si dice "demasiadas peticiones", espera y reintenta. */
export async function pedirRebrickable<T>(ruta: string): Promise<T> {
  const clave = process.env.REBRICKABLE_API_KEY;
  if (!clave) throw new Error("Falta REBRICKABLE_API_KEY en Vercel.");

  for (let intento = 1; intento <= 4; intento++) {
    const respuesta = await fetch(`${BASE}${ruta}`, {
      headers: { Authorization: `key ${clave}`, Accept: "application/json" },
      cache: "no-store",
    });
    if (respuesta.ok) return (await respuesta.json()) as T;
    if (respuesta.status === 429 && intento < 4) {
      // Rebrickable limita a ~1 petición por segundo.
      await esperar(1500 * intento);
      continue;
    }
    throw new Error(`Rebrickable respondió ${respuesta.status} a ${ruta}`);
  }
  throw new Error("Rebrickable no respondió.");
}
