"use client";

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
      <button
        type="submit"
        className={compact ? "btn-ghost text-xs text-red-status" : "btn btn-danger"}
      >
        Eliminar
      </button>
    </form>
  );
}
