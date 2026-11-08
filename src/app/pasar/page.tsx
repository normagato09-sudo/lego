import { Suspense } from "react";
import { connection } from "next/server";
import { CabeceraVolver } from "@/components/Cabecera";
import { leerParaPasar, type FilaPasar } from "./acciones";
import { PasarPiezas } from "./PasarPiezas";

export const metadata = { title: "Pasar mis piezas · LEGO Inventario" };

async function Contenido() {
  await connection();
  let filas: FilaPasar[] | null = null;
  try {
    filas = await leerParaPasar();
  } catch (e) {
    console.error("No se pudo preparar el paso de piezas", e);
  }
  if (!filas) {
    return (
      <p role="alert" className="rounded-[10px] border border-brick bg-brick-soft p-3 text-sm text-brick">
        No se pudieron leer tus piezas. ¿Has ejecutado db/04-piezas-con-rebrickable.sql en Neon?
      </p>
    );
  }
  return <PasarPiezas filas={filas} />;
}

export default function Page() {
  return (
    <div className="mx-auto min-h-screen w-full max-w-[390px]">
      <CabeceraVolver titulo="Pasar mis piezas" volverA="/" />
      <div className="space-y-4 px-4 pt-4 pb-32">
        <p className="rounded-[10px] border border-line bg-card p-3 text-sm">
          Cada pieza tuya, con la pieza de Rebrickable que le corresponde. Mira la foto: si alguna no es la tuya,
          quítale la marca. No se borra nada: solo se apunta el número de Rebrickable al lado de cada pieza.
        </p>
        <Suspense fallback={<p className="text-sm text-ink/60">Cargando…</p>}>
          <Contenido />
        </Suspense>
      </div>
    </div>
  );
}
