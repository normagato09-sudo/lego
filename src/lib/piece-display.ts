import type { Piece } from "@/lib/types";

/** Nombre visible de una pieza: su nombre o, si no tiene, el ID de diseño. */
export function pieceTitle(piece: Pick<Piece, "name" | "lego_id">): string {
  return piece.name || piece.lego_id;
}
