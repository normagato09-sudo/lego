import type { PieceWithDetails } from "@/lib/types";

/** Nombre visible de una pieza: el suyo, el oficial del catálogo o, si no, el ID de diseño. */
export function pieceTitle(
  piece: Pick<PieceWithDetails, "name" | "catalogName" | "lego_id">,
): string {
  return piece.name || piece.catalogName || piece.lego_id;
}

/** Página que agrupa todas las variantes (colores) de un ID de diseño. */
export function designHref(legoId: string): string {
  return `/piezas/diseno/${encodeURIComponent(legoId)}`;
}
