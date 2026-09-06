import type { PieceWithDetails, Project, ProjectPiece, Set } from "@/lib/types";

/**
 * Capa de estadísticas. Preparación de arquitectura: separa el cálculo
 * (aquí) de la interfaz (páginas/componentes). Hoy nada llama todavía a
 * estas funciones desde ninguna página; están listas para cuando se
 * construya la pantalla de estadísticas.
 *
 * calculateInventoryStats ya funciona con datos reales de Supabase
 * (PieceWithDetails), porque es la única entidad que existe hoy en la app.
 * calculateCollectionStats y calculateProjectStats reciben Sets y
 * Proyectos como parámetros opcionales (por defecto array vacío) para que
 * ya se puedan usar ahora mismo y, cuando existan tablas y datos reales de
 * sets/proyectos, baste con pasarles esos arrays sin tocar su firma ni los
 * componentes que las consuman.
 */

export type InventoryStats = {
  totalPieces: number;
  totalUniquePieces: number;
  piecesAvailable: number;
  piecesUsedInProjects: number | null;
  piecesMissing: number | null;
  piecesSurplus: number | null;
};

/**
 * Estadísticas de inventario a partir de las piezas reales.
 * "Piezas utilizadas en proyectos", "faltantes" y "sobrantes" necesitan
 * datos de ProjectPiece (proyectos), que todavía no existen; se dejan en
 * null en vez de inventar un número, para no mostrar datos falsos cuando
 * se conecten a la UI.
 */
export function calculateInventoryStats(
  pieces: PieceWithDetails[],
  projectPieces: ProjectPiece[] = [],
): InventoryStats {
  const totalPieces = pieces.reduce((sum, piece) => sum + piece.quantity, 0);
  const totalUniquePieces = pieces.length;
  const piecesAvailable = pieces.reduce(
    (sum, piece) => sum + Math.max(0, piece.quantity),
    0,
  );

  const hasProjectData = projectPieces.length > 0;
  const piecesUsedInProjects = hasProjectData
    ? projectPieces.reduce((sum, item) => sum + item.quantity, 0)
    : null;

  return {
    totalPieces,
    totalUniquePieces,
    piecesAvailable,
    piecesUsedInProjects,
    // Sin un concepto de "piezas necesarias" por proyecto todavía, no se
    // puede calcular faltantes/sobrantes de forma fiable.
    piecesMissing: null,
    piecesSurplus: null,
  };
}

export type CollectionStats = {
  totalSets: number;
  completeSets: number | null;
  incompleteSets: number | null;
  totalPieces: number;
  totalUniquePieces: number;
  projectsCreated: number;
  projectsFinished: number;
};

/**
 * Estadísticas de colección. Sets todavía no tiene datos reales (por eso
 * el parámetro por defecto es []), así que "completos/incompletos" quedan
 * en null hasta que Set tenga un concepto de piezas requeridas vs. piezas
 * disponibles para poder calcularlo de verdad.
 */
export function calculateCollectionStats(
  pieces: PieceWithDetails[],
  sets: Set[] = [],
  projects: Project[] = [],
): CollectionStats {
  const inventory = calculateInventoryStats(pieces);

  return {
    totalSets: sets.length,
    completeSets: null,
    incompleteSets: null,
    totalPieces: inventory.totalPieces,
    totalUniquePieces: inventory.totalUniquePieces,
    projectsCreated: projects.length,
    projectsFinished: projects.filter((p) => p.status === "finished").length,
  };
}

export type ProjectStats = {
  totalProjects: number;
  finishedProjects: number;
  inProgressProjects: number;
  progressPercent: number;
};

/**
 * Estadísticas de proyectos. Ya funciona en cuanto haya Project[] reales;
 * "finished"/"in_progress" son los valores de estado provisionales usados
 * aquí porque Project.status es un string libre en el tipo actual — al
 * definir los estados reales de proyecto, solo hay que ajustar estos
 * literales en un sitio.
 */
export function calculateProjectStats(projects: Project[] = []): ProjectStats {
  const totalProjects = projects.length;
  const finishedProjects = projects.filter((p) => p.status === "finished").length;
  const inProgressProjects = projects.filter((p) => p.status === "in_progress").length;
  const progressPercent = totalProjects === 0 ? 0 : Math.round((finishedProjects / totalProjects) * 100);

  return { totalProjects, finishedProjects, inProgressProjects, progressPercent };
}
