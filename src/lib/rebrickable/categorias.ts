import type { FormaId } from "@/lib/catalogo";

// Cómo se agrupan las categorías de Rebrickable en las 7 formas de la app,
// con un nombre sencillo en español. "orden" = posición dentro de su forma.
// Varias categorías pueden compartir nombre (se ven como un solo grupo).

export type CategoriaRB = { id: number; nombre_en: string; nombre: string; forma: FormaId; orden: number };

export const CATEGORIAS_RB: CategoriaRB[] = [
  // 1. Alta
  { id: 11, nombre_en: "Bricks", nombre: "Rectangulares", forma: "alta", orden: 1 },
  { id: 20, nombre_en: "Bricks Round and Cones", nombre: "Redondas y conos", forma: "alta", orden: 2 },
  { id: 6, nombre_en: "Bricks Wedged", nombre: "En diagonal (cuña)", forma: "alta", orden: 3 },
  { id: 5, nombre_en: "Bricks Special", nombre: "Especiales (con algo en un lado)", forma: "alta", orden: 4 },

  // 2. Fina
  { id: 14, nombre_en: "Plates", nombre: "Rectangulares", forma: "fina", orden: 1 },
  { id: 21, nombre_en: "Plates Round Curved and Dishes", nombre: "Redondas, curvas y platos", forma: "fina", orden: 2 },
  { id: 49, nombre_en: "Plates Wedged", nombre: "En diagonal (cuña)", forma: "fina", orden: 3 },
  { id: 9, nombre_en: "Plates Special", nombre: "Especiales (con clip, asa o agujero)", forma: "fina", orden: 4 },
  { id: 1, nombre_en: "Baseplates", nombre: "Bases grandes", forma: "fina", orden: 5 },

  // 3. Lisa
  { id: 19, nombre_en: "Tiles", nombre: "Rectangulares", forma: "lisa", orden: 1 },
  { id: 67, nombre_en: "Tiles Round and Curved", nombre: "Redondas y curvas", forma: "lisa", orden: 2 },
  { id: 15, nombre_en: "Tiles Special", nombre: "Especiales", forma: "lisa", orden: 3 },

  // 4. Rampa o curva
  { id: 3, nombre_en: "Bricks Sloped", nombre: "Rampas", forma: "rampa", orden: 1 },
  { id: 37, nombre_en: "Bricks Curved", nombre: "Curvas", forma: "rampa", orden: 2 },
  { id: 47, nombre_en: "Windscreens and Fuselage", nombre: "Parabrisas y morros", forma: "rampa", orden: 3 },

  // 5. Con agujeros
  { id: 8, nombre_en: "Technic Bricks", nombre: "Ladrillos con agujeros", forma: "agujeros", orden: 1 },
  { id: 51, nombre_en: "Technic Beams", nombre: "Vigas", forma: "agujeros", orden: 2 },
  { id: 55, nombre_en: "Technic Beams Special", nombre: "Vigas dobladas y especiales", forma: "agujeros", orden: 3 },
  { id: 46, nombre_en: "Technic Axles", nombre: "Ejes", forma: "agujeros", orden: 4 },
  { id: 53, nombre_en: "Technic Pins", nombre: "Pines", forma: "agujeros", orden: 5 },
  { id: 12, nombre_en: "Technic Connectors", nombre: "Conectores", forma: "agujeros", orden: 6 },
  { id: 54, nombre_en: "Technic Bushes", nombre: "Topes y casquillos", forma: "agujeros", orden: 7 },
  { id: 52, nombre_en: "Technic Gears", nombre: "Engranajes", forma: "agujeros", orden: 8 },
  { id: 17, nombre_en: "Gear Parts", nombre: "Engranajes", forma: "agujeros", orden: 8 },
  { id: 40, nombre_en: "Technic Panels", nombre: "Paneles grandes", forma: "agujeros", orden: 9 },
  { id: 25, nombre_en: "Technic Steering, Suspension and Engine", nombre: "Dirección, suspensión y motor", forma: "agujeros", orden: 10 },
  { id: 22, nombre_en: "Pneumatics", nombre: "Neumática (de aire)", forma: "agujeros", orden: 11 },
  { id: 26, nombre_en: "Technic Special", nombre: "Especiales", forma: "agujeros", orden: 12 },

  // 6. Muñeco
  { id: 59, nombre_en: "Minifig Heads", nombre: "Cabezas", forma: "muneco", orden: 1 },
  { id: 60, nombre_en: "Minifig Upper Body", nombre: "Cuerpos", forma: "muneco", orden: 2 },
  { id: 61, nombre_en: "Minifig Lower Body", nombre: "Piernas", forma: "muneco", orden: 3 },
  { id: 65, nombre_en: "Minifig Headwear", nombre: "Pelo, cascos y sombreros", forma: "muneco", orden: 4 },
  { id: 72, nombre_en: "Minifig Headwear Accessories", nombre: "Adornos para la cabeza", forma: "muneco", orden: 5 },
  { id: 71, nombre_en: "Minifig Neckwear", nombre: "Para el cuello (capas, mochilas…)", forma: "muneco", orden: 6 },
  { id: 70, nombre_en: "Minifig Hipwear", nombre: "Para la cintura", forma: "muneco", orden: 7 },
  { id: 73, nombre_en: "Minifig Shields, Weapons, & Tools", nombre: "Armas, escudos y herramientas", forma: "muneco", orden: 8 },
  { id: 27, nombre_en: "Minifig Accessories", nombre: "Accesorios", forma: "muneco", orden: 9 },
  { id: 13, nombre_en: "Minifigs", nombre: "Muñecos completos", forma: "muneco", orden: 10 },
  { id: 62, nombre_en: "Minidoll Heads", nombre: "Muñecas Friends", forma: "muneco", orden: 11 },
  { id: 63, nombre_en: "Minidoll Upper Body", nombre: "Muñecas Friends", forma: "muneco", orden: 11 },
  { id: 64, nombre_en: "Minidoll Lower Body", nombre: "Muñecas Friends", forma: "muneco", orden: 11 },
  { id: 28, nombre_en: "Animals / Creatures", nombre: "Animales", forma: "muneco", orden: 12 },
  { id: 75, nombre_en: "Animal / Creature Body Parts", nombre: "Partes y cosas de animales", forma: "muneco", orden: 13 },
  { id: 74, nombre_en: "Animal / Creature Accessories", nombre: "Partes y cosas de animales", forma: "muneco", orden: 13 },
  { id: 41, nombre_en: "Large Buildable Figures", nombre: "Figuras grandes", forma: "muneco", orden: 14 },

  // 7. Rara
  { id: 16, nombre_en: "Windows and Doors", nombre: "Ventanas y puertas", forma: "rara", orden: 1 },
  { id: 29, nombre_en: "Wheels and Tyres", nombre: "Ruedas y neumáticos", forma: "rara", orden: 2 },
  { id: 18, nombre_en: "Hinges, Arms and Turntables", nombre: "Bisagras y piezas que giran", forma: "rara", orden: 3 },
  { id: 32, nombre_en: "Bars, Ladders and Fences", nombre: "Barras, escaleras y vallas", forma: "rara", orden: 4 },
  { id: 23, nombre_en: "Panels", nombre: "Paredes y paneles", forma: "rara", orden: 5 },
  { id: 7, nombre_en: "Containers", nombre: "Cajas, cofres y cubos", forma: "rara", orden: 6 },
  { id: 76, nombre_en: "Plants & Trees", nombre: "Plantas y árboles", forma: "rara", orden: 7 },
  { id: 33, nombre_en: "Rock", nombre: "Rocas", forma: "rara", orden: 8 },
  { id: 34, nombre_en: "Supports, Girders and Cranes", nombre: "Soportes y columnas", forma: "rara", orden: 9 },
  { id: 35, nombre_en: "Transportation - Sea and Air", nombre: "Barcos y aviones", forma: "rara", orden: 10 },
  { id: 36, nombre_en: "Transportation - Land", nombre: "Coches y trenes", forma: "rara", orden: 11 },
  { id: 38, nombre_en: "Flags, Banners and Signs", nombre: "Banderas y señales", forma: "rara", orden: 12 },
  { id: 69, nombre_en: "Energy Effects", nombre: "Efectos (fuego, rayos…)", forma: "rara", orden: 13 },
  { id: 68, nombre_en: "Projectiles / Launchers", nombre: "Lanzadores y proyectiles", forma: "rara", orden: 14 },
  { id: 30, nombre_en: "Tubes and Hoses", nombre: "Tubos y mangueras", forma: "rara", orden: 15 },
  { id: 31, nombre_en: "String, Bands and Reels", nombre: "Cuerdas, gomas y carretes", forma: "rara", orden: 16 },
  { id: 39, nombre_en: "Magnets and Holders", nombre: "Imanes", forma: "rara", orden: 17 },
  { id: 44, nombre_en: "Mechanical", nombre: "Mecanismos (muelles, cuerda…)", forma: "rara", orden: 18 },
  { id: 45, nombre_en: "Electronics", nombre: "Electrónica (luces, motores)", forma: "rara", orden: 19 },
  { id: 56, nombre_en: "Tools", nombre: "Herramientas (separador)", forma: "rara", orden: 20 },
  { id: 24, nombre_en: "Other", nombre: "Otras", forma: "rara", orden: 21 },
];

/**
 * Categorías que se dejan fuera (no son piezas LEGO normales): Duplo, Belville/Scala/Fabuland,
 * Znap, Clikits, escala HO, figuras no montables, pegatinas, Modulex, piezas no LEGO, bolígrafos y relojes.
 */
export const CATEGORIAS_EXCLUIDAS = new Set([4, 42, 43, 48, 50, 57, 58, 66, 77, 78]);

/** En estas categorías sí se guardan las versiones impresas (cabezas, cuerpos, piernas…). */
export const CATEGORIAS_CON_IMPRESAS = new Set([13, 59, 60, 61, 62, 63, 64]);
