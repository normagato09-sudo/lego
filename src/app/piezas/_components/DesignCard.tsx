import Link from "next/link";
import type { PieceGroup } from "@/lib/piece-groups";
import { designHref } from "@/lib/piece-display";
import { ColorSwatch } from "@/components/ColorSwatch";
import { Card } from "@/components/Card";
import { PieceIcon } from "@/components/PieceIcon";

/** Tarjeta de un ID de diseño con el total de todos sus colores. */
export function DesignCard({ group }: { group: PieceGroup }) {
  const { legoId, cover, colors, totalQuantity } = group;

  return (
    <Link href={designHref(legoId)} className="block">
      <Card padding="sm" className="flex h-full flex-col hover:border-line-strong">
        <div
          className="mb-2 flex h-24 items-center justify-center overflow-hidden rounded-md"
          style={{ backgroundColor: cover.color.hex_code ?? "var(--color-fog)" }}
        >
          {cover.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cover.image_url} alt={legoId} className="h-full w-full object-cover" />
          ) : (
            <PieceIcon />
          )}
        </div>

        <div className="flex items-start justify-between gap-2">
          <span className="font-mono text-sm font-medium text-ink">{legoId}</span>
          <span className="rounded-full bg-fog px-2 py-0.5 text-xs font-semibold text-ink">
            {totalQuantity}
          </span>
        </div>

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
