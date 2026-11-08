import { connection } from "next/server";
import { leerPiezas } from "@/lib/piezas";
import { haySesion } from "@/lib/sesion";

/** Descarga una copia de todas las piezas en un archivo JSON. */
export async function GET() {
  await connection();
  if (!(await haySesion())) {
    return new Response("Hace falta la contraseña.", { status: 401 });
  }
  try {
    const filas = await leerPiezas();
    const hoy = new Date().toISOString().slice(0, 10);
    const copia = {
      app: "LEGO Inventario",
      version: 1,
      fecha: new Date().toISOString(),
      piezas: filas.map(({ pieza, color, cantidad, ubicacion, part_num }) => ({ pieza, color, cantidad, ubicacion, part_num })),
    };
    return new Response(JSON.stringify(copia, null, 2), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="lego-inventario-${hoy}.json"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    console.error("No se pudo crear la copia", e);
    return new Response("No se pudo crear la copia. Revisa la conexión e inténtalo otra vez.", {
      status: 500,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
}
