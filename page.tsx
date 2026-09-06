export const dynamic = 'force-dynamic'; 
import { getPieces } from "@/lib/pieces";
import { Button } from "@/components/Button";
import { ErrorBanner } from "@/components/ErrorBanner";
import { PieceCard } from "./_components/PieceCard";

export default async function PiezasPage({
  searchParams,
}: {
  searchParams: Promise<{ deleteError?: string }>;
}) {
  const [pieces, { deleteError }] = await Promise.all([getPieces(), searchParams]);

  return (
    <div className="mx-auto max-w-5xl px-5 py-8">
      {deleteError && (
        <div className="mb-4">
          <ErrorBanner message={deleteError} />
        </div>
      )}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-ink">Piezas</h1>
          <p className="text-sm text-steel">
            {pieces.length} {pieces.length === 1 ? "pieza" : "piezas"} en tu inventario
          </p>
        </div>
        <Button href="/piezas/nueva" variant="primary">
          + Añadir pieza
        </Button>
      </div>

      {pieces.length === 0 ? (
        <div className="rounded-lg border border-dashed border-line-strong px-6 py-14 text-center">
          <p className="mb-4 text-sm text-steel">Todavía no tienes piezas en tu inventario.</p>
          <Button href="/piezas/nueva" variant="primary">
            Añadir la primera pieza
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {pieces.map((piece) => (
            <PieceCard key={piece.id} piece={piece} />
          ))}
        </div>
      )}
    </div>
  );
}
