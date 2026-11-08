"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { buscarColor, buscarPieza } from "@/lib/catalogo";
import { getSql } from "@/lib/db";
import { COLOR_A_RB } from "@/lib/rebrickable/equivalencias";
import { exigirSesion } from "@/lib/sesion";
import { normalizarUbicacion } from "@/lib/ubicacion";
import { PREFIJO_RB } from "@/lib/vista";

export type EstadoGuardar = { error?: string };

/** Lo necesario para guardar una pieza en la tabla. */
type PiezaGuardable = {
  /** Columna "pieza": "rb:3034" o el código antiguo. */
  clave: string;
  forma: string;
  subtipo: string;
  /** Número de Rebrickable (null en piezas antiguas sin enlazar). */
  partNum: string | null;
};

type Datos = {
  pieza: PiezaGuardable;
  color: string | null;
  colorRb: number | null;
  cantidad: number;
  ubicacion: string | null;
};

/** Busca una pieza por su clave: en Rebrickable ("rb:…") o en el catálogo antiguo. */
async function resolverPieza(clave: string): Promise<PiezaGuardable | undefined> {
  if (clave.startsWith(PREFIJO_RB)) {
    const partNum = clave.slice(PREFIJO_RB.length);
    const sql = getSql();
    const filas = (await sql`
      select r.part_num, r.categoria_id, c.forma
      from rb_piezas r join rb_categorias c on c.id = r.categoria_id
      where r.part_num = ${partNum}
    `) as { part_num: string; categoria_id: number; forma: string }[];
    const f = filas[0];
    return f ? { clave, forma: f.forma, subtipo: `rb-${f.categoria_id}`, partNum: f.part_num } : undefined;
  }
  const p = buscarPieza(clave);
  return p ? { clave: p.id, forma: p.forma, subtipo: p.subtipo, partNum: null } : undefined;
}

/** Comprueba lo que llega del formulario. Devuelve los datos limpios o un mensaje de error. */
async function leerFormulario(datos: FormData, minimo: number): Promise<Datos | string> {
  const pieza = await resolverPieza(String(datos.get("pieza") ?? ""));
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

  const colorGuardado = color?.id ?? null;
  return {
    pieza,
    color: colorGuardado,
    colorRb: colorGuardado ? (COLOR_A_RB[colorGuardado] ?? null) : null,
    cantidad,
    ubicacion,
  };
}

/**
 * ¿Hay ya otra fila con la misma pieza + color + ubicación?
 * Para piezas de Rebrickable se compara por su número (así una pieza antigua
 * ya enlazada y una nueva de la misma pieza cuentan como la misma).
 */
async function buscarIgual(d: Datos, sinId?: number): Promise<number | undefined> {
  const sql = getSql();
  const otra = sinId ?? -1;
  const filas = (
    d.pieza.partNum
      ? await sql`
          select id::integer as id from piezas
          where part_num = ${d.pieza.partNum}
            and color is not distinct from ${d.color}
            and ubicacion is not distinct from ${d.ubicacion}
            and id <> ${otra}
          order by id limit 1`
      : await sql`
          select id::integer as id from piezas
          where pieza = ${d.pieza.clave} and part_num is null
            and color is not distinct from ${d.color}
            and ubicacion is not distinct from ${d.ubicacion}
            and id <> ${otra}
          order by id limit 1`
  ) as { id: number }[];
  return filas[0]?.id;
}

const ERROR_CONEXION = "No se pudo guardar. Revisa la conexión e inténtalo otra vez.";

/**
 * Añade un tipo de pieza. Si ya existe la misma pieza + color + ubicación,
 * suma la cantidad en vez de crear otra fila.
 */
export async function guardarPieza(_antes: EstadoGuardar, formulario: FormData): Promise<EstadoGuardar> {
  await exigirSesion();
  try {
    const d = await leerFormulario(formulario, 1);
    if (typeof d === "string") return { error: d };

    const sql = getSql();
    const igual = await buscarIgual(d);
    if (igual !== undefined) {
      await sql`
        update piezas set cantidad = least(9999, cantidad + ${d.cantidad}), actualizada = now()
        where id = ${igual}
      `;
    } else {
      await sql`
        insert into piezas (forma, subtipo, pieza, color, cantidad, ubicacion, part_num, color_rb)
        values (${d.pieza.forma}, ${d.pieza.subtipo}, ${d.pieza.clave}, ${d.color}, ${d.cantidad},
                ${d.ubicacion}, ${d.pieza.partNum}, ${d.colorRb})
        on conflict on constraint piezas_sin_repetir
        do update set cantidad = least(9999, piezas.cantidad + excluded.cantidad), actualizada = now()
      `;
    }
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
  try {
    const d = await leerFormulario(formulario, 0);
    if (typeof d === "string") return { error: d };

    const sql = getSql();
    const igual = await buscarIgual(d, id);
    if (igual !== undefined) {
      await sql.transaction([
        sql`
          update piezas set cantidad = least(9999, cantidad + ${d.cantidad}), actualizada = now()
          where id = ${igual}
        `,
        sql`delete from piezas where id = ${id}`,
      ]);
    } else {
      await sql`
        update piezas
        set forma = ${d.pieza.forma}, subtipo = ${d.pieza.subtipo}, pieza = ${d.pieza.clave},
            color = ${d.color}, cantidad = ${d.cantidad}, ubicacion = ${d.ubicacion},
            part_num = ${d.pieza.partNum}, color_rb = ${d.colorRb}, actualizada = now()
        where id = ${id}
      `;
    }
  } catch (e) {
    console.error("No se pudo editar la pieza", e);
    return { error: ERROR_CONEXION };
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
  /** Número de Rebrickable (las copias antiguas no lo traen). */
  part_num?: string | null;
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

  try {
    const sql = getSql();

    // Datos de Rebrickable de todas las piezas de la copia, de una vez.
    const numeros = [
      ...new Set(
        filas.flatMap((f) => {
          const clave = String(f?.pieza ?? "");
          const n = clave.startsWith(PREFIJO_RB) ? [clave.slice(PREFIJO_RB.length)] : [];
          if (f?.part_num) n.push(String(f.part_num));
          return n;
        }),
      ),
    ];
    const rb = (await sql`
      select r.part_num, r.categoria_id, c.forma
      from rb_piezas r join rb_categorias c on c.id = r.categoria_id
      where r.part_num = any(${numeros}::text[])
    `) as { part_num: string; categoria_id: number; forma: string }[];
    const rbPorNum = new Map(rb.map((r) => [r.part_num, r]));

    type Limpia = { p: PiezaGuardable; color: string | null; cantidad: number; ubicacion: string | null };
    const limpias: Limpia[] = [];
    for (const f of filas) {
      const clave = String(f?.pieza ?? "");
      let p: PiezaGuardable | undefined;
      if (clave.startsWith(PREFIJO_RB)) {
        const r = rbPorNum.get(clave.slice(PREFIJO_RB.length));
        if (r) p = { clave, forma: r.forma, subtipo: `rb-${r.categoria_id}`, partNum: r.part_num };
      } else {
        const vieja = buscarPieza(clave);
        // Una pieza antigua que ya estaba enlazada conserva su número de Rebrickable.
        const enlace = f?.part_num ? rbPorNum.get(String(f.part_num)) : undefined;
        if (vieja) p = { clave: vieja.id, forma: vieja.forma, subtipo: vieja.subtipo, partNum: enlace?.part_num ?? null };
      }
      const color = f?.color ? String(f.color) : null;
      const cantidad = Number(f?.cantidad);
      const ubicacion = normalizarUbicacion(String(f?.ubicacion ?? ""));
      if (
        !p ||
        (color && !buscarColor(color)) ||
        !Number.isInteger(cantidad) ||
        cantidad < 0 ||
        cantidad > 9999 ||
        ubicacion === false
      ) {
        return { error: "La copia tiene piezas que no se entienden. No se ha cambiado nada." };
      }
      // Si la misma pieza + color + ubicación sale dos veces, se suman.
      const igual = limpias.find((x) => x.p.clave === p.clave && x.color === color && x.ubicacion === ubicacion);
      if (igual) igual.cantidad = Math.min(9999, igual.cantidad + cantidad);
      else limpias.push({ p, color, cantidad, ubicacion });
    }

    await sql.transaction([
      sql`delete from piezas`,
      sql`
        insert into piezas (forma, subtipo, pieza, color, cantidad, ubicacion, part_num, color_rb)
        select * from unnest(
          ${limpias.map((f) => f.p.forma)}::text[],
          ${limpias.map((f) => f.p.subtipo)}::text[],
          ${limpias.map((f) => f.p.clave)}::text[],
          ${limpias.map((f) => f.color)}::text[],
          ${limpias.map((f) => f.cantidad)}::integer[],
          ${limpias.map((f) => f.ubicacion)}::text[],
          ${limpias.map((f) => f.p.partNum)}::text[],
          ${limpias.map((f) => (f.color ? (COLOR_A_RB[f.color] ?? null) : null))}::integer[]
        )
      `,
    ]);
    revalidatePath("/");
    revalidatePath("/cajas");
    return { cargadas: limpias.length };
  } catch (e) {
    console.error("No se pudo cargar la copia", e);
    return { error: "No se pudo cargar la copia. Revisa la conexión. No se ha cambiado nada." };
  }
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
