import { Suspense } from "react";
import { redirect } from "next/navigation";
import { CabeceraVolver } from "@/components/Cabecera";
import { FormularioDetalles } from "@/components/FormularioDetalles";
import { coloresUsados, ubicacionesUsadas } from "@/lib/piezas";
import { leerPiezaRb } from "@/lib/rebrickable/piezas";
import { exigirSesion } from "@/lib/sesion";
import { vistaDesdeRb } from "@/lib/vista";

export const metadata = { title: "Color, cantidad y caja · LEGO Inventario" };

async function Contenido({ searchParams }: { searchParams: PageProps<"/anadir/detalles">["searchParams"] }) {
  await exigirSesion();
  const { rb } = await searchParams;
  const datos = typeof rb === "string" && rb ? await leerPiezaRb(rb) : undefined;
  if (!datos) redirect("/anadir");
  const pieza = vistaDesdeRb(datos);
  const [ubicaciones, misColores] = await Promise.all([ubicacionesUsadas(), coloresUsados()]);
  return (
    <>
      <CabeceraVolver titulo="Color, cantidad y caja" volverA={`/anadir?rb=${encodeURIComponent(datos.part_num)}`} />
      <FormularioDetalles pieza={pieza} ubicaciones={ubicaciones} misColores={misColores} />
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
