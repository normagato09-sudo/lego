import type { CatalogListPart } from "@/lib/catalog-browse";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { PieceIcon } from "@/components/PieceIcon";

/** Tarjeta de una pieza del catálogo, con el mismo aspecto que las de /piezas. */
export function CatalogCard({
  part,
  categoryName,
}: {
  part: CatalogListPart;
  categoryName?: string;
}) {
  return (
    // content-visibility: el móvil no dibuja las tarjetas que están fuera de pantalla.
    <Card
      padding="sm"
      className="flex h-full flex-col [contain-intrinsic-size:auto_220px] [content-visibility:auto]"
    >
      <div className="mb-2 flex h-24 items-center justify-center overflow-hidden rounded-md bg-white">
        {part.img_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={part.img_url}
            alt={part.name}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-contain p-1"
          />
        ) : (
          <PieceIcon />
        )}
      </div>
      <span className="min-w-0 break-words font-mono text-sm font-medium text-ink">
        {part.part_num}
      </span>
      <p className="mt-0.5 line-clamp-2 text-xs text-ink-soft">{part.name}</p>
      {categoryName && <p className="mt-1 text-xs text-steel">{categoryName}</p>}
      <div className="mt-auto pt-2">
        <Button
          href={`/piezas/nueva?part_num=${encodeURIComponent(part.part_num)}`}
          size="sm"
          className="w-full"
        >
          La tengo
        </Button>
      </div>
    </Card>
  );
}
