export const dynamic = 'force-dynamic'; 
import { getColors } from "@/lib/pieces";
import { createPiece } from "../actions";
import { PieceForm } from "../_components/PieceForm";

export default async function NewPiecePage({
  searchParams,
}: {
  searchParams: Promise<{ lego_id?: string }>;
}) {
  // ?lego_id= viene de "Añadir otro color" en la página de un diseño.
  const [colors, { lego_id }] = await Promise.all([getColors(), searchParams]);

  return (
    <div className="mx-auto max-w-lg px-5 py-8">
      <h1 className="mb-1 text-xl font-semibold text-ink">Añadir pieza</h1>
      <p className="mb-6 text-sm text-steel">Rellena los datos de la nueva pieza.</p>
      <PieceForm
        action={createPiece}
        colors={colors}
        defaultValues={lego_id ? { lego_id } : undefined}
        submitLabel="Crear pieza"
      />
    </div>
  );
}
