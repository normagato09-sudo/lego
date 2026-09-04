import type { ComponentPropsWithoutRef } from "react";

type CardPadding = "sm" | "md" | "lg";

const paddingClass: Record<CardPadding, string> = {
  sm: "p-3",
  md: "p-5",
  lg: "p-6",
};

type Props = {
  padding?: CardPadding;
  className?: string;
} & ComponentPropsWithoutRef<"div">;

/**
 * Contenedor con borde/fondo reutilizable (mismo aspecto que ya se repetía
 * en varias páginas: rounded-lg border border-line bg-paper).
 */
export function Card({ padding = "md", className = "", children, ...rest }: Props) {
  const classes = ["rounded-lg border border-line bg-paper", paddingClass[padding], className]
    .filter(Boolean)
    .join(" ")
    .trim();

  return (
    <div className={classes} {...rest}>
      {children}
    </div>
  );
}
