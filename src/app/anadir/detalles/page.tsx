import { Suspense } from "react";
import { redirect } from "next/navigation";
import { CabeceraVolver } from "@/components/Cabecera";
import { buscarPieza } from "@/lib/catalogo";
import { getSql } from "@/lib/db";
import { ordenarUbicaciones } from "@/lib/ubicacion";
import { FormularioDetalles } from "./FormularioDetalles";

export const metadata = { title: "Color, cantidad y caja · LEGO Inventario" };

async function ubicacionesUsadas(): Promise<string[]> {
  try {
    const sql = getSql();
    const filas = (await sql`select distinct ubicacion from piezas where ubicacion is not null`) as {
      ubicacion: string;
    }[];
    return ordenarUbicaciones(filas.map((f) => f.ubicacion));
  } catch (e) {
    console.error("No se pudieron leer las ubicaciones", e);
    return [];
  }
}

async function Contenido({ searchParams }: { searchParams: PageProps<"/anadir/detalles">["searchParams"] }) {
  const { pieza: id } = await searchParams;
  const pieza = typeof id === "string" ? buscarPieza(id) : undefined;
  if (!pieza) redirect("/anadir");
  const ubicaciones = await ubicacionesUsadas();
  return <FormularioDetalles piezaId={pieza.id} ubicaciones={ubicaciones} />;
}

export default function Page(props: PageProps<"/anadir/detalles">) {
  return (
    <div className="mx-auto min-h-screen w-full max-w-[390px]">
      <CabeceraVolver titulo="Color, cantidad y caja" volverA="/anadir" />
      <Suspense fallback={<p className="px-4 pt-6 text-sm text-ink/60">Cargando…</p>}>
        <Contenido searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}
