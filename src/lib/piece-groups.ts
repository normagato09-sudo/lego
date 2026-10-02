import type { Color, PieceWithDetails } from "@/lib/types";

/** Todas las variantes (colores) de un mismo ID de diseño. */
export type PieceGroup = {
  legoId: string;
  variants: PieceWithDetails[];
  totalQuantity: number;
  colors: Color[];
  /** Variante cuya foto se muestra (la primera con foto), o la primera si ninguna tiene. */
  cover: PieceWithDetails;
};

/** Agrupa por lego_id respetando el orden de llegada; dentro, variantes por nombre de color. */
export function groupPiecesByDesign(pieces: PieceWithDetails[]): PieceGroup[] {
  const byLegoId = new Map<string, PieceWithDetails[]>();
  for (const piece of pieces) {
    const list = byLegoId.get(piece.lego_id);
    if (list) list.push(piece);
    else byLegoId.set(piece.lego_id, [piece]);
  }

  return [...byLegoId].map(([legoId, list]) => {
    const variants = [...list].sort((a, b) => a.color.name.localeCompare(b.color.name, "es"));
    const colors = [...new Map(variants.map((v) => [v.color.id, v.color])).values()];
    return {
      legoId,
      variants,
      totalQuantity: variants.reduce((sum, v) => sum + v.quantity, 0),
      colors,
      cover: variants.find((v) => v.image_url) ?? variants[0],
    };
  });
}
