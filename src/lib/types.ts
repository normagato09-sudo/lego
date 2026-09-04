export type Color = {
  id: string;
  name: string;
  hex_code: string | null;
};

export type Location = {
  id: string;
  name: string;
  parent_id: string | null;
};

export type Piece = {
  id: string;
  lego_id: string;
  name: string;
  description: string | null;
  color_id: string;
  quantity: number;
  location_id: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
};

/** Pieza con el color resuelto y una etiqueta de ubicación legible. */
export type PieceWithDetails = Piece & {
  color: Color;
  locationLabel: string | null;
};

/* ------------------------------------------------------------------ */
/* Entidades futuras                                                   */
/*                                                                      */
/* Todavía no tienen tablas en la base de datos ni lógica implementada. */
/* Se dejan aquí como preparación de tipos para cuando se construyan   */
/* esas funciones (sets, proyectos, galería, instrucciones, usuarios,  */
/* estadísticas). No se usan en ningún componente todavía.             */
/* ------------------------------------------------------------------ */

export type Set = {
  id: string;
  set_number: string;
  name: string;
  piece_count: number | null;
  year: number | null;
  image_url: string | null;
};

export type InventoryItem = {
  id: string;
  set_id: string;
  quantity: number;
};

export type Project = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  created_at: string;
};

export type ProjectPiece = {
  id: string;
  project_id: string;
  piece_id: string;
  quantity: number;
};

export type Instruction = {
  id: string;
  set_id: string;
  file_url: string;
};

export type GalleryPost = {
  id: string;
  user_id: string;
  image_url: string;
  caption: string | null;
  created_at: string;
};

export type User = {
  id: string;
  name: string;
  email: string;
};

export type Collection = {
  id: string;
  user_id: string;
  name: string;
};

export type Statistics = {
  totalPieces: number;
  totalSets: number;
  totalProjects: number;
};
