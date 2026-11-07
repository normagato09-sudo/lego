"use server";

import { redirect } from "next/navigation";
import { buscarColor, buscarPieza } from "@/lib/catalogo";
import { getSql } from "@/lib/db";
import { normalizarUbicacion } from "@/lib/ubicacion";

export type EstadoGuardar = { error?: string };

/**
 * Guarda un tipo de pieza. Si ya existe la misma pieza + color + ubicación,
 * suma la cantidad en vez de crear otra fila.
 */
export async function guardarPieza(_antes: EstadoGuardar, datos: FormData): Promise<EstadoGuardar> {
  const pieza = buscarPieza(String(datos.get("pieza") ?? ""));
  if (!pieza) return { error: "Esa pieza no está en el catálogo." };

  const colorId = String(datos.get("color") ?? "");
  if (colorId && !buscarColor(colorId)) return { error: "Ese color no está en la lista." };

  const cantidad = Number(datos.get("cantidad"));
  if (!Number.isInteger(cantidad) || cantidad < 1 || cantidad > 9999) {
    return { error: "La cantidad tiene que ser un número entre 1 y 9999." };
  }

  const ubicacion = normalizarUbicacion(String(datos.get("ubicacion") ?? ""));
  if (ubicacion === false) {
    return { error: "El código solo puede tener letras, números y guiones (ej.: C2-B03)." };
  }

  try {
    const sql = getSql();
    await sql`
      insert into piezas (forma, subtipo, pieza, color, cantidad, ubicacion)
      values (${pieza.forma}, ${pieza.subtipo}, ${pieza.id}, ${colorId || null}, ${cantidad}, ${ubicacion})
      on conflict on constraint piezas_sin_repetir
      do update set cantidad = piezas.cantidad + excluded.cantidad, actualizada = now()
    `;
  } catch (e) {
    console.error("No se pudo guardar la pieza", e);
    return { error: "No se pudo guardar. Revisa la conexión e inténtalo otra vez." };
  }

  redirect("/");
}
