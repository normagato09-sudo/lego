export const dynamic = 'force-dynamic';

import { notFound, redirect } from "next/navigation";
import { getPieceById } from "@/lib/pieces";
import { designHref } from "@/lib/piece-display";

/** El detalle vive en la página del diseño; esta ruta se mantiene para enlaces antiguos. */
export default async function PieceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const piece = await getPieceById(id);
  if (!piece) notFound();
  redirect(designHref(piece.lego_id));
}
