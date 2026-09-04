import Link from "next/link";
import { notFound } from "next/navigation";
import { getPieceById } from "@/lib/pieces";
import { ColorSwatch } from "@/components/ColorSwatch";
import { DeletePieceButton } from "../_components/DeletePieceButton";
import { QuantityStepper } from "../_components/QuantityStepper";

export default async function PieceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const piece = await getPieceById(id);
  if (!piece) notFound();
  return (
    <div className="mx-auto max-w-2xl px-5 py-8">
      <Link href="/piezas" className="text-sm text-steel hover:text-ink">
        ← Volver a piezas
      </Link>
      <div className="mt-4 flex flex-col gap-5 rounded-lg border border-line bg-paper p-6 sm:flex-row">
        <div
          className="flex h-32 w-32 shrink-0 items-center justify-center self-center overflow-hidden rounded-md sm:self-start"
          style={{ backgroundColor: piece.color.hex_code ?? "var(--color-fog)" }}
        >
          {piece.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={piece.image_url}
              alt={piece.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <ColorSwatch color={piece.color} size={56} shape="square" />
          )}
        </div>
        <div className="flex-1">
          <span className="font-mono text-xs text-steel">{piece.lego_id}</span>
          <h1 className="text-xl font-semibold text-ink">{piece.name}</h1>
          {piece.description && <p className="mt-1 text-sm text-steel">{piece.description}</p>}
          <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
            <dt className="text-steel">Color</dt>
            <dd className="flex items-center gap-1.5 text-ink">
              <ColorSwatch color={piece.color} size={12} />
              {piece.color.name}
            </dd>
            <dt className="text-steel">Ubicación</dt>
            <dd className="text-ink">{piece.locationLabel ?? "Sin ubicación"}</dd>
          </dl>
        </div>
      </div>
      <div className="mt-6 rounded-lg border border-line bg-paper p-5">
        <h2 className="mb-3 text-sm font-semibold text-ink">Cantidad disponible</h2>
        <QuantityStepper id={piece.id} quantity={piece.quantity} />
      </div>
      <div className="mt-6 flex gap-2">
        <Link href={`/piezas/${piece.id}/editar`} className="btn">
          Editar
        </Link>
        <DeletePieceButton id={piece.id} name={piece.name} />
      </div>
    </div>
  );
}
