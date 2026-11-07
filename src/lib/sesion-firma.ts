// Firma de la sesión. La contraseña vive en Vercel (variable APP_PASSWORD),
// nunca en el código. La cookie guarda una firma hecha con esa contraseña:
// si algún día cambias la contraseña, todas las sesiones antiguas dejan de valer.

export const COOKIE_SESION = "lego_sesion";
export const UN_ANO_EN_SEGUNDOS = 60 * 60 * 24 * 365;

const codificar = (texto: string) => new TextEncoder().encode(texto);
const hex = (datos: ArrayBuffer) =>
  [...new Uint8Array(datos)].map((b) => b.toString(16).padStart(2, "0")).join("");

/** Valor que se guarda en la cookie (HMAC-SHA256 con la contraseña como clave). */
export async function firmaSesion(contrasena: string): Promise<string> {
  const clave = await crypto.subtle.importKey(
    "raw",
    codificar(contrasena),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return hex(await crypto.subtle.sign("HMAC", clave, codificar("lego-inventario-sesion-v1")));
}

/** Resumen SHA-256, para comparar contraseñas sin dar pistas por el tiempo. */
export async function resumen(texto: string): Promise<string> {
  return hex(await crypto.subtle.digest("SHA-256", codificar(texto)));
}

/** Compara dos textos tardando lo mismo aunque se parezcan. */
export function iguales(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diferencia = 0;
  for (let i = 0; i < a.length; i++) diferencia |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diferencia === 0;
}

/** ¿Es válida la cookie de sesión? Sin contraseña configurada, nunca. */
export async function sesionValida(valor: string | undefined): Promise<boolean> {
  const contrasena = process.env.APP_PASSWORD;
  if (!contrasena || !valor) return false;
  return iguales(valor, await firmaSesion(contrasena));
}
