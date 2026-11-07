import { Suspense } from "react";
import { CabeceraVolver } from "@/components/Cabecera";
import { ElegirPieza } from "./ElegirPieza";

export const metadata = { title: "¿Qué pieza es? · LEGO Inventario" };

async function Contenido({ searchParams }: { searchParams: PageProps<"/anadir">["searchParams"] }) {
  const { pieza, editar } = await searchParams;
  // "editar" llega cuando se cambia la pieza de una que ya estaba guardada.
  const editarId = typeof editar === "string" && /^\d+$/.test(editar) ? Number(editar) : undefined;
  return (
    <>
      <CabeceraVolver titulo="¿Qué pieza es?" volverA={editarId ? `/pieza/${editarId}` : "/"} />
      <ElegirPieza piezaInicial={typeof pieza === "string" ? pieza : undefined} editarId={editarId} />
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
