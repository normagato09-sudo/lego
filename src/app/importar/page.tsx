import { Suspense } from "react";
import { connection } from "next/server";
import { CabeceraVolver } from "@/components/Cabecera";
import { leerEstado, type Estado } from "./acciones";
import { Importador } from "./Importador";

export const metadata = { title: "Importar catálogo · LEGO Inventario" };

async function Contenido() {
  await connection(); // siempre con datos al momento, nunca guardada de antes
  let estado: Estado | null = null;
  let error = "";
  try {
    estado = await leerEstado();
  } catch (e) {
    console.error("No se pudo leer el estado de la importación", e);
    error = "No se pudieron leer las tablas del catálogo. ¿Has ejecutado db/03-catalogo-rebrickable.sql en Neon?";
  }
  if (!estado) {
    return (
      <p role="alert" className="rounded-[10px] border border-brick bg-brick-soft p-3 text-sm text-brick">
        {error}
      </p>
    );
  }
  return <Importador inicial={estado} />;
}

export default function Page() {
  return (
    <div className="mx-auto min-h-screen w-full max-w-[390px]">
      <CabeceraVolver titulo="Importar catálogo" volverA="/cajas" />
      <div className="space-y-4 px-4 pt-4 pb-10">
        <p className="rounded-[10px] border border-line bg-card p-3 text-sm">
          Copia el catálogo de Rebrickable (categorías, colores y piezas con su foto) a tu base de datos. Se puede
          repetir sin problema: no borra nada, solo añade o actualiza.
        </p>
        <Suspense fallback={<p className="text-sm text-ink/60">Cargando…</p>}>
          <Contenido />
        </Suspense>
      </div>
    </div>
  );
}
