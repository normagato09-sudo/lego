"use client";

import { Button } from "@/components/Button";
import { deletePiece } from "../actions";

type Props = {
  id: string;
  name: string;
  compact?: boolean;
  /** Ruta a la que volver si el borrado falla (para mostrar el error ahí). */
  redirectOnError: string;
};

export function DeletePieceButton({ id, name, compact = false, redirectOnError }: Props) {
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
      <input type="hidden" name="redirect_on_error" value={redirectOnError} />
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
