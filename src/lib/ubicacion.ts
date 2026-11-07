/**
 * Limpia un código de ubicación: quita espacios y lo pasa a mayúsculas.
 * Devuelve null si está vacío (= "Sin ordenar") y false si no es válido.
 */
export function normalizarUbicacion(texto: string): string | null | false {
  const limpio = texto.replace(/\s+/g, "").toUpperCase();
  if (limpio === "") return null;
  if (limpio.length > 20 || !/^[A-Z0-9]+(-[A-Z0-9]+)*$/.test(limpio)) return false;
  return limpio;
}

/** Ordena códigos como C1-B2, C1-B10, C2-B1 (los números en orden natural). */
export function ordenarUbicaciones(lista: string[]): string[] {
  return [...lista].sort((a, b) => a.localeCompare(b, "es", { numeric: true }));
}
