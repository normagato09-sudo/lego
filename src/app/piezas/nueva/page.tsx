export const dynamic = 'force-dynamic'; 
import { getColors } from "@/lib/pieces";
import { createPiece } from "../actions";
import { PieceForm } from "../_components/PieceForm";

export default async function NewPiecePage({
  searchParams,
}: {
  searchParams: Promise<{ lego_id?: string; part_num?: string }>;
}) {
  // ?lego_id= viene de "Añadir otro color" en la página de un diseño; ?part_num=
  // de "La tengo" en el catálogo (la pieza ya elegida: solo falta color y cantidad).
  const [colors, { lego_id, part_num }] = await Promise.all([getColors(), searchParams]);
  const defaultValues = part_num
    ? { lego_id: part_num, part_num }
    : lego_id
      ? { lego_id }
      : undefined;

  return (
    <div className="mx-auto max-w-lg px-5 py-8">
      <h1 className="mb-1 text-xl font-semibold text-ink">Añadir pieza</h1>
      <p className="mb-6 text-sm text-steel">Rellena los datos de la nueva pieza.</p>
      <PieceForm
        action={createPiece}
        colors={colors}
        defaultValues={defaultValues}
        submitLabel="Crear pieza"
      />
    </div>
  );
}
