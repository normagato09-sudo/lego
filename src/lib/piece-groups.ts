import type { Color, PieceWithDetails } from "@/lib/types";
import { designKey } from "@/lib/piece-display";
import { compareColors } from "@/lib/color-families";

/** Todas las variantes (colores) de un mismo diseño (ver designKey). */
export type PieceGroup = {
  /** Clave del diseño: part_num de Rebrickable o, si no está en el catálogo, el ID escrito. */
  key: string;
  /** IDs de diseño de LEGO escritos en sus piezas, p. ej. ["3023", "28653"]. */
  legoIds: string[];
  variants: PieceWithDetails[];
  totalQuantity: number;
  colors: Color[];
  /** Nombre oficial del catálogo (null si la pieza no está en él). */
  catalogName: string | null;
  /** Variante cuya foto se muestra: la primera con foto propia, si no la primera con foto oficial. */
  cover: PieceWithDetails;
};

/** Agrupa por diseño respetando el orden de llegada; dentro, variantes por familia de color. */
export function groupPiecesByDesign(pieces: PieceWithDetails[]): PieceGroup[] {
  const byKey = new Map<string, PieceWithDetails[]>();
  for (const piece of pieces) {
    const key = designKey(piece);
    const list = byKey.get(key);
    if (list) list.push(piece);
    else byKey.set(key, [piece]);
  }

  return [...byKey].map(([key, list]) => {
    const variants = [...list].sort((a, b) => compareColors(a.color, b.color));
    const colors = [...new Map(variants.map((v) => [v.color.id, v.color])).values()];
    return {
      key,
      legoIds: legoIdsOf(variants),
      variants,
      totalQuantity: variants.reduce((sum, v) => sum + v.quantity, 0),
      colors,
      catalogName: variants[0].catalogName,
      cover:
        variants.find((v) => v.image_url) ??
        variants.find((v) => v.catalogImageUrl) ??
        variants[0],
    };
  });
}

/** IDs de diseño escritos, sin repetir; primero el que coincide con la clave del diseño. */
export function legoIdsOf(pieces: PieceWithDetails[]): string[] {
  const ids = [...new Set(pieces.map((p) => p.lego_id))];
  const key = pieces[0] ? designKey(pieces[0]) : "";
  return ids.sort((a, b) => Number(b === key) - Number(a === key) || a.localeCompare(b));
}
