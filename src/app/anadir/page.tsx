import { Suspense } from "react";
import { CabeceraVolver } from "@/components/Cabecera";
import { ElegirPieza } from "./ElegirPieza";

export const metadata = { title: "¿Qué pieza es? · LEGO Inventario" };

async function Contenido({ searchParams }: { searchParams: PageProps<"/anadir">["searchParams"] }) {
  const { pieza } = await searchParams;
  return <ElegirPieza piezaInicial={typeof pieza === "string" ? pieza : undefined} />;
}

export default function Page(props: PageProps<"/anadir">) {
  return (
    <div className="mx-auto min-h-screen w-full max-w-[390px]">
      <CabeceraVolver titulo="¿Qué pieza es?" volverA="/" />
      <Suspense>
        <Contenido searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}
