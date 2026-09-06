/** Traduce errores conocidos de Postgres a mensajes legibles en español. */
export function friendlyDbError(error: { code?: string; message: string }): string {
  if (error.code === "23505") {
    return "Ya existe una pieza con ese ID, color y ubicación. Si quieres sumar unidades, edita esa pieza en vez de crear una nueva.";
  }
  if (error.code === "23503") {
    return "No se puede completar la operación porque la pieza está relacionada con otro dato (por ejemplo, un proyecto).";
  }
  if (error.code === "23514") {
    return "La cantidad no puede ser negativa.";
  }
  return `No se pudo guardar la pieza: ${error.message}`;
}
