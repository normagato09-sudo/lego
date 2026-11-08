"use server";

import { buscarPiezasRb } from "@/lib/rebrickable/piezas";
import { exigirSesion } from "@/lib/sesion";
import type { DatosRb } from "@/lib/vista";

/** Busca piezas para la pantalla "Elegir pieza". */
export async function buscarPiezas(
  categorias: number[],
  texto: string,
  pagina: number,
): Promise<{ piezas: DatosRb[]; hayMas: boolean; error?: string }> {
  await exigirSesion();
  if (
    !Array.isArray(categorias) ||
    categorias.some((c) => !Number.isInteger(c)) ||
    typeof texto !== "string" ||
    !Number.isInteger(pagina) ||
    pagina < 1
  ) {
    return { piezas: [], hayMas: false, error: "Búsqueda no válida." };
  }
  try {
    return await buscarPiezasRb(categorias.slice(0, 10), texto.slice(0, 80), pagina);
  } catch (e) {
    console.error("No se pudo buscar", e);
    return { piezas: [], hayMas: false, error: "No se pudo buscar. Revisa la conexión." };
  }
}
