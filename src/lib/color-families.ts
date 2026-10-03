import type { Color } from "@/lib/types";

/** Familias en el orden en que se muestran; los transparentes van aparte, al final. */
export const COLOR_FAMILIES = [
  "Blancos y grises",
  "Negros",
  "Marrones y beiges",
  "Rojos",
  "Naranjas",
  "Amarillos",
  "Verdes",
  "Azules",
  "Morados",
  "Rosas",
] as const;

export type ColorFamily = (typeof COLOR_FAMILIES)[number];

export const TRANS_GROUP = "Transparentes";

/** Colores que el rgb clasifica mal (por nombre exacto de Rebrickable). */
const EXCEPTIONS: Record<string, ColorFamily> = {
  "Modulex Black": "Negros",
  "Trans-Black": "Negros",
  "Trans-Black IR Lens": "Negros",
  "Modulex Light Bluish Gray": "Blancos y grises",
  "Light Nougat": "Marrones y beiges",
  "Light Tan": "Marrones y beiges",
  "Dark Nougat": "Marrones y beiges",
  "Modulex Tile Brown": "Marrones y beiges",
  "Trans-Brown": "Marrones y beiges",
  "HO Light Tan": "Marrones y beiges",
  "Trans-Neon Red": "Rojos",
  "HO Light Yellow": "Amarillos",
  "Ochre Yellow": "Amarillos",
  "Curry": "Amarillos",
  "Duplo Lime": "Verdes",
  "Trans-Neon Green": "Verdes",
  "Dark Blue-Violet": "Azules",
  "Light Purple": "Rosas",
};

/** Metálicos, perlados y familias que LEGO nombra por tono (Violet, Lilac...). */
const BY_NAME: [RegExp, ColorFamily][] = [
  [/^speckle black/i, "Negros"],
  [/gold/i, "Amarillos"],
  [/silver|titanium/i, "Blancos y grises"],
  [/copper|bronze|brass/i, "Marrones y beiges"],
  [/violet|lilac|lavender|purple/i, "Morados"],
];

function channels(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255) as [number, number, number];
}

/** Tono (0-360), saturación, luminosidad y croma (0-1) de un '#rrggbb'. */
function hsl(hex: string) {
  const [r, g, b] = channels(hex);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const c = max - min;
  const l = (max + min) / 2;
  if (c === 0) return { h: 0, s: 0, l, c };
  const s = c / (1 - Math.abs(2 * l - 1));
  const h =
    max === r ? ((g - b) / c + 6) % 6 : max === g ? (b - r) / c + 2 : (r - g) / c + 4;
  return { h: h * 60, s, l, c };
}

/** Claridad percibida (L* de CIELAB, 0-100): ordena de claro a oscuro como lo ve el ojo. */
function lightness(hex: string): number {
  const lin = (v: number) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  const [r, g, b] = channels(hex).map(lin);
  const y = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return y > 0.008856 ? 116 * Math.cbrt(y) - 16 : 903.3 * y;
}

/** Familia de un color según su rgb, salvo excepciones y nombres de metálicos. */
export function colorFamily(color: Color): ColorFamily {
  const exception = EXCEPTIONS[color.name];
  if (exception) return exception;
  for (const [re, family] of BY_NAME) if (re.test(color.name)) return family;
  if (!color.hex_code) return "Blancos y grises";

  const { h, s, l, c } = hsl(color.hex_code);
  if (c < 0.15 && l < 0.22) return "Negros";
  if (c < 0.08 || l > 0.93) return "Blancos y grises";
  // Marrones (oscuros o apagados) y beiges (claros y poco saturados).
  if (h >= 10 && h < 55 && (l < 0.3 || (s < 0.45 && l < 0.7) || (l < 0.45 && s < 0.6))) {
    return "Marrones y beiges";
  }
  if (h >= 20 && h < 55 && s < 0.62 && l >= 0.55) return "Marrones y beiges";
  // Amarillos apagados y oscuros: verdes oliva.
  if (h >= 50 && h < 68 && s < 0.45 && l < 0.55) return "Verdes";
  if (h < 10 || h >= 345) return l > 0.72 ? "Rosas" : "Rojos";
  if (h < 42) return "Naranjas";
  if (h < 62) return "Amarillos";
  if (h < 160) return "Verdes";
  if (h < 250) return "Azules";
  if (h < 290) return "Morados";
  return "Rosas";
}

type SortKey = { rank: number; lightness: number };
const keys = new Map<number, SortKey>();

function sortKey(color: Color): SortKey {
  let key = keys.get(color.id);
  if (!key) {
    const family = COLOR_FAMILIES.indexOf(colorFamily(color));
    key = {
      rank: (color.is_trans ? COLOR_FAMILIES.length : 0) + family,
      lightness: color.hex_code ? lightness(color.hex_code) : 100,
    };
    keys.set(color.id, key);
  }
  return key;
}

/** Orden de colores: por familia, de claro a oscuro; los transparentes al final. */
export function compareColors(a: Color, b: Color): number {
  const ka = sortKey(a);
  const kb = sortKey(b);
  return ka.rank - kb.rank || kb.lightness - ka.lightness || a.name.localeCompare(b.name, "es");
}

export type ColorGroup<T> = { title: ColorFamily | typeof TRANS_GROUP; items: T[] };

/** Agrupa por familia (solo las que tienen algún color), ya ordenado; transparentes al final. */
export function groupByColorFamily<T>(items: T[], colorOf: (item: T) => Color): ColorGroup<T>[] {
  const groups: ColorGroup<T>[] = [];
  for (const item of [...items].sort((a, b) => compareColors(colorOf(a), colorOf(b)))) {
    const color = colorOf(item);
    const title = color.is_trans ? TRANS_GROUP : colorFamily(color);
    const last = groups.at(-1);
    if (last?.title === title) last.items.push(item);
    else groups.push({ title, items: [item] });
  }
  return groups;
}
