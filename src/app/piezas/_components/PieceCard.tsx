import Link from "next/link";
import type { PieceWithDetails } from "@/lib/types";
import { ColorSwatch } from "@/components/ColorSwatch";
import { DeletePieceButton } from "./DeletePieceButton";

const studIcon = (
  <svg viewBox="0 0 40 28" className="h-6 w-9 text-ink-soft/40" aria-hidden="true">
    <rect x="2" y="8" width="36" height="18" rx="2" fill="currentColor" />
    <circle cx="12" cy="8" r="4" fill="currentColor" />
    <circle cx="20" cy="8" r="4" fill="currentColor" />
    <circle cx="28" cy="8" r="4" fill="currentColor" />
  </svg>
);

export function PieceCard({ piece }: { piece: PieceWithDetails }) {
  return (
    <div className="flex flex-col rounded-lg border border-line bg-paper p-3">
      <Link
        href={`/piezas/${piece.id}`}
        className="mb-2 flex h-24 items-center justify-center overflow-hidden rounded-md"
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
          studIcon
        )}
      </Link>

      <div className="flex items-start justify-between gap-2">
        <span className="font-mono text-xs text-steel">{piece.lego_id}</span>
        <span className="rounded-full bg-fog px-2 py-0.5 text-xs font-semibold text-ink">
          {piece.quantity}
        </span>
      </div>

      <Link href={`/piezas/${piece.id}`} className="mt-1 text-sm font-medium leading-snug hover:underline">
        {piece.name}
      </Link>

      <div className="mt-2 flex items-center gap-1.5 text-xs text-steel">
        <ColorSwatch color={piece.color} size={10} />
        <span>{piece.color.name}</span>
        {piece.locationLabel && <span className="truncate">· {piece.locationLabel}</span>}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1 text-xs">
        <Link href={`/piezas/${piece.id}`} className="btn-ghost text-xs">
          Ver detalle
        </Link>
        <Link href={`/piezas/${piece.id}/editar`} className="btn-ghost text-xs">
          Editar
        </Link>
        <DeletePieceButton id={piece.id} name={piece.name} compact />
      </div>
    </div>
  );
}
