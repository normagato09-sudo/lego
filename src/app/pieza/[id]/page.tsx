import { Suspense } from "react";
import { notFound } from "next/navigation";
import { CabeceraVolver } from "@/components/Cabecera";
import { FormularioDetalles } from "@/components/FormularioDetalles";
import { coloresUsados, leerPieza, ubicacionesUsadas } from "@/lib/piezas";
import { leerPiezaRb } from "@/lib/rebrickable/piezas";
import { vistaDeFila, vistaDesdeRb, type PiezaVista } from "@/lib/vista";

export const metadata = { title: "Editar pieza · LEGO Inventario" };

async function Contenido({ params, searchParams }: PageProps<"/pieza/[id]">) {
  const { id: texto } = await params;
  const { rb } = await searchParams;
  if (!/^\d+$/.test(texto)) notFound();
  const id = Number(texto);

  const [fila, ubicaciones, misColores] = await Promise.all([
    leerPieza(id),
    ubicacionesUsadas(),
    coloresUsados(),
  ]);
  if (!fila) notFound();

  // Si se ha pulsado "Cambiar" y elegido otra pieza, llega en la dirección (?rb=...).
  let pieza: PiezaVista | undefined;
  if (typeof rb === "string" && rb) {
    const datos = await leerPiezaRb(rb);
    if (datos) pieza = vistaDesdeRb(datos);
  }
  pieza ??= vistaDeFila(fila);
  if (!pieza) notFound();

  return (
    <>
      <CabeceraVolver titulo="Editar pieza" volverA="/" />
      <FormularioDetalles
        pieza={pieza}
        ubicaciones={ubicaciones}
        misColores={misColores}
        editar={{ id: fila.id, color: fila.color, cantidad: fila.cantidad, ubicacion: fila.ubicacion }}
      />
    </>
  );
}

export default function Page(props: PageProps<"/pieza/[id]">) {
  return (
    <div className="mx-auto min-h-screen w-full max-w-[390px]">
      <Suspense fallback={<p className="px-4 pt-6 text-sm text-ink/60">Cargando…</p>}>
        <Contenido {...props} />
      </Suspense>
    </div>
  );
}
