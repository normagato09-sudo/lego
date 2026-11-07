import "server-only";
import { getSql } from "@/lib/db";
import { exigirSesion } from "@/lib/sesion";
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
  await exigirSesion();
  const sql = getSql();
  return (await sql`
    select id::integer as id, pieza, color, cantidad, ubicacion
    from piezas
    order by id
  `) as FilaPieza[];
}

export async function leerPieza(id: number): Promise<FilaPieza | undefined> {
  await exigirSesion();
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
  await exigirSesion();
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

/** Colores que ya se han usado alguna vez (para la fila "Mis colores"). Si falla, lista vacía. */
export async function coloresUsados(): Promise<string[]> {
  await exigirSesion();
  try {
    const sql = getSql();
    const filas = (await sql`select distinct color from piezas where color is not null`) as { color: string }[];
    return filas.map((f) => f.color);
  } catch (e) {
    console.error("No se pudieron leer los colores usados", e);
    return [];
  }
}
