export const dynamic = "force-dynamic";

import Link from "next/link";
import { getPieces } from "@/lib/pieces";
import { calculateInventoryStats } from "@/lib/stats";
import { designHref, designKey, pieceTitle } from "@/lib/piece-display";
import { Button } from "@/components/Button";
import { ColorSwatch } from "@/components/ColorSwatch";
import { PieceThumb } from "@/components/PieceThumb";
import { StatCard } from "@/components/StatCard";

/** Cuántas piezas recientes se muestran. */
const RECENT_COUNT = 8;

export default async function Home() {
  const pieces = await getPieces(); // ya vienen de la más nueva a la más antigua
  const stats = calculateInventoryStats(pieces);
  const recent = pieces.slice(0, RECENT_COUNT);

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-8 px-5 py-8">
      <Button
        href="/piezas/nueva"
        variant="primary"
        className="min-h-16 w-full justify-center text-lg font-semibold"
      >
        + Añadir pieza
      </Button>

      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <StatCard title="Piezas totales" value={stats.totalPieces} />
        <StatCard title="Diseños distintos" value={stats.totalUniquePieces} />
        <StatCard title="Colores distintos" value={stats.totalColors} />
      </div>

      <section className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-semibold text-ink">Últimas añadidas</h2>
          {pieces.length > 0 && (
            <Link href="/piezas" className="text-sm text-steel hover:text-ink">
              Ver todas →
            </Link>
          )}
        </div>

        {recent.length === 0 ? (
          <p className="rounded-lg border border-dashed border-line-strong px-6 py-10 text-center text-sm text-steel">
            Todavía no tienes piezas. Empieza con «Añadir pieza».
          </p>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {recent.map((piece) => (
              <li key={piece.id}>
                <Link
                  href={designHref(designKey(piece))}
                  className="flex h-full flex-col gap-1.5 rounded-lg border border-line bg-paper p-2 hover:border-line-strong"
                >
                  <PieceThumb
                    piece={piece}
                    alt={`${pieceTitle(piece)} en ${piece.color.name}`}
                    className="h-24"
                  />
                  <span className="flex items-center justify-between gap-2">
                    <span className="font-mono text-sm font-medium text-ink">{piece.lego_id}</span>
                    <span className="rounded-full bg-fog px-2 py-0.5 text-xs font-semibold text-ink">
                      {piece.quantity}
                    </span>
                  </span>
                  {piece.catalogName && (
                    <span className="line-clamp-2 text-xs text-ink-soft">{piece.catalogName}</span>
                  )}
                  <span className="mt-auto flex items-center gap-1.5 text-xs text-steel">
                    <ColorSwatch color={piece.color} size={12} />
                    <span className="truncate">{piece.color.name}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
