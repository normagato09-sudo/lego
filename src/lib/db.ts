import "server-only";
import { neon } from "@neondatabase/serverless";

// Conexión a la base de datos Neon. La dirección (DATABASE_URL) la pone
// Vercel; nunca se envía al navegador porque este archivo solo corre en el servidor.
export function getSql() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("Falta DATABASE_URL: la base de datos no está configurada.");
  }
  return neon(url);
}
