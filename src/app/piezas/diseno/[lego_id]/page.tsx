export const dynamic = 'force-dynamic';

import Link from "next/link";
import { notFound } from "next/navigation";
import { getPiecesByLegoId } from "@/lib/pieces";
import { designHref } from "@/lib/piece-display";
import { ColorSwatch } from "@/components/ColorSwatch";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { ErrorBanner } from "@/components/ErrorBanner";
import { PieceIcon } from "@/components/PieceIcon";
import { DeletePieceButton } from "../../_components/DeletePieceButton";
import { QuantityStepper } from "../../_components/QuantityStepper";

/** Next puede entregar el segmento ya decodificado o no; se decodifica solo si hace falta. */
function decodeParam(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export default async function DesignPage({
  params,
  searchParams,
}: {
  params: Promise<{ lego_id: string }>;
  searchParams: Promise<{ deleteError?: string }>;
}) {
  const legoId = decodeParam((await params).lego_id);
  const { deleteError } = await searchParams;
  const variants = await getPiecesByLegoId(legoId);
  if (variants.length === 0) notFound();

  const total = variants.reduce((sum, v) => sum + v.quantity, 0);
  const href = designHref(legoId);

  return (
    <div className="mx-auto max-w-2xl px-5 py-8">
      <Link href="/piezas" className="text-sm text-steel hover:text-ink">
        ← Volver a piezas
      </Link>
      {deleteError && (
        <div className="mt-4">
          <ErrorBanner message={deleteError} />
        </div>
      )}

      <div className="mt-4 mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="text-xs text-steel">ID de diseño</span>
          <h1 className="font-mono text-xl font-semibold text-ink">{legoId}</h1>
          <p className="text-sm text-steel">
            {variants.length} {variants.length === 1 ? "color" : "colores"} · {total}{" "}
            {total === 1 ? "pieza" : "piezas"} en total
          </p>
        </div>
        <Button href={`/piezas/nueva?lego_id=${encodeURIComponent(legoId)}`} variant="primary">
          + Añadir otro color
        </Button>
      </div>

      <div className="flex flex-col gap-3">
        {variants.map((piece) => (
          <Card key={piece.id} padding="md" className="flex flex-col gap-4 sm:flex-row">
            <div
              className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-md"
              style={{ backgroundColor: piece.color.hex_code ?? "var(--color-fog)" }}
            >
              {piece.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={piece.image_url}
                  alt={`${legoId} en ${piece.color.name}`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <PieceIcon />
              )}
            </div>
            <div className="flex flex-1 flex-col gap-3">
              <div>
                <p className="flex items-center gap-1.5 text-sm font-medium text-ink">
                  <ColorSwatch color={piece.color} size={12} />
                  {piece.color.name}
                </p>
                <p className="mt-0.5 text-xs text-steel">
                  ID de pieza:{" "}
                  <span className="font-mono text-ink">{piece.element_id ?? "—"}</span>
                </p>
              </div>
              <QuantityStepper id={piece.id} quantity={piece.quantity} />
              <div className="flex flex-wrap items-center gap-1">
                <Button href={`/piezas/${piece.id}/editar`} variant="ghost" size="sm">
                  Editar
                </Button>
                <DeletePieceButton
                  id={piece.id}
                  name={`${legoId} en ${piece.color.name}`}
                  compact
                  redirectOnError={href}
                />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
