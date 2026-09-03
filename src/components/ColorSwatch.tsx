import type { CSSProperties } from "react";
import type { Color } from "@/lib/types";

type Props = {
  color: Color;
  size?: number;
  shape?: "circle" | "square";
};

/** Punto o bloque de color. Si la pieza es transparente (sin hex_code), usa un patrón a cuadros. */
export function ColorSwatch({ color, size = 16, shape = "circle" }: Props) {
  const style: CSSProperties = color.hex_code
    ? { backgroundColor: color.hex_code, width: size, height: size }
    : {
        width: size,
        height: size,
        backgroundImage:
          "repeating-conic-gradient(var(--color-line) 0% 25%, var(--color-paper) 0% 50%)",
        backgroundSize: `${Math.max(6, size / 3)}px ${Math.max(6, size / 3)}px`,
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
