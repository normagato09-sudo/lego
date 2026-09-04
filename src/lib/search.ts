import type { PieceWithDetails, Set, Project } from "@/lib/types";

/**
 * Capa de búsqueda. Preparación de arquitectura: estas funciones no están
 * conectadas todavía a ninguna página ni componente de UI (no hay un
 * SearchBar en la app). Cuando se implemente la búsqueda real, la UI solo
 * tiene que llamar a estas funciones (o a las que las sustituyan al migrar
 * de datos mock/reales a más datos reales) en vez de reimplementar el
 * filtrado en cada página.
 */

export type SearchResultKind = "piece" | "set" | "project";

/** Resultado normalizado, igual para cualquier tipo de entidad. */
export type SearchResult = {
  kind: SearchResultKind;
  id: string;
  title: string;
  subtitle: string | null;
  href: string;
};

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/**
 * Búsqueda de piezas por nombre, referencia (lego_id), color o ubicación.
 * Ya funciona sobre datos reales de Supabase (PieceWithDetails), porque
 * es la única entidad que existe hoy en la app.
 *
 * Nota: "Estado" no está preparado como campo de búsqueda porque Piece
 * todavía no tiene una columna de estado en la base de datos.
 */
export function searchPieces(pieces: PieceWithDetails[], query: string): PieceWithDetails[] {
  const q = normalize(query.trim());
  if (!q) return pieces;

  return pieces.filter((piece) => {
    const haystack = [
      piece.name,
      piece.lego_id,
      piece.color?.name,
      piece.locationLabel,
    ]
      .filter(Boolean)
      .map((value) => normalize(String(value)));

    return haystack.some((value) => value.includes(q));
  });
}

/**
 * Búsqueda de sets, preparada para cuando existan datos reales.
 * Set (en lib/types.ts) todavía no tiene tabla ni datos; esta función
 * queda lista para recibir Set[] en cuanto exista esa fuente de datos,
 * buscando por nombre, número de set. "Tema/categoría" y "Estado" no
 * están todavía en el tipo Set, así que no se pueden buscar hasta que
 * se añadan esos campos.
 */
export function searchSets(sets: Set[], query: string): Set[] {
  const q = normalize(query.trim());
  if (!q) return sets;

  return sets.filter((set) => {
    const haystack = [set.name, set.set_number].filter(Boolean).map((v) => normalize(String(v)));
    return haystack.some((value) => value.includes(q));
  });
}

/**
 * Búsqueda de proyectos, preparada para cuando existan datos reales.
 * Project ya tiene "status" en el tipo, así que se puede buscar por
 * nombre y estado en cuanto haya datos. "Categoría" no está todavía
 * en el tipo Project.
 */
export function searchProjects(projects: Project[], query: string): Project[] {
  const q = normalize(query.trim());
  if (!q) return projects;

  return projects.filter((project) => {
    const haystack = [project.name, project.status].filter(Boolean).map((v) => normalize(String(v)));
    return haystack.some((value) => value.includes(q));
  });
}

/**
 * Punto de entrada único para una futura búsqueda global (🧩 Piezas,
 * 📦 Sets, 🏗️ Proyectos combinados). Hoy solo tiene piezas reales;
 * sets y proyectos son opcionales y por defecto vacíos, para que se
 * pueda empezar a usar esta función ya mismo con solo piezas y, más
 * adelante, pasarle sets/proyectos reales sin cambiar su firma ni la
 * forma en que la consume la UI.
 */
export function searchAll(
  query: string,
  data: { pieces: PieceWithDetails[]; sets?: Set[]; projects?: Project[] },
): SearchResult[] {
  const { pieces, sets = [], projects = [] } = data;

  const pieceResults: SearchResult[] = searchPieces(pieces, query).map((piece) => ({
    kind: "piece",
    id: piece.id,
    title: piece.name,
    subtitle: piece.lego_id,
    href: `/piezas/${piece.id}`,
  }));

  const setResults: SearchResult[] = searchSets(sets, query).map((set) => ({
    kind: "set",
    id: set.id,
    title: set.name,
    subtitle: set.set_number,
    href: `/sets/${set.id}`,
  }));

  const projectResults: SearchResult[] = searchProjects(projects, query).map((project) => ({
    kind: "project",
    id: project.id,
    title: project.name,
    subtitle: project.status,
    href: `/proyectos/${project.id}`,
  }));

  return [...pieceResults, ...setResults, ...projectResults];
}
