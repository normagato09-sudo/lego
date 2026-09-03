import { getColors, getLocations } from "@/lib/pieces";
import { createPiece } from "../actions";
import { PieceForm } from "../_components/PieceForm";

export default async function NewPiecePage() {
  const [colors, locations] = await Promise.all([getColors(), getLocations()]);

  return (
    <div className="mx-auto max-w-lg px-5 py-8">
      <h1 className="mb-1 text-xl font-semibold text-ink">Añadir pieza</h1>
      <p className="mb-6 text-sm text-steel">Rellena los datos de la nueva pieza.</p>
      <PieceForm action={createPiece} colors={colors} locations={locations} submitLabel="Crear pieza" />
    </div>
  );
}
