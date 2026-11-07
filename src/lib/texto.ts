/** Prepara un texto para buscar: minúsculas, sin acentos y "2 × 4" → "2x4". */
export function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/(\d)\s*[x×]\s*(\d)/g, "$1x$2")
    .replace(/\s+/g, " ")
    .trim();
}

/** ¿Contiene el texto todas las palabras buscadas? */
export function coincide(texto: string, busqueda: string): boolean {
  const donde = normalizar(texto);
  return normalizar(busqueda)
    .split(" ")
    .filter(Boolean)
    .every((palabra) => donde.includes(palabra));
}
