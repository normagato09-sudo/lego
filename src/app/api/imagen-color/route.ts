import sharp from "sharp";
import { haySesion } from "@/lib/sesion";

// Pinta una pieza de Rebrickable en cualquier color, para cuando Rebrickable
// no la tiene dibujada en ese color (porque LEGO nunca la fabricó así).
// 1. Coge la pieza en gris claro (o blanco).
// 2. Quita el fondo blanco (lo que toca los bordes de la imagen).
// 3. Repinta la pieza con tu color, manteniendo sus luces y sombras.
// Uso: /api/imagen-color?pieza=3028&hex=36AEBF&trans=0

const BASES = [
  { color: 71, luz: 0.64 }, // gris claro: se distingue bien del fondo blanco
  { color: 15, luz: 0.95 }, // blanco, si no hay gris
];
const TAMANO = 200;

export async function GET(request: Request) {
  if (!(await haySesion())) return new Response("Hace falta la contraseña.", { status: 401 });

  const parametros = new URL(request.url).searchParams;
  const pieza = parametros.get("pieza") ?? "";
  const hex = (parametros.get("hex") ?? "").toUpperCase();
  const transparente = parametros.get("trans") === "1";
  if (!/^[A-Za-z0-9._-]{1,40}$/.test(pieza) || !/^[0-9A-F]{6}$/.test(hex)) {
    return new Response("Datos no válidos.", { status: 400 });
  }

  for (const base of BASES) {
    const respuesta = await fetch(
      `https://cdn.rebrickable.com/media/parts/ldraw/${base.color}/${encodeURIComponent(pieza)}.png`,
      { headers: { "User-Agent": "lego-inventario/1.0" }, cache: "force-cache" },
    );
    if (!respuesta.ok) continue;
    try {
      const png = await pintar(Buffer.from(await respuesta.arrayBuffer()), hex, base.luz, transparente);
      return new Response(new Uint8Array(png), {
        headers: {
          "Content-Type": "image/png",
          // Se guarda en el móvil un mes para no pedirla cada vez.
          "Cache-Control": "private, max-age=2592000, immutable",
        },
      });
    } catch (e) {
      console.error("No se pudo pintar la pieza", pieza, e);
    }
  }
  return new Response("Sin imagen.", { status: 404 });
}

async function pintar(entrada: Buffer, hex: string, luzBase: number, transparente: boolean): Promise<Buffer> {
  const { data, info } = await sharp(entrada)
    .resize(TAMANO, TAMANO, { fit: "contain", background: "#ffffff" })
    .flatten({ background: "#ffffff" })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  const n = w * h;

  // Fondo = píxeles casi blancos conectados con el borde (relleno desde fuera).
  const casiBlanco = (i: number) => data[i * 3] >= 242 && data[i * 3 + 1] >= 242 && data[i * 3 + 2] >= 242;
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

  // Repintar: el brillo de cada píxel respecto al gris base decide cuánto
  // más claro u oscuro sale tu color en ese punto.
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const salida = Buffer.alloc(n * 4);
  for (let i = 0; i < n; i++) {
    if (fondo[i]) continue; // queda transparente
    const luz = (0.299 * data[i * 3] + 0.587 * data[i * 3 + 1] + 0.114 * data[i * 3 + 2]) / 255;
    const f = luz / luzBase;
    const tono = (c: number) =>
      f <= 1 ? Math.round(c * f) : Math.round(c + (255 - c) * Math.min(1, (f - 1) / (1 / luzBase - 1)));
    salida[i * 4] = tono(r);
    salida[i * 4 + 1] = tono(g);
    salida[i * 4 + 2] = tono(b);
    salida[i * 4 + 3] = transparente ? 190 : 255;
  }
  return sharp(salida, { raw: { width: w, height: h, channels: 4 } }).png().toBuffer();
}
