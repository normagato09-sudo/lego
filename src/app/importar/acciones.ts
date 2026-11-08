"use server";

import { getSql } from "@/lib/db";
import { pedirRebrickable, type ColorApi, type PaginaApi, type PiezaApi } from "@/lib/rebrickable/api";
import { sacarMedida, textoBusqueda } from "@/lib/rebrickable/busqueda";
import { CATEGORIAS_CON_IMPRESAS, CATEGORIAS_RB } from "@/lib/rebrickable/categorias";
import { COLORES_RB } from "@/lib/rebrickable/colores";
import { exigirSesion } from "@/lib/sesion";

export type Estado = {
  categorias: number;
  colores: number;
  /** Piezas guardadas por número de categoría. */
  piezasPorCategoria: Record<number, number>;
};

const mensaje = (e: unknown) => (e instanceof Error ? e.message : String(e));

/** Cuántas cosas hay ya importadas. */
export async function leerEstado(): Promise<Estado> {
  await exigirSesion();
  const sql = getSql();
  const [cat, col, pie] = await Promise.all([
    sql`select count(*)::integer as n from rb_categorias`,
    sql`select count(*)::integer as n from rb_colores`,
    sql`select categoria_id, count(*)::integer as n from rb_piezas group by categoria_id`,
  ]);
  const piezasPorCategoria: Record<number, number> = {};
  for (const f of pie as { categoria_id: number; n: number }[]) piezasPorCategoria[f.categoria_id] = f.n;
  return {
    categorias: (cat as { n: number }[])[0].n,
    colores: (col as { n: number }[])[0].n,
    piezasPorCategoria,
  };
}

/** Paso A: guarda las categorías (con su nombre en español) y los colores de Rebrickable. */
export async function importarCategoriasYColores(): Promise<{ error?: string; categorias?: number; colores?: number }> {
  await exigirSesion();
  try {
    const sql = getSql();
    await sql`
      insert into rb_categorias (id, nombre_en, nombre, forma, orden)
      select * from unnest(
        ${CATEGORIAS_RB.map((c) => c.id)}::integer[],
        ${CATEGORIAS_RB.map((c) => c.nombre_en)}::text[],
        ${CATEGORIAS_RB.map((c) => c.nombre)}::text[],
        ${CATEGORIAS_RB.map((c) => c.forma)}::text[],
        ${CATEGORIAS_RB.map((c) => c.orden)}::integer[]
      )
      on conflict (id) do update set
        nombre_en = excluded.nombre_en, nombre = excluded.nombre,
        forma = excluded.forma, orden = excluded.orden
    `;

    const pagina = await pedirRebrickable<PaginaApi<ColorApi>>("/colors/?page_size=1000");
    const colores = pagina.results.filter((c) => c.id >= 0 && c.id !== 9999);
    const traducidos = new Map(COLORES_RB.map((c, i) => [c.id, { ...c, orden: i + 1 }]));
    const filas = colores.map((c) => {
      const es = traducidos.get(c.id);
      return {
        id: c.id,
        nombre_en: c.name,
        nombre: es?.nombre ?? c.name,
        hex: `#${c.rgb.toUpperCase()}`,
        transparente: c.is_trans,
        actual: !!es,
        familia: es?.familia ?? null,
        orden: es?.orden ?? null,
      };
    });
    await sql`
      insert into rb_colores (id, nombre_en, nombre, hex, transparente, actual, familia, orden)
      select * from unnest(
        ${filas.map((f) => f.id)}::integer[],
        ${filas.map((f) => f.nombre_en)}::text[],
        ${filas.map((f) => f.nombre)}::text[],
        ${filas.map((f) => f.hex)}::text[],
        ${filas.map((f) => f.transparente)}::boolean[],
        ${filas.map((f) => f.actual)}::boolean[],
        ${filas.map((f) => f.familia)}::text[],
        ${filas.map((f) => f.orden)}::integer[]
      )
      on conflict (id) do update set
        nombre_en = excluded.nombre_en, nombre = excluded.nombre, hex = excluded.hex,
        transparente = excluded.transparente, actual = excluded.actual,
        familia = excluded.familia, orden = excluded.orden
    `;
    return { categorias: CATEGORIAS_RB.length, colores: filas.length };
  } catch (e) {
    console.error("No se pudieron importar categorías y colores", e);
    return { error: `No se pudo importar: ${mensaje(e)}` };
  }
}

/** ¿Es una versión impresa o decorada? */
function esImpresa(p: PiezaApi): boolean {
  return (
    !!p.print_of ||
    /\b(print|printed|pattern|sticker|decorated)\b/i.test(p.name) ||
    /(pr|pat)\d/i.test(p.part_num)
  );
}

/**
 * Paso B: guarda una página (hasta 1000 piezas) de una categoría.
 * Devuelve el número de la página siguiente, o null si ya no hay más.
 */
export async function importarPaginaPiezas(
  categoriaId: number,
  pagina: number,
): Promise<{ error?: string; guardadas?: number; saltadas?: number; siguiente?: number | null }> {
  await exigirSesion();
  const categoria = CATEGORIAS_RB.find((c) => c.id === categoriaId);
  if (!categoria || !Number.isInteger(pagina) || pagina < 1) return { error: "Categoría o página no válida." };

  try {
    const datos = await pedirRebrickable<PaginaApi<PiezaApi>>(
      `/parts/?part_cat_id=${categoriaId}&page_size=1000&page=${pagina}`,
    );
    const conImpresas = CATEGORIAS_CON_IMPRESAS.has(categoriaId);
    const buenas = datos.results.filter((p) => conImpresas || !esImpresa(p));

    if (buenas.length > 0) {
      const sql = getSql();
      await sql`
        insert into rb_piezas (part_num, nombre_en, categoria_id, foto, medida, busqueda)
        select * from unnest(
          ${buenas.map((p) => p.part_num)}::text[],
          ${buenas.map((p) => p.name)}::text[],
          ${buenas.map(() => categoriaId)}::integer[],
          ${buenas.map((p) => p.part_img_url)}::text[],
          ${buenas.map((p) => sacarMedida(p.name))}::text[],
          ${buenas.map((p) => textoBusqueda(p.part_num, p.name, categoria.nombre))}::text[]
        )
        on conflict (part_num) do update set
          nombre_en = excluded.nombre_en, categoria_id = excluded.categoria_id,
          foto = excluded.foto, medida = excluded.medida, busqueda = excluded.busqueda
      `;
    }
    return {
      guardadas: buenas.length,
      saltadas: datos.results.length - buenas.length,
      siguiente: datos.next ? pagina + 1 : null,
    };
  } catch (e) {
    console.error("No se pudo importar la página", categoriaId, pagina, e);
    return { error: mensaje(e) };
  }
}
