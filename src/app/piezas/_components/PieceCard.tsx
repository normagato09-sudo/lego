import Link from "next/link";
import type { PieceWithDetails } from "@/lib/types";
import { ColorSwatch } from "@/components/ColorSwatch";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { PieceIcon } from "@/components/PieceIcon";
import { DeletePieceButton } from "./DeletePieceButton";

export function PieceCard({ piece }: { piece: PieceWithDetails }) {
  return (
    <Card padding="sm" className="flex flex-col">
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
          <PieceIcon />
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
        <Button href={`/piezas/${piece.id}`} variant="ghost" size="sm">
          Ver detalle
        </Button>
        <Button href={`/piezas/${piece.id}/editar`} variant="ghost" size="sm">
          Editar
        </Button>
        <DeletePieceButton id={piece.id} name={piece.name} compact />
      </div>
    </Card>
  );
}
