"use client";

import { Button } from "@/components/Button";
import { deletePiece } from "../actions";

type Props = {
  id: string;
  name: string;
  compact?: boolean;
};

export function DeletePieceButton({ id, name, compact = false }: Props) {
  return (
    <form
      action={deletePiece}
      onSubmit={(event) => {
        const confirmed = window.confirm(
          `¿Eliminar "${name}" del inventario? Esta acción no se puede deshacer.`,
        );
        if (!confirmed) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      {compact ? (
        <Button type="submit" variant="ghost" size="sm" className="text-red-status">
          Eliminar
        </Button>
      ) : (
        <Button type="submit" variant="danger">
          Eliminar
        </Button>
      )}
    </form>
  );
}
