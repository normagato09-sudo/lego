import Link from "next/link";
import type { ComponentPropsWithoutRef } from "react";

export type ButtonVariant = "default" | "primary" | "ghost" | "danger";
export type ButtonSize = "md" | "sm" | "icon";

const variantClass: Record<ButtonVariant, string> = {
  default: "btn",
  primary: "btn btn-primary",
  ghost: "btn-ghost",
  danger: "btn btn-danger",
};

const sizeClass: Record<ButtonSize, string> = {
  md: "",
  sm: "text-xs",
  icon: "h-9 w-9 p-0 text-base",
};

type BaseProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
};

type ButtonAsButton = BaseProps &
  Omit<ComponentPropsWithoutRef<"button">, keyof BaseProps> & {
    href?: undefined;
  };

type ButtonAsLink = BaseProps &
  Omit<ComponentPropsWithoutRef<typeof Link>, keyof BaseProps> & {
    href: string;
  };

export type ButtonProps = ButtonAsButton | ButtonAsLink;

/**
 * Botón reutilizable que centraliza los estilos ya definidos en globals.css
 * (.btn, .btn-primary, .btn-ghost, .btn-danger). Funciona como <button> normal
 * o, si recibe `href`, se renderiza como <Link> con el mismo aspecto visual.
 * No introduce estilos nuevos: solo evita repetir las mismas className por la app.
 */
export function Button({
  variant = "default",
  size = "md",
  className = "",
  children,
  ...rest
}: ButtonProps) {
  const classes = [variantClass[variant], sizeClass[size], className]
    .filter(Boolean)
    .join(" ")
    .trim();

  if (rest.href !== undefined) {
    const { href, ...linkRest } = rest as Omit<ButtonAsLink, keyof BaseProps>;
    return (
      <Link href={href} className={classes} {...linkRest}>
        {children}
      </Link>
    );
  }

  const buttonRest = rest as Omit<ButtonAsButton, keyof BaseProps>;
  return (
    <button className={classes} {...buttonRest}>
      {children}
    </button>
  );
}
