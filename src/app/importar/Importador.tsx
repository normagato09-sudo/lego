"use client";

import { useState } from "react";
import { CATEGORIAS_RB } from "@/lib/rebrickable/categorias";
import { FORMAS } from "@/lib/catalogo";
import {
  importarCategoriasYColores,
  importarPaginaPiezas,
  leerEstado,
  type Estado,
} from "./acciones";

const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function Importador({ inicial }: { inicial: Estado }) {
  const [estado, setEstado] = useState(inicial);
  const [trabajando, setTrabajando] = useState(false);
  const [aviso, setAviso] = useState<{ texto: string; error: boolean }>();
  const [progreso, setProgreso] = useState("");
  const [todoDeNuevo, setTodoDeNuevo] = useState(false);

  const totalPiezas = Object.values(estado.piezasPorCategoria).reduce((s, n) => s + n, 0);
  const pendientes = CATEGORIAS_RB.filter((c) => !estado.piezasPorCategoria[c.id]).length;

  async function paso1() {
    setTrabajando(true);
    setAviso(undefined);
    const r = await importarCategoriasYColores();
    if (r.error) setAviso({ texto: r.error, error: true });
    else setAviso({ texto: `Listo: ${r.categorias} categorías y ${r.colores} colores.`, error: false });
    setEstado(await leerEstado());
    setTrabajando(false);
  }

  async function paso2() {
    setTrabajando(true);
    setAviso(undefined);
    let guardadas = 0;
    let saltadas = 0;
    const lista = CATEGORIAS_RB.filter((c) => todoDeNuevo || !estado.piezasPorCategoria[c.id]);
    for (const [i, cat] of lista.entries()) {
      let pagina: number | null = 1;
      while (pagina) {
        setProgreso(`Categoría ${i + 1} de ${lista.length}: ${cat.nombre} (${cat.nombre_en}), página ${pagina}…`);
        const r = await importarPaginaPiezas(cat.id, pagina);
        if (r.error) {
          setAviso({
            texto: `Se paró en «${cat.nombre}»: ${r.error}. Pulsa otra vez el botón para seguir desde ahí.`,
            error: true,
          });
          setEstado(await leerEstado());
          setProgreso("");
          setTrabajando(false);
          return;
        }
        guardadas += r.guardadas ?? 0;
        saltadas += r.saltadas ?? 0;
        pagina = r.siguiente ?? null;
        await esperar(1100); // Rebrickable pide como mucho ~1 petición por segundo.
      }
    }
    setEstado(await leerEstado());
    setProgreso("");
    setAviso({
      texto: `Terminado: ${guardadas} piezas guardadas (${saltadas} versiones impresas no se han guardado).`,
      error: false,
    });
    setTrabajando(false);
  }

  return (
    <div className="space-y-4">
      <section className="rounded-[10px] border border-line bg-card p-3">
        <h2 className="font-display text-lg font-bold">Ahora mismo hay</h2>
        <ul className="mt-1 space-y-0.5 text-sm">
          <li>
            <span className="font-mono">{estado.categorias}</span> categorías
          </li>
          <li>
            <span className="font-mono">{estado.colores}</span> colores
          </li>
          <li>
            <span className="font-mono">{totalPiezas}</span> piezas ({pendientes} categorías sin piezas todavía)
          </li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="font-display text-lg font-bold">1. Categorías y colores</h2>
        <button
          type="button"
          onClick={paso1}
          disabled={trabajando}
          className="h-12 w-full rounded-[10px] bg-brick font-semibold text-white disabled:opacity-60"
        >
          Importar categorías y colores
        </button>
      </section>

      <section className="space-y-2">
        <h2 className="font-display text-lg font-bold">2. Piezas con foto</h2>
        <p className="text-sm text-ink/70">Tarda unos minutos. Deja esta pantalla abierta hasta que termine.</p>
        <label className="flex min-h-11 items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={todoDeNuevo}
            onChange={(e) => setTodoDeNuevo(e.target.checked)}
            className="h-5 w-5 accent-[#c91a09]"
          />
          Volver a importar también las categorías que ya tienen piezas
        </label>
        <button
          type="button"
          onClick={paso2}
          disabled={trabajando || estado.categorias === 0}
          className="h-12 w-full rounded-[10px] bg-brick font-semibold text-white disabled:opacity-60"
        >
          {estado.categorias === 0 ? "Primero haz el paso 1" : "Importar piezas"}
        </button>
      </section>

      {progreso && (
        <p role="status" className="rounded-[10px] border border-line bg-card p-3 text-sm">
          {progreso}
        </p>
      )}
      {aviso && (
        <p
          role={aviso.error ? "alert" : "status"}
          className={`rounded-[10px] border p-3 text-sm ${aviso.error ? "border-brick bg-brick-soft text-brick" : "border-line bg-card"}`}
        >
          {aviso.texto}
        </p>
      )}

      <section className="rounded-[10px] border border-line bg-card p-3">
        <h2 className="font-display text-lg font-bold">Piezas por categoría</h2>
        {FORMAS.map((forma) => (
          <div key={forma.id} className="mt-2">
            <h3 className="text-sm font-semibold">{forma.nombre}</h3>
            <ul className="text-xs text-ink/70">
              {CATEGORIAS_RB.filter((c) => c.forma === forma.id).map((c) => (
                <li key={c.id} className="flex justify-between gap-2">
                  <span>
                    {c.nombre} <span className="text-ink/40">({c.nombre_en})</span>
                  </span>
                  <span className="font-mono">{estado.piezasPorCategoria[c.id] ?? 0}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>
    </div>
  );
}
