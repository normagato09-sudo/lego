import Link from "next/link";
import { getPieces } from "@/lib/pieces";
import { PieceCard } from "./_components/PieceCard";

export default async function PiezasPage() {
  const pieces = await getPieces();

  return (
    <div className="mx-auto max-w-5xl px-5 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-ink">Piezas</h1>
          <p className="text-sm text-steel">
            {pieces.length} {pieces.length === 1 ? "pieza" : "piezas"} en tu inventario
          </p>
        </div>
        <Link href="/piezas/nueva" className="btn btn-primary">
          + Añadir pieza
        </Link>
      </div>

      {pieces.length === 0 ? (
        <div className="rounded-lg border border-dashed border-line-strong px-6 py-14 text-center">
          <p className="mb-4 text-sm text-steel">Todavía no tienes piezas en tu inventario.</p>
          <Link href="/piezas/nueva" className="btn btn-primary">
            Añadir la primera pieza
          </Link>
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
