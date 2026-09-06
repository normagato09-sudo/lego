import type { ReactNode } from "react";
import { Card } from "@/components/Card";

type Props = {
  title: string;
  value: string | number;
  icon?: ReactNode;
  description?: string;
  trend?: "up" | "down" | "neutral";
};

const trendClass: Record<NonNullable<Props["trend"]>, string> = {
  up: "text-green",
  down: "text-red-status",
  neutral: "text-steel",
};

/**
 * Tarjeta de estadística reutilizable, para la futura pantalla de
 * estadísticas (colección / inventario / proyectos). Todavía no se usa
 * en ninguna página: se deja preparada, sobre el componente Card ya
 * existente, para no tener que crear un patrón visual nuevo cuando se
 * implementen las estadísticas reales.
 */
export function StatCard({ title, value, icon, description, trend }: Props) {
  return (
    <Card padding="md" className="flex flex-col gap-1">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm text-steel">{title}</span>
        {icon && <span className="text-ink-soft/60">{icon}</span>}
      </div>
      <span className="text-2xl font-semibold text-ink">{value}</span>
      {description && (
        <span className={`text-xs ${trend ? trendClass[trend] : "text-steel"}`}>{description}</span>
      )}
    </Card>
  );
}
