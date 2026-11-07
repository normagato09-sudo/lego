import { Suspense } from "react";
import { redirect } from "next/navigation";
import { CabeceraVolver } from "@/components/Cabecera";
import { FormularioDetalles } from "@/components/FormularioDetalles";
import { buscarPieza } from "@/lib/catalogo";
import { ubicacionesUsadas } from "@/lib/piezas";

export const metadata = { title: "Color, cantidad y caja · LEGO Inventario" };

async function Contenido({ searchParams }: { searchParams: PageProps<"/anadir/detalles">["searchParams"] }) {
  const { pieza: id } = await searchParams;
  const pieza = typeof id === "string" ? buscarPieza(id) : undefined;
  if (!pieza) redirect("/anadir");
  const ubicaciones = await ubicacionesUsadas();
  return (
    <>
      <CabeceraVolver titulo="Color, cantidad y caja" volverA={`/anadir?pieza=${pieza.id}`} />
      <FormularioDetalles piezaId={pieza.id} ubicaciones={ubicaciones} />
    </>
  );
}

export default function Page(props: PageProps<"/anadir/detalles">) {
  return (
    <div className="mx-auto min-h-screen w-full max-w-[390px]">
      <Suspense fallback={<p className="px-4 pt-6 text-sm text-ink/60">Cargando…</p>}>
        <Contenido searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}
