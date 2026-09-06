export const dynamic = 'force-dynamic'; 
import { getPieces } from "@/lib/pieces";
import { calculateInventoryStats } from "@/lib/stats";
import { Button } from "@/components/Button";
import { ErrorBanner } from "@/components/ErrorBanner";
import { StatCard } from "@/components/StatCard";
import { PiecesExplorer } from "./_components/PiecesExplorer";

export default async function PiezasPage({
  searchParams,
}: {
  searchParams: Promise<{ deleteError?: string }>;
}) {
  const [pieces, { deleteError }] = await Promise.all([getPieces(), searchParams]);
  const stats = calculateInventoryStats(pieces);

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
        <>
          <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <StatCard title="Piezas totales" value={stats.totalPieces} />
            <StatCard title="Piezas únicas" value={stats.totalUniquePieces} />
            <StatCard title="Disponibles" value={stats.piecesAvailable} />
          </div>
          <PiecesExplorer pieces={pieces} />
        </>
      )}
    </div>
  );
}
