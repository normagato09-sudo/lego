"use client";

import Link from "next/link";
import { useActionState, useState, type ReactNode } from "react";
import { DibujoPieza } from "@/components/DibujoPieza";
import { COLORES, buscarColor, buscarPieza } from "@/lib/catalogo";
import { guardarPieza, type EstadoGuardar } from "../acciones";

const ELEGIDO = "border-brick bg-brick-soft";
const NORMAL = "border-line bg-card";

export function FormularioDetalles({ piezaId, ubicaciones }: { piezaId: string; ubicaciones: string[] }) {
  const pieza = buscarPieza(piezaId)!;
  const [colorId, setColorId] = useState("");
  const [cantidad, setCantidad] = useState(1);
  const [ubicacion, setUbicacion] = useState("");
  const [estado, accion, guardando] = useActionState<EstadoGuardar, FormData>(guardarPieza, {});

  const color = buscarColor(colorId);
  const codigo = ubicacion.trim();

  return (
    <form action={accion} className="space-y-6 px-4 pt-4 pb-32">
      <input type="hidden" name="pieza" value={pieza.id} />
      <input type="hidden" name="color" value={colorId} />

      {/* Resumen de la pieza elegida, pintada en su color */}
      <section className="flex items-center gap-3 rounded-[10px] border border-line bg-card p-3">
        <DibujoPieza dibujo={pieza.dibujo} color={color?.hex} transparente={color?.transparente} tamano={72} />
        <div className="min-w-0 flex-1">
          <p className="font-display text-xl font-bold leading-tight">{pieza.nombre}</p>
          <p className="text-sm text-ink/70">
            {color ? color.nombre : "Sin color"} · <span className="font-mono">{cantidad}</span>{" "}
            {cantidad === 1 ? "unidad" : "unidades"}
          </p>
        </div>
        <Link
          href={`/anadir?pieza=${pieza.id}`}
          className="flex h-11 items-center px-2 text-sm font-semibold text-brick underline underline-offset-2"
        >
          Cambiar
        </Link>
      </section>

      <section>
        <h2 className="font-display text-lg font-bold">¿De qué color es?</h2>
        <div className="mt-3 grid grid-cols-5 gap-2">
          <BotonColor
            nombre="Sin color"
            activo={colorId === ""}
            onClick={() => setColorId("")}
            bolita={<span className="h-8 w-8 rounded-full border-2 border-dashed border-ink/30" />}
          />
          {COLORES.map((c) => (
            <BotonColor
              key={c.id}
              nombre={c.nombre}
              activo={c.id === colorId}
              onClick={() => setColorId(c.id)}
              bolita={
                <span
                  className="h-8 w-8 rounded-full border border-ink/20"
                  style={{ backgroundColor: c.hex, opacity: c.transparente ? 0.7 : 1 }}
                />
              }
            />
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-display text-lg font-bold">¿Cuántas hay?</h2>
        <div className="mt-3 flex items-center gap-3">
          <button
            type="button"
            onClick={() => setCantidad((n) => Math.max(1, n - 1))}
            aria-label="Una menos"
            className="flex h-12 w-12 items-center justify-center rounded-[10px] border border-line bg-card text-2xl"
          >
            −
          </button>
          <input
            name="cantidad"
            type="number"
            inputMode="numeric"
            min={1}
            max={9999}
            value={cantidad}
            onChange={(e) => setCantidad(Math.max(1, Math.min(9999, Math.floor(Number(e.target.value) || 1))))}
            aria-label="Cantidad"
            className="h-12 w-24 rounded-[10px] border border-line bg-card text-center font-mono text-xl outline-none focus:border-brick"
          />
          <button
            type="button"
            onClick={() => setCantidad((n) => Math.min(9999, n + 1))}
            aria-label="Una más"
            className="flex h-12 w-12 items-center justify-center rounded-[10px] border border-line bg-card text-2xl"
          >
            +
          </button>
        </div>
      </section>

      <section>
        <h2 className="font-display text-lg font-bold">¿Dónde la guardas?</h2>
        <input
          name="ubicacion"
          value={ubicacion}
          onChange={(e) => setUbicacion(e.target.value.toUpperCase())}
          placeholder="C2-B03"
          autoCapitalize="characters"
          autoComplete="off"
          aria-label="Código de ubicación"
          className="mt-3 h-12 w-full rounded-[10px] border border-line bg-card px-4 font-mono text-lg uppercase outline-none focus:border-brick"
        />
        <div className="mt-3 flex flex-wrap gap-2">
          {ubicaciones.map((u) => (
            <button
              key={u}
              type="button"
              onClick={() => setUbicacion(u)}
              aria-pressed={codigo === u}
              className={`h-11 rounded-full border px-4 font-mono text-sm ${codigo === u ? ELEGIDO : NORMAL}`}
            >
              {u}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setUbicacion("")}
            aria-pressed={codigo === ""}
            className={`h-11 rounded-full border px-4 text-sm font-medium text-brick ${codigo === "" ? ELEGIDO : NORMAL}`}
          >
            Sin ordenar
          </button>
        </div>
      </section>

      {estado.error && (
        <p role="alert" className="rounded-[10px] border border-brick bg-brick-soft p-3 text-sm text-brick">
          {estado.error}
        </p>
      )}

      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-line bg-card">
        <div className="mx-auto w-full max-w-[390px] px-4 py-3">
          <button
            type="submit"
            disabled={guardando}
            className="h-14 w-full rounded-[10px] bg-brick text-lg font-semibold text-white disabled:opacity-60"
          >
            {guardando ? "Guardando…" : "Guardar pieza"}
          </button>
        </div>
      </div>
    </form>
  );
}

function BotonColor({
  nombre,
  activo,
  onClick,
  bolita,
}: {
  nombre: string;
  activo: boolean;
  onClick: () => void;
  bolita: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={activo}
      className={`flex min-h-[72px] flex-col items-center justify-center gap-1 rounded-[10px] border px-0.5 py-1.5 ${activo ? ELEGIDO : NORMAL}`}
    >
      {bolita}
      <span className="text-center text-[11px] leading-tight">{nombre}</span>
    </button>
  );
}
