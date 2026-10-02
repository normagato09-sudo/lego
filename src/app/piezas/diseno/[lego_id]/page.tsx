export const dynamic = 'force-dynamic';

import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { findDesignKeyForLegoId, getPiecesByDesign } from "@/lib/pieces";
import { legoIdsOf } from "@/lib/piece-groups";
import { designHref } from "@/lib/piece-display";
import { ColorSwatch } from "@/components/ColorSwatch";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { ErrorBanner } from "@/components/ErrorBanner";
import { PieceThumb } from "@/components/PieceThumb";
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
  // El segmento es la clave del diseño (part_num de Rebrickable o el ID escrito).
  const key = decodeParam((await params).lego_id);
  const { deleteError } = await searchParams;
  const variants = await getPiecesByDesign(key);
  if (variants.length === 0) {
    // Enlace antiguo con el ID escrito (p. ej. 28653) de una pieza que ya tiene part_num (3023).
    const designKey = await findDesignKeyForLegoId(key);
    if (designKey && designKey !== key) redirect(designHref(designKey));
    notFound();
  }

  const legoIds = legoIdsOf(variants);
  const total = variants.reduce((sum, v) => sum + v.quantity, 0);
  const catalogName = variants[0].catalogName;
  const partNum = variants[0].part_num;
  const href = designHref(key);

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
          <h1 className="font-mono text-xl font-semibold break-words text-ink">
            {legoIds.join(" · ")}
          </h1>
          {catalogName && (
            <p className="text-sm text-ink-soft">
              {catalogName}
              {partNum && !legoIds.includes(partNum) && (
                <span className="text-steel"> · Rebrickable {partNum}</span>
              )}
            </p>
          )}
          <p className="text-sm text-steel">
            {variants.length} {variants.length === 1 ? "color" : "colores"} · {total}{" "}
            {total === 1 ? "pieza" : "piezas"} en total
          </p>
        </div>
        <Button href={`/piezas/nueva?lego_id=${encodeURIComponent(legoIds[0])}`} variant="primary">
          + Añadir otro color
        </Button>
      </div>

      <div className="flex flex-col gap-3">
        {variants.map((piece) => (
          <Card key={piece.id} padding="md" className="flex flex-col gap-4 sm:flex-row">
            <PieceThumb
              piece={piece}
              alt={`${piece.lego_id} en ${piece.color.name}`}
              className="h-20 w-20 shrink-0"
            />
            <div className="flex flex-1 flex-col gap-3">
              <div>
                <p className="flex items-center gap-1.5 text-sm font-medium text-ink">
                  <ColorSwatch color={piece.color} size={12} />
                  {piece.color.name}
                </p>
                <p className="mt-0.5 text-xs text-steel">
                  {legoIds.length > 1 && (
                    <>
                      ID de diseño: <span className="font-mono text-ink">{piece.lego_id}</span>
                      {" · "}
                    </>
                  )}
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
                  name={`${piece.lego_id} en ${piece.color.name}`}
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
