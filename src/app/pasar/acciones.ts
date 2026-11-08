"use server";

import { revalidatePath } from "next/cache";
import { getSql } from "@/lib/db";
import { COLOR_A_RB, PIEZA_A_RB } from "@/lib/rebrickable/equivalencias";
import { exigirSesion } from "@/lib/sesion";

export type FilaPasar = {
  id: number;
  pieza: string;
  color: string | null;
  cantidad: number;
  ubicacion: string | null;
  /** Ya enlazada antes (no se vuelve a tocar). */
  yaPasada: boolean;
  propuesta: { partNum: string; nombre: string; foto: string | null } | null;
  colorPropuesto: { id: number; nombre: string; hex: string; transparente: boolean } | null;
};

type FilaBD = {
  id: number;
  pieza: string;
  color: string | null;
  cantidad: number;
  ubicacion: string | null;
  part_num: string | null;
};

/** Tus piezas con la pieza y el color de Rebrickable que les corresponderían. */
export async function leerParaPasar(): Promise<FilaPasar[]> {
  await exigirSesion();
  const sql = getSql();
  const filas = (await sql`
    select id::integer as id, pieza, color, cantidad, ubicacion, part_num
    from piezas order by id
  `) as FilaBD[];

  const numeros = [...new Set(filas.map((f) => PIEZA_A_RB[f.pieza]).filter(Boolean))];
  const colores = [...new Set(filas.map((f) => (f.color ? COLOR_A_RB[f.color] : undefined)).filter((c) => c !== undefined))];

  const [piezasRb, coloresRb] = await Promise.all([
    sql`select part_num, nombre_en, foto from rb_piezas where part_num = any(${numeros})`,
    sql`select id, nombre, hex, transparente from rb_colores where id = any(${colores})`,
  ]) as [
    { part_num: string; nombre_en: string; foto: string | null }[],
    { id: number; nombre: string; hex: string; transparente: boolean }[],
  ];
  const piezaPorNum = new Map(piezasRb.map((p) => [p.part_num, p]));
  const colorPorId = new Map(coloresRb.map((c) => [c.id, c]));

  return filas.map((f) => {
    const rb = piezaPorNum.get(PIEZA_A_RB[f.pieza]);
    const colorId = f.color ? COLOR_A_RB[f.color] : undefined;
    const col = colorId !== undefined ? colorPorId.get(colorId) : undefined;
    return {
      id: f.id,
      pieza: f.pieza,
      color: f.color,
      cantidad: f.cantidad,
      ubicacion: f.ubicacion,
      yaPasada: f.part_num !== null,
      propuesta: rb ? { partNum: rb.part_num, nombre: rb.nombre_en, foto: rb.foto } : null,
      colorPropuesto: col ?? null,
    };
  });
}

/**
 * Rellena part_num y color_rb de las piezas elegidas. No cambia ninguna otra
 * columna ni borra nada. Las que ya estaban enlazadas no se tocan.
 */
export async function pasarPiezas(ids: number[]): Promise<{ error?: string; pasadas?: number }> {
  await exigirSesion();
  if (!Array.isArray(ids) || ids.some((i) => !Number.isInteger(i))) return { error: "Lista no válida." };
  try {
    // Se vuelve a calcular todo aquí, en el servidor (no se fía de lo que manda el navegador).
    const filas = (await leerParaPasar()).filter((f) => ids.includes(f.id) && !f.yaPasada && f.propuesta);
    if (filas.length === 0) return { pasadas: 0 };
    const sql = getSql();
    await sql`
      update piezas p
      set part_num = d.part_num, color_rb = d.color_rb
      from unnest(
        ${filas.map((f) => f.id)}::bigint[],
        ${filas.map((f) => f.propuesta!.partNum)}::text[],
        ${filas.map((f) => f.colorPropuesto?.id ?? null)}::integer[]
      ) as d(id, part_num, color_rb)
      where p.id = d.id and p.part_num is null
    `;
    revalidatePath("/pasar");
    return { pasadas: filas.length };
  } catch (e) {
    console.error("No se pudieron pasar las piezas", e);
    return { error: "No se pudo guardar. Revisa la conexión. No se ha cambiado nada." };
  }
}
