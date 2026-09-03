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
