// Catálogo fijo de piezas (no está en la base de datos).
// Cada pieza lleva la información necesaria para dibujarla en SVG.

export type FormaId = "alta" | "fina" | "lisa" | "rampa" | "agujeros" | "muneco" | "rara";

export type Silueta =
  | "cabeza"
  | "cuerpo"
  | "piernas"
  | "pelo"
  | "casco"
  | "sombrero"
  | "espada"
  | "escudo"
  | "taza"
  | "herramienta"
  | "ventana"
  | "puerta"
  | "rueda"
  | "bolita"
  | "planta"
  | "gema"
  | "valla"
  | "otra";

export type Dibujo =
  // Vista desde arriba (piezas planas).
  | {
      tipo: "arriba";
      figura: "rect" | "redonda" | "L" | "cuarto";
      ancho: number;
      largo: number;
      tetones: boolean;
      grosor: "alta" | "fina";
    }
  // Vistas de lado.
  | { tipo: "arco"; largo: number }
  | { tipo: "rampa"; ancho: number; largo: number; reves?: boolean }
  | { tipo: "curva"; ancho: number; largo: number }
  | { tipo: "viga"; agujeros: number }
  | { tipo: "eje"; largo: number }
  | { tipo: "pin"; largo: boolean }
  // Silueta simple.
  | { tipo: "silueta"; nombre: Silueta };

export type Pieza = {
  id: string;
  forma: FormaId;
  subtipo: string;
  /** Texto grande de la tarjeta, ej. "2 × 8". */
  medida: string;
  /** Nombre completo, ej. "Fina 2 × 8". */
  nombre: string;
  dibujo: Dibujo;
};

export type Subtipo = {
  id: string;
  nombre: string;
  piezas: Pieza[];
};

export type Forma = {
  id: FormaId;
  nombre: string;
  explicacion: string;
  /** Pieza que se usa como dibujo del botón de la forma. */
  icono: string;
  subtipos: Subtipo[];
};

// ---------- Ayudantes para construir el catálogo ----------

function medidas(lista: string): [number, number][] {
  return lista.split(",").map((m) => {
    const [a, b] = m.trim().split("x").map(Number);
    return [a, b];
  });
}

const x = (a: number, b: number) => `${a}\u00A0×\u00A0${b}`; // espacios que no se parten

function planas(
  forma: FormaId,
  subtipo: string,
  prefijo: string,
  figura: "rect" | "redonda" | "L" | "cuarto",
  lista: string,
  tetones: boolean,
  grosor: "alta" | "fina",
): Pieza[] {
  return medidas(lista).map(([a, b]) => ({
    id: `${forma}-${subtipo}-${a}x${b}`,
    forma,
    subtipo,
    medida: x(a, b),
    nombre: `${prefijo} ${x(a, b)}`,
    dibujo: { tipo: "arriba", figura, ancho: a, largo: b, tetones, grosor },
  }));
}

function siluetas(forma: FormaId, subtipo: string, lista: [Silueta, string][]): Pieza[] {
  return lista.map(([nombre, texto]) => ({
    id: `${forma}-${subtipo}-${nombre}`,
    forma,
    subtipo,
    medida: texto,
    nombre: texto,
    dibujo: { tipo: "silueta", nombre },
  }));
}

// ---------- Las 7 formas ----------

export const FORMAS: Forma[] = [
  {
    id: "alta",
    nombre: "Alta",
    explicacion: "Altas, con tetones",
    icono: "alta-rect-2x2",
    subtipos: [
      { id: "rect", nombre: "Rectangulares", piezas: planas("alta", "rect", "Alta", "rect", "1x1,1x2,1x3,1x4,1x6,1x8,1x10,1x12,1x16,2x2,2x3,2x4,2x6,2x8,2x10,2x12", true, "alta") },
      { id: "redonda", nombre: "Redondas", piezas: planas("alta", "redonda", "Alta redonda", "redonda", "1x1,2x2,4x4", true, "alta") },
      { id: "L", nombre: "En L", piezas: planas("alta", "L", "Alta en L", "L", "2x2", true, "alta") },
      {
        id: "arco",
        nombre: "Arcos",
        piezas: [3, 4, 6].map((n) => ({
          id: `alta-arco-1x${n}`,
          forma: "alta" as const,
          subtipo: "arco",
          medida: x(1, n),
          nombre: `Arco ${x(1, n)}`,
          dibujo: { tipo: "arco" as const, largo: n },
        })),
      },
    ],
  },
  {
    id: "fina",
    nombre: "Fina",
    explicacion: "Finas, con tetones",
    icono: "fina-rect-2x4",
    subtipos: [
      { id: "rect", nombre: "Rectangulares", piezas: planas("fina", "rect", "Fina", "rect", "1x1,1x2,1x3,1x4,1x6,1x8,1x10,1x12,2x2,2x3,2x4,2x6,2x8,2x10,2x12,4x4,4x6,4x8,4x10,4x12,6x6,6x8,6x10,6x12,8x8", true, "fina") },
      { id: "redonda", nombre: "Redondas", piezas: planas("fina", "redonda", "Fina redonda", "redonda", "1x1,2x2,4x4,6x6", true, "fina") },
      { id: "L", nombre: "En L", piezas: planas("fina", "L", "Fina en L", "L", "2x2,3x3,4x4", true, "fina") },
      { id: "curva", nombre: "Curvas", piezas: planas("fina", "curva", "Fina curva", "cuarto", "2x2,3x3,4x4,6x6", true, "fina") },
    ],
  },
  {
    id: "lisa",
    nombre: "Lisa",
    explicacion: "Finas, sin tetones",
    icono: "lisa-rect-2x2",
    subtipos: [
      { id: "rect", nombre: "Rectangulares", piezas: planas("lisa", "rect", "Lisa", "rect", "1x1,1x2,1x3,1x4,1x6,1x8,1x10,1x12,2x2,2x3,2x4,2x6,2x8", false, "fina") },
      { id: "redonda", nombre: "Redondas", piezas: planas("lisa", "redonda", "Lisa redonda", "redonda", "1x1,2x2", false, "fina") },
      { id: "curva", nombre: "Curvas", piezas: planas("lisa", "curva", "Lisa curva", "cuarto", "1x1,2x2,3x3", false, "fina") },
    ],
  },
  {
    id: "rampa",
    nombre: "Rampa",
    explicacion: "Rampas y curvas",
    icono: "rampa-rampa-1x3",
    subtipos: [
      {
        id: "rampa",
        nombre: "Rampas",
        piezas: [
          ...medidas("1x2,1x3,1x4,2x2,2x3").map(([a, b]) => ({
            id: `rampa-rampa-${a}x${b}`,
            forma: "rampa" as const,
            subtipo: "rampa",
            medida: x(a, b),
            nombre: `Rampa ${x(a, b)}`,
            dibujo: { tipo: "rampa" as const, ancho: a, largo: b },
          })),
          {
            id: "rampa-rampa-reves-1x2",
            forma: "rampa" as const,
            subtipo: "rampa",
            medida: `Al revés ${x(1, 2)}`,
            nombre: `Rampa al revés ${x(1, 2)}`,
            dibujo: { tipo: "rampa" as const, ancho: 1, largo: 2, reves: true },
          },
        ],
      },
      {
        id: "curva",
        nombre: "Curvas",
        piezas: medidas("1x2,1x3,1x4,2x2").map(([a, b]) => ({
          id: `rampa-curva-${a}x${b}`,
          forma: "rampa" as const,
          subtipo: "curva",
          medida: x(a, b),
          nombre: `Curva ${x(a, b)}`,
          dibujo: { tipo: "curva" as const, ancho: a, largo: b },
        })),
      },
    ],
  },
  {
    id: "agujeros",
    nombre: "Agujeros",
    explicacion: "Con agujeros, ejes y pines",
    icono: "agujeros-viga-3",
    subtipos: [
      {
        id: "viga",
        nombre: "Vigas",
        piezas: [2, 3, 4, 5, 6, 8, 10, 12].map((n) => ({
          id: `agujeros-viga-${n}`,
          forma: "agujeros" as const,
          subtipo: "viga",
          medida: `${n} agujeros`,
          nombre: `Viga ${n} agujeros`,
          dibujo: { tipo: "viga" as const, agujeros: n },
        })),
      },
      {
        id: "eje",
        nombre: "Ejes",
        piezas: [2, 3, 4, 5, 6, 8].map((n) => ({
          id: `agujeros-eje-${n}`,
          forma: "agujeros" as const,
          subtipo: "eje",
          medida: `Largo ${n}`,
          nombre: `Eje largo ${n}`,
          dibujo: { tipo: "eje" as const, largo: n },
        })),
      },
      {
        id: "pin",
        nombre: "Pines",
        piezas: [
          { id: "agujeros-pin-normal", forma: "agujeros", subtipo: "pin", medida: "Pin", nombre: "Pin", dibujo: { tipo: "pin", largo: false } },
          { id: "agujeros-pin-largo", forma: "agujeros", subtipo: "pin", medida: "Pin largo", nombre: "Pin largo", dibujo: { tipo: "pin", largo: true } },
        ],
      },
    ],
  },
  {
    id: "muneco",
    nombre: "Muñeco",
    explicacion: "Muñecos y sus cosas",
    icono: "muneco-partes-cabeza",
    subtipos: [
      {
        id: "partes",
        nombre: "Partes",
        piezas: siluetas("muneco", "partes", [
          ["cabeza", "Cabeza"],
          ["cuerpo", "Cuerpo"],
          ["piernas", "Piernas"],
          ["pelo", "Pelo"],
          ["casco", "Casco"],
          ["sombrero", "Sombrero"],
        ]),
      },
      {
        id: "accesorios",
        nombre: "Accesorios",
        piezas: siluetas("muneco", "accesorios", [
          ["espada", "Espada"],
          ["escudo", "Escudo"],
          ["taza", "Taza"],
          ["herramienta", "Herramienta"],
        ]),
      },
    ],
  },
  {
    id: "rara",
    nombre: "Rara",
    explicacion: "Piezas especiales",
    icono: "rara-especiales-rueda",
    subtipos: [
      {
        id: "especiales",
        nombre: "Especiales",
        piezas: siluetas("rara", "especiales", [
          ["ventana", "Ventana"],
          ["puerta", "Puerta"],
          ["rueda", "Rueda"],
          ["bolita", "Bolita"],
          ["planta", "Planta"],
          ["gema", "Gema"],
          ["valla", "Valla"],
          ["otra", "Otra"],
        ]),
      },
    ],
  },
];

/** Todas las piezas en una lista, para buscarlas por id. */
export const PIEZAS: Pieza[] = FORMAS.flatMap((f) => f.subtipos.flatMap((s) => s.piezas));

const porId = new Map(PIEZAS.map((p) => [p.id, p]));

export function buscarPieza(id: string): Pieza | undefined {
  return porId.get(id) ?? piezaDeMedidaLibre(id);
}

// ---------- Piezas rectangulares de medida libre ("+ Otra medida") ----------

const RECTANGULARES = {
  alta: { prefijo: "Alta", tetones: true, grosor: "alta" },
  fina: { prefijo: "Fina", tetones: true, grosor: "fina" },
  lisa: { prefijo: "Lisa", tetones: false, grosor: "fina" },
} as const;

export type FormaRectangular = keyof typeof RECTANGULARES;

/** Número máximo de tetones de ancho o de largo. */
export const MEDIDA_MAXIMA = 32;

export function esFormaRectangular(forma: string): forma is FormaRectangular {
  return forma in RECTANGULARES;
}

/**
 * Pieza rectangular de cualquier medida. Usa el mismo código que las del
 * catálogo (ej. "fina-rect-3x7"), así se guarda y se dibuja igual que las demás.
 */
export function piezaRectangular(forma: FormaRectangular, a: number, b: number): Pieza {
  const ancho = Math.min(a, b);
  const largo = Math.max(a, b);
  const r = RECTANGULARES[forma];
  return planas(forma, "rect", r.prefijo, "rect", `${ancho}x${largo}`, r.tetones, r.grosor)[0];
}

/** Reconoce códigos como "fina-rect-3x7" que no están en la lista fija. */
function piezaDeMedidaLibre(id: string): Pieza | undefined {
  const m = /^(alta|fina|lisa)-rect-([1-9]\d*)x([1-9]\d*)$/.exec(id);
  if (!m) return undefined;
  const a = Number(m[2]);
  const b = Number(m[3]);
  if (a > b || b > MEDIDA_MAXIMA) return undefined;
  return piezaRectangular(m[1] as FormaRectangular, a, b);
}

// ---------- Colores ----------

export type Color = {
  id: string;
  nombre: string;
  hex: string;
  transparente?: boolean;
};

export const COLORES: Color[] = [
  { id: "blanco", nombre: "Blanco", hex: "#F4F4F4" },
  { id: "negro", nombre: "Negro", hex: "#1B2A34" },
  { id: "gris-claro", nombre: "Gris claro", hex: "#A0A5A9" },
  { id: "gris-oscuro", nombre: "Gris oscuro", hex: "#6C6E68" },
  { id: "rojo", nombre: "Rojo", hex: "#C91A09" },
  { id: "naranja", nombre: "Naranja", hex: "#FE8A18" },
  { id: "amarillo", nombre: "Amarillo", hex: "#F2CD37" },
  { id: "verde", nombre: "Verde", hex: "#237841" },
  { id: "azul", nombre: "Azul", hex: "#0055BF" },
  { id: "azul-claro", nombre: "Azul claro", hex: "#9FC3E9" },
  { id: "rosa", nombre: "Rosa", hex: "#E4ADC8" },
  { id: "beige", nombre: "Beige", hex: "#E4CD9E" },
  { id: "caramelo", nombre: "Caramelo", hex: "#D09168" },
  { id: "naranja-oscuro", nombre: "Naranja oscuro", hex: "#A95500" },
  { id: "marron", nombre: "Marrón", hex: "#582A12" },
  { id: "marron-oscuro", nombre: "Marrón oscuro", hex: "#352100" },
  { id: "dorado", nombre: "Dorado", hex: "#DBAC34" },
  { id: "transparente", nombre: "Transparente", hex: "#DDEEF5", transparente: true },
];

const colorPorId = new Map(COLORES.map((c) => [c.id, c]));

export function buscarColor(id: string | null | undefined): Color | undefined {
  return id ? colorPorId.get(id) : undefined;
}
