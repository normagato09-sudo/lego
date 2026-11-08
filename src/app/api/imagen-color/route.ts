import sharp from "sharp";
import {
  pedirRebrickableSiExiste,
  type ColorDePiezaApi,
  type PaginaApi,
} from "@/lib/rebrickable/api";
import { haySesion } from "@/lib/sesion";

// Imagen de una pieza en un color, para cuando Rebrickable no tiene su dibujo 3D en ese color.
// 1. Si Rebrickable tiene una FOTO REAL de la pieza en ese color → esa foto.
// 2. Si no, coge una foto de la pieza en un color claro (o su dibujo en gris),
//    le quita el fondo blanco y la repinta en tu color, con sus luces y sombras.
// Uso: /api/imagen-color?pieza=3023&color=84&hex=AA7D55&trans=0

/**
 * Colores claros que sirven de base para repintar, del mejor al peor.
 * El gris claro va primero: el blanco se confunde con el fondo en los brillos.
 */
const BASES_CLARAS = [71, 19, 78, 212, 323, 226, 14, 31, 158, 27, 15, 47];
const TAMANO = 200;
const CACHE = "private, max-age=2592000, immutable"; // un mes en el móvil

export async function GET(request: Request) {
  if (!(await haySesion())) return new Response("Hace falta la contraseña.", { status: 401 });

  const parametros = new URL(request.url).searchParams;
  const pieza = parametros.get("pieza") ?? "";
  const color = Number(parametros.get("color"));
  const hex = (parametros.get("hex") ?? "").toUpperCase();
  const transparente = parametros.get("trans") === "1";
  if (!/^[A-Za-z0-9._-]{1,40}$/.test(pieza) || !Number.isInteger(color) || !/^[0-9A-F]{6}$/.test(hex)) {
    return new Response("Datos no válidos.", { status: 400 });
  }

  try {
    // 1. ¿Hay foto real en ese color?
    const exacta = await pedirRebrickableSiExiste<{ part_img_url: string | null }>(
      `/parts/${encodeURIComponent(pieza)}/colors/${color}/`,
    );
    if (exacta?.part_img_url) {
      return new Response(null, { status: 302, headers: { Location: exacta.part_img_url, "Cache-Control": CACHE } });
    }

    // 2. Buscar una base clara para repintar.
    const bases: string[] = [];
    const colores = await pedirRebrickableSiExiste<PaginaApi<ColorDePiezaApi>>(
      `/parts/${encodeURIComponent(pieza)}/colors/?page_size=1000`,
    );
    const conFoto = (colores?.results ?? []).filter((c) => c.part_img_url);
    for (const id of BASES_CLARAS) {
      const c = conFoto.find((x) => x.color_id === id);
      if (c?.part_img_url) bases.push(c.part_img_url);
    }
    // Dibujos 3D en gris claro o blanco, si los hay.
    bases.push(
      `https://cdn.rebrickable.com/media/parts/ldraw/71/${encodeURIComponent(pieza)}.png`,
      `https://cdn.rebrickable.com/media/parts/ldraw/15/${encodeURIComponent(pieza)}.png`,
    );
    // Como último recurso, la foto de cualquier color.
    for (const c of conFoto) if (c.part_img_url) bases.push(c.part_img_url);

    for (const url of [...new Set(bases)].slice(0, 6)) {
      const respuesta = await fetch(url, { headers: { "User-Agent": "lego-inventario/1.0" } });
      if (!respuesta.ok) continue;
      const png = await pintar(Buffer.from(await respuesta.arrayBuffer()), hex, transparente);
      if (png) return new Response(new Uint8Array(png), { headers: { "Content-Type": "image/png", "Cache-Control": CACHE } });
    }
  } catch (e) {
    console.error("No se pudo preparar la imagen", pieza, color, e);
  }
  return new Response("Sin imagen.", { status: 404 });
}

/** Quita el fondo blanco y repinta la pieza en el color hex. Devuelve null si no se ve pieza. */
async function pintar(entrada: Buffer, hex: string, transparente: boolean): Promise<Buffer | null> {
  const { data, info } = await sharp(entrada)
    .resize(TAMANO, TAMANO, { fit: "contain", background: "#ffffff" })
    .flatten({ background: "#ffffff" })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  const n = w * h;

  // Fondo = píxeles casi blancos conectados con el borde (relleno desde fuera).
  const casiBlanco = (i: number) => data[i * 3] >= 238 && data[i * 3 + 1] >= 238 && data[i * 3 + 2] >= 238;
  const fondo = new Uint8Array(n);
  const pila: number[] = [];
  for (let x = 0; x < w; x++) pila.push(x, (h - 1) * w + x);
  for (let y = 0; y < h; y++) pila.push(y * w, y * w + w - 1);
  while (pila.length) {
    const i = pila.pop()!;
    if (fondo[i] || !casiBlanco(i)) continue;
    fondo[i] = 1;
    const x = i % w;
    if (x > 0) pila.push(i - 1);
    if (x < w - 1) pila.push(i + 1);
    if (i >= w) pila.push(i - w);
    if (i < n - w) pila.push(i + w);
  }

  // Brillo de cada píxel y brillo medio de la pieza (para saber qué es luz y qué es sombra).
  const luz = new Float32Array(n);
  let suma = 0;
  let cuenta = 0;
  for (let i = 0; i < n; i++) {
    luz[i] = (0.299 * data[i * 3] + 0.587 * data[i * 3 + 1] + 0.114 * data[i * 3 + 2]) / 255;
    if (!fondo[i]) {
      suma += luz[i];
      cuenta++;
    }
  }
  if (cuenta < n * 0.01) return null; // casi no hay pieza
  const media = Math.max(0.15, suma / cuenta);

  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const salida = Buffer.alloc(n * 4);
  for (let i = 0; i < n; i++) {
    if (fondo[i]) continue; // queda transparente
    const f = luz[i] / media;
    const tono = (c: number) =>
      f <= 1 ? Math.round(c * (0.25 + 0.75 * f)) : Math.round(c + (255 - c) * Math.min(1, (f - 1) * 0.8));
    salida[i * 4] = tono(r);
    salida[i * 4 + 1] = tono(g);
    salida[i * 4 + 2] = tono(b);
    salida[i * 4 + 3] = transparente ? 190 : 255;
  }
  return sharp(salida, { raw: { width: w, height: h, channels: 4 } }).png().toBuffer();
}
