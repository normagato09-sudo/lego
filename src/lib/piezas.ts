import "server-only";
import { getSql } from "@/lib/db";
import { exigirSesion } from "@/lib/sesion";
import { ordenarUbicaciones } from "@/lib/ubicacion";
import type { DatosRb } from "@/lib/vista";

/** Una fila de la tabla piezas, con los datos de Rebrickable si está enlazada. */
export type FilaPieza = {
  id: number;
  pieza: string;
  color: string | null;
  cantidad: number;
  ubicacion: string | null;
  part_num: string | null;
  /** Foto, nombre y categoría de Rebrickable (null si no está enlazada). */
  rb: DatosRb | null;
};

type FilaBD = Omit<FilaPieza, "rb"> & {
  rb_nombre: string | null;
  rb_medida: string | null;
  rb_foto: string | null;
  rb_categoria: string | null;
  rb_forma: DatosRb["forma"] | null;
};

function convertir(f: FilaBD): FilaPieza {
  return {
    id: f.id,
    pieza: f.pieza,
    color: f.color,
    cantidad: f.cantidad,
    ubicacion: f.ubicacion,
    part_num: f.part_num,
    rb:
      f.part_num && f.rb_nombre && f.rb_categoria && f.rb_forma
        ? {
            part_num: f.part_num,
            nombre_en: f.rb_nombre,
            medida: f.rb_medida,
            foto: f.rb_foto,
            categoria: f.rb_categoria,
            forma: f.rb_forma,
          }
        : null,
  };
}

export async function leerPiezas(): Promise<FilaPieza[]> {
  await exigirSesion();
  const sql = getSql();
  const filas = (await sql`
    select p.id::integer as id, p.pieza, p.color, p.cantidad, p.ubicacion, p.part_num,
           r.nombre_en as rb_nombre, r.medida as rb_medida, r.foto as rb_foto,
           c.nombre as rb_categoria, c.forma as rb_forma
    from piezas p
    left join rb_piezas r on r.part_num = p.part_num
    left join rb_categorias c on c.id = r.categoria_id
    order by p.id
  `) as FilaBD[];
  return filas.map(convertir);
}

export async function leerPieza(id: number): Promise<FilaPieza | undefined> {
  await exigirSesion();
  const sql = getSql();
  const filas = (await sql`
    select p.id::integer as id, p.pieza, p.color, p.cantidad, p.ubicacion, p.part_num,
           r.nombre_en as rb_nombre, r.medida as rb_medida, r.foto as rb_foto,
           c.nombre as rb_categoria, c.forma as rb_forma
    from piezas p
    left join rb_piezas r on r.part_num = p.part_num
    left join rb_categorias c on c.id = r.categoria_id
    where p.id = ${id}
  `) as FilaBD[];
  return filas[0] ? convertir(filas[0]) : undefined;
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
