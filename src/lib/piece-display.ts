import type { Piece, PieceWithDetails } from "@/lib/types";

/** Nombre visible de una pieza: el suyo, el oficial del catálogo o, si no, el ID de diseño. */
export function pieceTitle(
  piece: Pick<PieceWithDetails, "name" | "catalogName" | "lego_id">,
): string {
  return piece.name || piece.catalogName || piece.lego_id;
}

/**
 * Clave del diseño: la pieza de Rebrickable o, si no está en el catálogo, el
 * ID escrito. Así 28653 y 3023 (la misma pieza) van juntos.
 */
export function designKey(piece: Pick<Piece, "part_num" | "lego_id">): string {
  return piece.part_num ?? piece.lego_id;
}

/** Página que agrupa todas las variantes (colores) de un diseño (ver designKey). */
export function designHref(key: string): string {
  return `/piezas/diseno/${encodeURIComponent(key)}`;
}
