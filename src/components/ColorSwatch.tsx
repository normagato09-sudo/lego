import type { CSSProperties } from "react";
import type { Color } from "@/lib/types";

type Props = {
  color: Color;
  size?: number;
  shape?: "circle" | "square";
};

const CHECKER = "repeating-conic-gradient(var(--color-line) 0% 25%, var(--color-paper) 0% 50%)";

/**
 * Punto o bloque de color. Los colores transparentes se pintan con su tono
 * semitransparente sobre un patrón a cuadros (o solo el patrón si no hay tono).
 */
export function ColorSwatch({ color, size = 16, shape = "circle" }: Props) {
  const checkerSize = `${Math.max(6, size / 3)}px ${Math.max(6, size / 3)}px`;
  const tint = color.hex_code ? `linear-gradient(${color.hex_code}b3, ${color.hex_code}b3)` : null;
  const style: CSSProperties =
    color.hex_code && !color.is_trans
      ? { backgroundColor: color.hex_code, width: size, height: size }
      : {
          width: size,
          height: size,
          backgroundImage: tint ? `${tint}, ${CHECKER}` : CHECKER,
          backgroundSize: tint ? `auto, ${checkerSize}` : checkerSize,
        };

  return (
    <span
      role="img"
      aria-label={`Color ${color.name}`}
      className={`inline-block shrink-0 border border-line-strong ${
        shape === "circle" ? "rounded-full" : "rounded-md"
      }`}
      style={style}
    />
  );
}
