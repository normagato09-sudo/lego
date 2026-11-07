"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { buscarColor, buscarPieza, type Pieza } from "@/lib/catalogo";
import { getSql } from "@/lib/db";
import { exigirSesion } from "@/lib/sesion";
import { normalizarUbicacion } from "@/lib/ubicacion";

export type EstadoGuardar = { error?: string };

type Datos = { pieza: Pieza; color: string | null; cantidad: number; ubicacion: string | null };

/** Comprueba lo que llega del formulario. Devuelve los datos limpios o un mensaje de error. */
function leerFormulario(datos: FormData, minimo: number): Datos | string {
  const pieza = buscarPieza(String(datos.get("pieza") ?? ""));
  if (!pieza) return "Esa pieza no está en el catálogo.";

  const colorId = String(datos.get("color") ?? "");
  const color = colorId ? buscarColor(colorId) : undefined;
  if (colorId && !color) {
    return colorId.startsWith("otro:")
      ? "Escribe el nombre del otro color (máximo 30 letras)."
      : "Ese color no está en la lista.";
  }

  const cantidad = Number(datos.get("cantidad"));
  if (!Number.isInteger(cantidad) || cantidad < minimo || cantidad > 9999) {
    return `La cantidad tiene que ser un número entre ${minimo} y 9999.`;
  }

  const ubicacion = normalizarUbicacion(String(datos.get("ubicacion") ?? ""));
  if (ubicacion === false) return "El código solo puede tener letras, números y guiones (ej.: C2-B03).";

  return { pieza, color: color?.id ?? null, cantidad, ubicacion };
}

const ERROR_CONEXION = "No se pudo guardar. Revisa la conexión e inténtalo otra vez.";

/**
 * Añade un tipo de pieza. Si ya existe la misma pieza + color + ubicación,
 * suma la cantidad en vez de crear otra fila.
 */
export async function guardarPieza(_antes: EstadoGuardar, formulario: FormData): Promise<EstadoGuardar> {
  await exigirSesion();
  const d = leerFormulario(formulario, 1);
  if (typeof d === "string") return { error: d };

  try {
    const sql = getSql();
    await sql`
      insert into piezas (forma, subtipo, pieza, color, cantidad, ubicacion)
      values (${d.pieza.forma}, ${d.pieza.subtipo}, ${d.pieza.id}, ${d.color}, ${d.cantidad}, ${d.ubicacion})
      on conflict on constraint piezas_sin_repetir
      do update set cantidad = piezas.cantidad + excluded.cantidad, actualizada = now()
    `;
  } catch (e) {
    console.error("No se pudo guardar la pieza", e);
    return { error: ERROR_CONEXION };
  }

  revalidatePath("/");
  redirect("/");
}

/**
 * Cambia una pieza ya guardada. Si con los cambios queda igual que otra
 * (misma pieza + color + ubicación), se juntan las dos sumando la cantidad.
 */
export async function editarPieza(id: number, _antes: EstadoGuardar, formulario: FormData): Promise<EstadoGuardar> {
  await exigirSesion();
  const d = leerFormulario(formulario, 0);
  if (typeof d === "string") return { error: d };

  const sql = getSql();
  try {
    await sql`
      update piezas
      set forma = ${d.pieza.forma}, subtipo = ${d.pieza.subtipo}, pieza = ${d.pieza.id},
          color = ${d.color}, cantidad = ${d.cantidad}, ubicacion = ${d.ubicacion}, actualizada = now()
      where id = ${id}
    `;
  } catch (e) {
    const repetida = (e as { code?: string }).code === "23505";
    if (!repetida) {
      console.error("No se pudo editar la pieza", e);
      return { error: ERROR_CONEXION };
    }
    try {
      await sql.transaction([
        sql`
          update piezas set cantidad = cantidad + ${d.cantidad}, actualizada = now()
          where pieza = ${d.pieza.id}
            and color is not distinct from ${d.color}
            and ubicacion is not distinct from ${d.ubicacion}
            and id <> ${id}
        `,
        sql`delete from piezas where id = ${id}`,
      ]);
    } catch (e2) {
      console.error("No se pudieron juntar las piezas", e2);
      return { error: ERROR_CONEXION };
    }
  }

  revalidatePath("/");
  redirect("/");
}

export async function borrarPieza(id: number): Promise<EstadoGuardar> {
  await exigirSesion();
  try {
    const sql = getSql();
    await sql`delete from piezas where id = ${id}`;
  } catch (e) {
    console.error("No se pudo borrar la pieza", e);
    return { error: "No se pudo borrar. Revisa la conexión e inténtalo otra vez." };
  }
  revalidatePath("/");
  redirect("/");
}

export type FilaCopia = {
  pieza: string;
  color: string | null;
  cantidad: number;
  ubicacion: string | null;
};

/**
 * Carga una copia de seguridad: BORRA todas las piezas actuales y pone
 * las de la copia. Si falla algo, no se cambia nada.
 */
export async function cargarCopia(filas: FilaCopia[]): Promise<{ error?: string; cargadas?: number }> {
  await exigirSesion();
  if (!Array.isArray(filas) || filas.length > 5000) {
    return { error: "El archivo no parece una copia de LEGO Inventario." };
  }

  const limpias: { pieza: Pieza; color: string | null; cantidad: number; ubicacion: string | null }[] = [];
  for (const f of filas) {
    const pieza = buscarPieza(String(f?.pieza ?? ""));
    const color = f?.color ? String(f.color) : null;
    const cantidad = Number(f?.cantidad);
    const ubicacion = normalizarUbicacion(String(f?.ubicacion ?? ""));
    if (
      !pieza ||
      (color && !buscarColor(color)) ||
      !Number.isInteger(cantidad) ||
      cantidad < 0 ||
      cantidad > 9999 ||
      ubicacion === false
    ) {
      return { error: "La copia tiene piezas que no se entienden. No se ha cambiado nada." };
    }
    // Si la misma pieza + color + ubicación sale dos veces, se suman.
    const igual = limpias.find((x) => x.pieza.id === pieza.id && x.color === color && x.ubicacion === ubicacion);
    if (igual) igual.cantidad = Math.min(9999, igual.cantidad + cantidad);
    else limpias.push({ pieza, color, cantidad, ubicacion });
  }

  try {
    const sql = getSql();
    await sql.transaction([
      sql`delete from piezas`,
      sql`
        insert into piezas (forma, subtipo, pieza, color, cantidad, ubicacion)
        select * from unnest(
          ${limpias.map((f) => f.pieza.forma)}::text[],
          ${limpias.map((f) => f.pieza.subtipo)}::text[],
          ${limpias.map((f) => f.pieza.id)}::text[],
          ${limpias.map((f) => f.color)}::text[],
          ${limpias.map((f) => f.cantidad)}::integer[],
          ${limpias.map((f) => f.ubicacion)}::text[]
        )
      `,
    ]);
  } catch (e) {
    console.error("No se pudo cargar la copia", e);
    return { error: "No se pudo cargar la copia. Revisa la conexión. No se ha cambiado nada." };
  }

  revalidatePath("/");
  revalidatePath("/cajas");
  return { cargadas: limpias.length };
}

/** Suma o resta unidades (nunca baja de 0). Devuelve la cantidad nueva o null si falla. */
export async function cambiarCantidad(id: number, cambio: number): Promise<number | null> {
  await exigirSesion();
  if (!Number.isInteger(id) || (cambio !== 1 && cambio !== -1)) return null;
  try {
    const sql = getSql();
    const filas = (await sql`
      update piezas
      set cantidad = greatest(0, least(9999, cantidad + ${cambio})), actualizada = now()
      where id = ${id}
      returning cantidad
    `) as { cantidad: number }[];
    return filas[0]?.cantidad ?? null;
  } catch (e) {
    console.error("No se pudo cambiar la cantidad", e);
    return null;
  }
}
