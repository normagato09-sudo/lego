import "server-only";
import { getSql } from "@/lib/db";
import { normalizar } from "@/lib/texto";
import type { DatosRb } from "@/lib/vista";

export const POR_PAGINA = 60;




/**
 * Busca piezas del catálogo de Rebrickable.
 * - categorias: solo esas categorías (vacío = todas)
 * - texto: palabras que tienen que aparecer ("1x12", "clip", "redonda"…)
 * Ordena por medida (de pequeña a grande) y luego por nombre.
 */
export async function buscarPiezasRb(
  categorias: number[],
  texto: string,
  pagina: number,
): Promise<{ piezas: DatosRb[]; hayMas: boolean }> {
  const patrones = normalizar(texto)
    .replace(/[%_\\]/g, " ")
    .split(" ")
    .filter(Boolean)
    .slice(0, 6)
    .map((p) => `%${p}%`);
  const sql = getSql();
  const filas = (await sql`
    select r.part_num, r.nombre_en, r.medida, r.foto, c.nombre as categoria, c.forma
    from rb_piezas r
    join rb_categorias c on c.id = r.categoria_id
    where (cardinality(${categorias}::integer[]) = 0 or r.categoria_id = any(${categorias}::integer[]))
      and r.busqueda like all(${patrones}::text[])
    order by
      nullif(substring(r.medida from '^([0-9]+)'), '')::integer nulls last,
      nullif(substring(r.medida from '×[^0-9]*([0-9]+)'), '')::integer nulls last,
      r.nombre_en,
      r.part_num
    limit ${POR_PAGINA + 1} offset ${(pagina - 1) * POR_PAGINA}
  `) as DatosRb[];
  return { piezas: filas.slice(0, POR_PAGINA), hayMas: filas.length > POR_PAGINA };
}

export async function leerPiezaRb(partNum: string): Promise<DatosRb | undefined> {
  const sql = getSql();
  const filas = (await sql`
    select r.part_num, r.nombre_en, r.medida, r.foto, c.nombre as categoria, c.forma
    from rb_piezas r
    join rb_categorias c on c.id = r.categoria_id
    where r.part_num = ${partNum}
  `) as DatosRb[];
  return filas[0];
}
