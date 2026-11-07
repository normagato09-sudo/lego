import "server-only";
import { getSql } from "@/lib/db";
import { ordenarUbicaciones } from "@/lib/ubicacion";

/** Una fila de la tabla piezas. */
export type FilaPieza = {
  id: number;
  pieza: string;
  color: string | null;
  cantidad: number;
  ubicacion: string | null;
};

export async function leerPiezas(): Promise<FilaPieza[]> {
  const sql = getSql();
  return (await sql`
    select id::integer as id, pieza, color, cantidad, ubicacion
    from piezas
    order by id
  `) as FilaPieza[];
}

export async function leerPieza(id: number): Promise<FilaPieza | undefined> {
  const sql = getSql();
  const filas = (await sql`
    select id::integer as id, pieza, color, cantidad, ubicacion
    from piezas
    where id = ${id}
  `) as FilaPieza[];
  return filas[0];
}

/** Códigos de ubicación que ya se usan, en orden. Si falla, lista vacía. */
export async function ubicacionesUsadas(): Promise<string[]> {
  try {
    const sql = getSql();
    const filas = (await sql`select distinct ubicacion from piezas where ubicacion is not null`) as {
      ubicacion: string;
    }[];
    return ordenarUbicaciones(filas.map((f) => f.ubicacion));
  } catch (e) {
    console.error("No se pudieron leer las ubicaciones", e);
    return [];
  }
}
