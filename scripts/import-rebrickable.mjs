/**
 * Importa o actualiza el catálogo de Rebrickable en Supabase (tablas catalog_*,
 * ver supabase/migrations/20261003090000_rebrickable_catalog.sql).
 *
 * Uso: npm run catalog:import   (lee .env.local; necesita Node 20.9 o superior)
 *
 * Se puede repetir cuando se quiera actualizar: solo añade o actualiza filas,
 * no borra ninguna. Datos: https://rebrickable.com/downloads/
 */
import { createGunzip } from "node:zlib";
import { Readable } from "node:stream";
import { createInterface } from "node:readline";
import { createClient } from "@supabase/supabase-js";

const BASE_URL = "https://cdn.rebrickable.com/media/downloads/";
const BATCH = 1000;

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local.");
  process.exit(1);
}
const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

/** Divide una línea CSV respetando comillas ("a, b" y "" escapadas). */
function parseLine(line) {
  const fields = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (quoted) {
      if (ch !== '"') field += ch;
      else if (line[i + 1] === '"') {
        field += '"';
        i++;
      } else quoted = false;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") {
      fields.push(field);
      field = "";
    } else field += ch;
  }
  fields.push(field);
  return fields;
}

/** Descarga <name>.csv.gz y devuelve sus filas como { columna: valor }. */
async function* readCsv(name) {
  const res = await fetch(`${BASE_URL}${name}.csv.gz`);
  if (!res.ok || !res.body) throw new Error(`No se pudo descargar ${name}: HTTP ${res.status}`);
  const input = Readable.fromWeb(res.body).pipe(createGunzip());
  let header = null;
  for await (const line of createInterface({ input, crlfDelay: Infinity })) {
    if (!line) continue;
    const values = parseLine(line);
    if (!header) header = values;
    else yield Object.fromEntries(header.map((h, i) => [h, values[i] ?? ""]));
  }
}

async function upsert(table, rows, onConflict) {
  for (let i = 0; i < rows.length; i += BATCH) {
    const { error } = await supabase.from(table).upsert(rows.slice(i, i + BATCH), { onConflict });
    if (error) throw new Error(`${table}: ${error.message}`);
    process.stdout.write(`\r  ${table}: ${Math.min(i + BATCH, rows.length)}/${rows.length}`);
  }
  process.stdout.write("\n");
}

async function main() {
  console.log("Colores y categorías…");
  const colors = [];
  for await (const r of readCsv("colors")) {
    colors.push({ id: Number(r.id), name: r.name, rgb: r.rgb, is_trans: r.is_trans === "True" });
  }
  const colorIds = new Set(colors.map((c) => c.id));

  const categories = [];
  for await (const r of readCsv("part_categories")) categories.push({ id: Number(r.id), name: r.name });
  const categoryIds = new Set(categories.map((c) => c.id));

  console.log("Piezas…");
  const parts = new Map();
  for await (const r of readCsv("parts")) {
    const cat = Number(r.part_cat_id);
    parts.set(r.part_num, {
      part_num: r.part_num,
      name: r.name,
      part_cat_id: categoryIds.has(cat) ? cat : null,
      part_material: r.part_material || null,
      img_url: null,
    });
  }

  // Pares pieza+color: los que aparecen en sets (con su foto) y los que tienen element ID.
  const pairs = new Map();
  function getPair(partNum, colorId) {
    if (!parts.has(partNum) || !colorIds.has(colorId)) return null;
    const k = `${partNum}|${colorId}`;
    let pair = pairs.get(k);
    if (!pair) {
      pair = { part_num: partNum, color_id: colorId, img_url: null, uses: 0, elements: [] };
      pairs.set(k, pair);
    }
    return pair;
  }

  console.log("Piezas en sets (fotos por color, ~1,5 millones de filas)…");
  for await (const r of readCsv("inventory_parts")) {
    const pair = getPair(r.part_num, Number(r.color_id));
    if (!pair) continue;
    pair.uses++;
    if (!pair.img_url && r.img_url) pair.img_url = r.img_url;
  }

  console.log("Elementos…");
  const elements = [];
  for await (const r of readCsv("elements")) {
    const pair = getPair(r.part_num, Number(r.color_id));
    if (!pair) continue;
    pair.elements.push(r.element_id);
    elements.push({
      element_id: r.element_id,
      part_num: r.part_num,
      color_id: Number(r.color_id),
      design_id: r.design_id || null,
    });
  }

  // Element ID de cada par: el de la foto que muestra Rebrickable; si no, el
  // más reciente (número más alto). Foto de cada pieza: la del color que más
  // aparece en sets.
  const bestUses = new Map();
  const partColors = [];
  for (const pair of pairs.values()) {
    const fromImage = pair.img_url?.match(/\/elements\/(\d+)\.jpg$/)?.[1];
    const elementId = pair.elements.includes(fromImage)
      ? fromImage
      : (pair.elements.sort((a, b) => Number(b) - Number(a))[0] ?? null);
    partColors.push({
      part_num: pair.part_num,
      color_id: pair.color_id,
      img_url: pair.img_url,
      element_id: elementId,
    });

    if (pair.img_url && pair.uses > (bestUses.get(pair.part_num) ?? -1)) {
      bestUses.set(pair.part_num, pair.uses);
      parts.get(pair.part_num).img_url = pair.img_url;
    }
  }

  const withImage = partColors.filter((pc) => pc.img_url).length;
  console.log(
    `Leído: ${colors.length} colores, ${categories.length} categorías, ${parts.size} piezas, ` +
      `${elements.length} elementos, ${partColors.length} piezas+color (${withImage} con foto).`,
  );

  console.log("Subiendo a Supabase…");
  await upsert("catalog_colors", colors, "id");
  await upsert("catalog_part_categories", categories, "id");
  await upsert("catalog_parts", [...parts.values()], "part_num");
  await upsert("catalog_elements", elements, "element_id");
  await upsert("catalog_part_colors", partColors, "part_num,color_id");
  console.log("Catálogo actualizado. Datos: Rebrickable (https://rebrickable.com).");
}

main().catch((error) => {
  console.error(`\nError: ${error.message}`);
  process.exit(1);
});
