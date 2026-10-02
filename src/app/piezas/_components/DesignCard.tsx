import Link from "next/link";
import type { PieceGroup } from "@/lib/piece-groups";
import { designHref } from "@/lib/piece-display";
import { ColorSwatch } from "@/components/ColorSwatch";
import { Card } from "@/components/Card";
import { PieceThumb } from "@/components/PieceThumb";

/** Tarjeta de un ID de diseño con el total de todos sus colores. */
export function DesignCard({ group }: { group: PieceGroup }) {
  const { key, legoIds, catalogName, cover, colors, totalQuantity } = group;

  return (
    <Link href={designHref(key)} className="block">
      <Card padding="sm" className="flex h-full flex-col hover:border-line-strong">
        <PieceThumb piece={cover} alt={catalogName ?? legoIds[0]} className="mb-2 h-24" />

        <div className="flex items-start justify-between gap-2">
          <span className="min-w-0 break-words font-mono text-sm font-medium text-ink">
            {legoIds.join(" · ")}
          </span>
          <span className="rounded-full bg-fog px-2 py-0.5 text-xs font-semibold text-ink">
            {totalQuantity}
          </span>
        </div>
        {catalogName && <p className="mt-0.5 line-clamp-2 text-xs text-ink-soft">{catalogName}</p>}

        <p className="mt-1 text-xs text-steel">
          {colors.length} {colors.length === 1 ? "color" : "colores"}
        </p>

        <div className="mt-2 flex flex-wrap gap-1">
          {colors.map((color) => (
            <ColorSwatch key={color.id} color={color} size={12} />
          ))}
        </div>
      </Card>
    </Link>
  );
}
