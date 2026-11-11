import { connection } from "next/server";

// Versión publicada ahora mismo en Vercel (el commit de GitHub).
// En local no existe la variable y devuelve null (así no sale ningún aviso).
export async function GET() {
  await connection(); // siempre la de este momento, nunca una guardada
  return Response.json(
    { version: process.env.VERCEL_GIT_COMMIT_SHA ?? null },
    { headers: { "Cache-Control": "no-store" } },
  );
}
