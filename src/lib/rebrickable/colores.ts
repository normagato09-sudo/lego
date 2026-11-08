// Colores que LEGO fabrica ahora (según Rebrickable: usados en 2024 o después),
// sin purpurina, ópalo ni brillo en la oscuridad. Con nombre en español, familia y orden.
// "id" es el número de color en Rebrickable.

export type ColorRB = { id: number; nombre: string; familia: string };

export const FAMILIAS = [
  "Blancos y grises",
  "Rojos y rosas",
  "Naranjas y marrones",
  "Amarillos",
  "Verdes",
  "Azules",
  "Morados",
  "Transparentes",
  "Metálicos",
] as const;

export const COLORES_RB: ColorRB[] = [
  // Blancos y grises
  { id: 15, nombre: "Blanco", familia: "Blancos y grises" },
  { id: 71, nombre: "Gris claro", familia: "Blancos y grises" },
  { id: 72, nombre: "Gris oscuro", familia: "Blancos y grises" },
  { id: 0, nombre: "Negro", familia: "Blancos y grises" },
  // Rojos y rosas
  { id: 4, nombre: "Rojo", familia: "Rojos y rosas" },
  { id: 320, nombre: "Rojo oscuro", familia: "Rojos y rosas" },
  { id: 1050, nombre: "Coral", familia: "Rojos y rosas" },
  { id: 1146, nombre: "Rosa cálido", familia: "Rojos y rosas" },
  { id: 29, nombre: "Rosa", familia: "Rojos y rosas" },
  { id: 5, nombre: "Rosa oscuro", familia: "Rojos y rosas" },
  { id: 26, nombre: "Magenta", familia: "Rojos y rosas" },
  // Naranjas y marrones
  { id: 191, nombre: "Naranja claro", familia: "Naranjas y marrones" },
  { id: 25, nombre: "Naranja", familia: "Naranjas y marrones" },
  { id: 1136, nombre: "Naranja rojizo", familia: "Naranjas y marrones" },
  { id: 484, nombre: "Naranja oscuro", familia: "Naranjas y marrones" },
  { id: 78, nombre: "Piel clara", familia: "Naranjas y marrones" },
  { id: 19, nombre: "Beige", familia: "Naranjas y marrones" },
  { id: 1089, nombre: "Beige cálido", familia: "Naranjas y marrones" },
  { id: 28, nombre: "Beige oscuro", familia: "Naranjas y marrones" },
  { id: 92, nombre: "Caramelo", familia: "Naranjas y marrones" },
  { id: 84, nombre: "Marrón claro", familia: "Naranjas y marrones" },
  { id: 1137, nombre: "Marrón siena", familia: "Naranjas y marrones" },
  { id: 1088, nombre: "Marrón medio", familia: "Naranjas y marrones" },
  { id: 1138, nombre: "Marrón sombra", familia: "Naranjas y marrones" },
  { id: 70, nombre: "Marrón", familia: "Naranjas y marrones" },
  { id: 308, nombre: "Marrón oscuro", familia: "Naranjas y marrones" },
  // Amarillos
  { id: 226, nombre: "Amarillo claro", familia: "Amarillos" },
  { id: 1062, nombre: "Amarillo vibrante", familia: "Amarillos" },
  { id: 14, nombre: "Amarillo", familia: "Amarillos" },
  { id: 1145, nombre: "Amarillo ocre", familia: "Amarillos" },
  // Verdes
  { id: 158, nombre: "Verde amarillento", familia: "Verdes" },
  { id: 27, nombre: "Verde lima", familia: "Verdes" },
  { id: 10, nombre: "Verde brillante", familia: "Verdes" },
  { id: 2, nombre: "Verde", familia: "Verdes" },
  { id: 288, nombre: "Verde oscuro", familia: "Verdes" },
  { id: 326, nombre: "Verde oliva", familia: "Verdes" },
  { id: 378, nombre: "Verde arena", familia: "Verdes" },
  // Azules
  { id: 323, nombre: "Aguamarina claro", familia: "Azules" },
  { id: 212, nombre: "Azul claro", familia: "Azules" },
  { id: 73, nombre: "Azul medio", familia: "Azules" },
  { id: 322, nombre: "Azul celeste", familia: "Azules" },
  { id: 321, nombre: "Celeste oscuro", familia: "Azules" },
  { id: 3, nombre: "Turquesa oscuro", familia: "Azules" },
  { id: 1, nombre: "Azul", familia: "Azules" },
  { id: 379, nombre: "Azul arena", familia: "Azules" },
  { id: 272, nombre: "Azul oscuro", familia: "Azules" },
  // Morados
  { id: 31, nombre: "Lila claro", familia: "Morados" },
  { id: 1147, nombre: "Violeta azulado", familia: "Morados" },
  { id: 30, nombre: "Lila", familia: "Morados" },
  { id: 85, nombre: "Morado oscuro", familia: "Morados" },
  // Transparentes
  { id: 47, nombre: "Transparente", familia: "Transparentes" },
  { id: 1095, nombre: "Transparente negro (ahumado)", familia: "Transparentes" },
  { id: 40, nombre: "Transparente marrón (ahumado)", familia: "Transparentes" },
  { id: 36, nombre: "Transparente rojo", familia: "Transparentes" },
  { id: 45, nombre: "Transparente rosa", familia: "Transparentes" },
  { id: 182, nombre: "Transparente naranja", familia: "Transparentes" },
  { id: 46, nombre: "Transparente amarillo", familia: "Transparentes" },
  { id: 42, nombre: "Transparente verde neón", familia: "Transparentes" },
  { id: 35, nombre: "Transparente verde lima", familia: "Transparentes" },
  { id: 34, nombre: "Transparente verde", familia: "Transparentes" },
  { id: 41, nombre: "Transparente azul claro", familia: "Transparentes" },
  { id: 33, nombre: "Transparente azul", familia: "Transparentes" },
  { id: 52, nombre: "Transparente morado", familia: "Transparentes" },
  // Metálicos
  { id: 179, nombre: "Plateado", familia: "Metálicos" },
  { id: 80, nombre: "Plateado brillante", familia: "Metálicos" },
  { id: 383, nombre: "Plateado cromado", familia: "Metálicos" },
  { id: 1103, nombre: "Titanio perlado", familia: "Metálicos" },
  { id: 82, nombre: "Dorado", familia: "Metálicos" },
  { id: 297, nombre: "Dorado perlado", familia: "Metálicos" },
  { id: 334, nombre: "Dorado cromado", familia: "Metálicos" },
];
