import { Suspense } from "react";
import { CabeceraVolver } from "@/components/Cabecera";
import { buscarPiezasRb, leerPiezaRb } from "@/lib/rebrickable/piezas";
import { exigirSesion } from "@/lib/sesion";
import type { DatosRb } from "@/lib/vista";
import { ElegirPieza } from "./ElegirPieza";
import { grupoDeCategoria } from "./grupos";

export const metadata = { title: "¿Qué pieza es? · LEGO Inventario" };

async function Contenido({ searchParams }: { searchParams: PageProps<"/anadir">["searchParams"] }) {
  await exigirSesion();
  const { rb, editar } = await searchParams;
  // "editar" llega cuando se cambia la pieza de una que ya estaba guardada.
  const editarId = typeof editar === "string" && /^\d+$/.test(editar) ? Number(editar) : undefined;

  // Si llega una pieza ya elegida (botón "Cambiar"), se abre su grupo con ella marcada.
  let inicial: DatosRb | undefined;
  let resultados: { piezas: DatosRb[]; hayMas: boolean } | undefined;
  if (typeof rb === "string" && rb) {
    try {
      inicial = await leerPiezaRb(rb);
      const grupo = inicial && grupoDeCategoria(inicial.forma, inicial.categoria);
      if (grupo) resultados = await buscarPiezasRb(grupo.ids, "", 1);
    } catch (e) {
      console.error("No se pudo cargar la pieza elegida", e);
    }
  }

  return (
    <>
      <CabeceraVolver titulo="¿Qué pieza es?" volverA={editarId ? `/pieza/${editarId}` : "/"} />
      <ElegirPieza inicial={inicial} resultadosIniciales={resultados} editarId={editarId} />
    </>
  );
}

export default function Page(props: PageProps<"/anadir">) {
  return (
    <div className="mx-auto min-h-screen w-full max-w-[390px]">
      <Suspense>
        <Contenido searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}
