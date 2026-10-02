import type { PieceWithDetails } from "@/lib/types";
import { PieceIcon } from "@/components/PieceIcon";

type Props = {
  piece: Pick<PieceWithDetails, "image_url" | "catalogImageUrl" | "color">;
  alt: string;
  /** Tamaño del recuadro (p. ej. "h-24" o "h-20 w-20"). */
  className?: string;
};

/**
 * Foto de una pieza: la tuya (recortada a toda la caja, sobre su color) o, si
 * no tienes, la oficial del catálogo (entera, sobre blanco como en Rebrickable).
 */
export function PieceThumb({ piece, alt, className = "" }: Props) {
  const own = piece.image_url;
  const official = !own ? piece.catalogImageUrl : null;
  const src = own ?? official;

  return (
    <div
      className={`flex items-center justify-center overflow-hidden rounded-md ${className}`}
      style={{
        backgroundColor: official ? "#ffffff" : (piece.color.hex_code ?? "var(--color-fog)"),
      }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          loading="lazy"
          className={`h-full w-full ${own ? "object-cover" : "object-contain p-1"}`}
        />
      ) : (
        <PieceIcon />
      )}
    </div>
  );
}
