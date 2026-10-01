export const dynamic = 'force-dynamic';

import { notFound } from "next/navigation";
import { getPieceById, getColors } from "@/lib/pieces";
import { updatePiece } from "../../actions";
import { PieceForm } from "../../_components/PieceForm";

export default async function EditPiecePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [piece, colors] = await Promise.all([getPieceById(id), getColors()]);
  if (!piece) notFound();
  const action = updatePiece.bind(null, id);
  return (
    <div className="mx-auto max-w-lg px-5 py-8">
      <h1 className="mb-1 text-xl font-semibold text-ink">Editar pieza</h1>
      <p className="mb-6 text-sm text-steel">
        {piece.lego_id}
        {piece.name && ` · ${piece.name}`}
      </p>
      <PieceForm
        action={action}
        colors={colors}
        defaultValues={{
          lego_id: piece.lego_id,
          element_id: piece.element_id,
          color_id: piece.color_id,
          quantity: piece.quantity,
          image_url: piece.image_url,
        }}
        submitLabel="Guardar cambios"
      />
    </div>
  );
}
