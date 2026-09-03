import { notFound } from "next/navigation";
import { getPieceById, getColors, getLocations } from "@/lib/pieces";
import { updatePiece } from "../../actions";
import { PieceForm } from "../../_components/PieceForm";

export default async function EditPiecePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [piece, colors, locations] = await Promise.all([
    getPieceById(id),
    getColors(),
    getLocations(),
  ]);
  if (!piece) notFound();

  const action = updatePiece.bind(null, id);

  return (
    <div className="mx-auto max-w-lg px-5 py-8">
      <h1 className="mb-1 text-xl font-semibold text-ink">Editar pieza</h1>
      <p className="mb-6 text-sm text-steel">
        {piece.lego_id} · {piece.name}
      </p>
      <PieceForm
        action={action}
        colors={colors}
        locations={locations}
        defaultValues={{
          lego_id: piece.lego_id,
          name: piece.name,
          description: piece.description,
          color_id: piece.color_id,
          location_id: piece.location_id,
          quantity: piece.quantity,
        }}
        submitLabel="Guardar cambios"
      />
    </div>
  );
}
