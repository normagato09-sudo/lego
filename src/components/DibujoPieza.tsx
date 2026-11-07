import type { ReactNode } from "react";
import type { Dibujo, Silueta } from "@/lib/catalogo";

// Dibuja una pieza en SVG a partir de su tamaño.
// 1 tetón = 1 cuadrado de 10 unidades.

const U = 10; // tamaño de un tetón
const PAD = 2; // margen alrededor del dibujo
const COLOR_POR_DEFECTO = "#CFCCC4"; // cuando aún no hay color elegido

/** Oscurece (cantidad > 0) o aclara (cantidad < 0) un color hex. */
function tono(hex: string, cantidad: number): string {
  const n = parseInt(hex.replace("#", ""), 16);
  const canal = (v: number) => {
    const r = cantidad >= 0 ? v * (1 - cantidad) : v + (255 - v) * -cantidad;
    return Math.max(0, Math.min(255, Math.round(r)));
  };
  const r = canal((n >> 16) & 255);
  const g = canal((n >> 8) & 255);
  const b = canal(n & 255);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

type Pintura = { relleno: string; lado: string; borde: string; opacidad: number };

function pintura(hex: string | undefined, transparente: boolean): Pintura {
  const base = hex ?? COLOR_POR_DEFECTO;
  // Los colores muy oscuros necesitan un borde más claro para que se vea.
  const n = parseInt(base.replace("#", ""), 16);
  const brillo = ((n >> 16) & 255) * 0.3 + ((n >> 8) & 255) * 0.59 + (n & 255) * 0.11;
  return {
    relleno: base,
    lado: tono(base, 0.22),
    borde: brillo < 60 ? tono(base, -0.35) : tono(base, 0.45),
    opacidad: transparente ? 0.6 : 1,
  };
}

type Props = {
  dibujo: Dibujo;
  /** Color hex de la pieza; si falta, se pinta en gris neutro. */
  color?: string;
  transparente?: boolean;
  /** Tamaño máximo del dibujo en píxeles (ancho y alto). */
  tamano?: number;
  className?: string;
};

export function DibujoPieza({ dibujo, color, transparente = false, tamano = 56, className }: Props) {
  const p = pintura(color, transparente);
  const { ancho, alto, contenido } = dibujar(dibujo, p);
  // Las piezas pequeñas no se agrandan de más: así se comparan bien los tamaños.
  const escala = Math.min(tamano / ancho, tamano / alto, tamano / 30);
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center ${className ?? ""}`}
      style={{ width: tamano, height: tamano }}
    >
    <svg
      viewBox={`0 0 ${ancho} ${alto}`}
      width={ancho * escala}
      height={alto * escala}
      aria-hidden="true"
    >
      <g
        fillOpacity={p.opacidad}
        stroke={p.borde}
        strokeWidth={0.8}
        strokeLinejoin="round"
      >
        {contenido}
      </g>
    </svg>
    </span>
  );
}

type Resultado = { ancho: number; alto: number; contenido: ReactNode };

function dibujar(d: Dibujo, p: Pintura): Resultado {
  switch (d.tipo) {
    case "arriba":
      return desdeArriba(d, p);
    case "arco":
      return arco(d.largo, p);
    case "rampa":
      return conFondo(d.ancho, p, rampa(d.largo, !!d.reves, p));
    case "curva":
      return conFondo(d.ancho, p, curva(d.largo));
    case "viga":
      return viga(d.agujeros, p);
    case "eje":
      return eje(d.largo, p);
    case "pin":
      return pin(d.largo, p);
    case "silueta":
      return silueta(d.nombre, p);
  }
}

// ---------- Vista desde arriba ----------

function Teton({ cx, cy, p }: { cx: number; cy: number; p: Pintura }) {
  return (
    <>
      <circle cx={cx} cy={cy + 0.6} r={3.2} fill={p.lado} />
      <circle cx={cx} cy={cy} r={3.2} fill={p.relleno} />
    </>
  );
}

function desdeArriba(
  d: Extract<Dibujo, { tipo: "arriba" }>,
  p: Pintura,
): Resultado {
  const cols = Math.max(d.ancho, d.largo);
  const filas = Math.min(d.ancho, d.largo);
  const w = cols * U;
  const h = filas * U;
  const lado = d.grosor === "alta" ? 6 : 3; // grosor del canto frontal
  const tetones: [number, number][] = [];

  let cara: ReactNode;
  let canto: ReactNode;

  if (d.figura === "rect") {
    canto = <rect x={0} y={lado} width={w} height={h} rx={1.5} fill={p.lado} />;
    cara = <rect x={0} y={0} width={w} height={h} rx={1.5} fill={p.relleno} />;
    for (let f = 0; f < filas; f++) for (let c = 0; c < cols; c++) tetones.push([c, f]);
  } else if (d.figura === "redonda") {
    const r = w / 2;
    canto = (
      <>
        <circle cx={r} cy={r + lado} r={r} fill={p.lado} />
        <rect x={0} y={r} width={w} height={lado} fill={p.lado} stroke="none" />
      </>
    );
    cara = <circle cx={r} cy={r} r={r} fill={p.relleno} />;
    for (let f = 0; f < cols; f++)
      for (let c = 0; c < cols; c++) {
        const dist = Math.hypot((c + 0.5) * U - r, (f + 0.5) * U - r);
        if (dist <= r - 0.25 * U) tetones.push([c, f]);
      }
  } else if (d.figura === "L") {
    const forma = `M0,0 H${U} V${h - U} H${w} V${h} H0 Z`;
    canto = <rect x={0} y={h - U + lado} width={w} height={U} rx={1} fill={p.lado} />;
    cara = <path d={forma} fill={p.relleno} />;
    for (let f = 0; f < filas; f++)
      for (let c = 0; c < cols; c++) if (c === 0 || f === filas - 1) tetones.push([c, f]);
  } else {
    // Cuarto de círculo con la esquina abajo a la izquierda.
    const forma = `M0,${h} V0 A${w},${h} 0 0 1 ${w},${h} Z`;
    canto = <rect x={0} y={h - U + lado} width={w} height={U} fill={p.lado} />;
    cara = <path d={forma} fill={p.relleno} />;
    for (let f = 0; f < filas; f++)
      for (let c = 0; c < cols; c++) {
        const dist = Math.hypot((c + 0.5) * U, h - (f + 0.5) * U);
        if (dist <= w - 0.25 * U) tetones.push([c, f]);
      }
  }

  return {
    ancho: w + PAD * 2,
    alto: h + lado + PAD * 2,
    contenido: (
      <g transform={`translate(${PAD} ${PAD})`}>
        {canto}
        {cara}
        {d.tetones &&
          tetones.map(([c, f]) => (
            <Teton key={`${c}-${f}`} cx={(c + 0.5) * U} cy={(f + 0.5) * U} p={p} />
          ))}
      </g>
    ),
  };
}

// ---------- Vistas de lado ----------

const ALTO = 12; // altura de una pieza alta vista de lado
const TETON_ALTO = 2.4;

function TetonLado({ x, p }: { x: number; p: Pintura }) {
  return <rect x={x - 3} y={-TETON_ALTO} width={6} height={TETON_ALTO + 0.4} fill={p.relleno} />;
}

function arco(largo: number, p: Pintura): Resultado {
  const w = largo * U;
  const rx = ((largo - 2) * U) / 2;
  const forma = `M0,${ALTO} V0 H${w} V${ALTO} H${w - U} A${rx},${ALTO - 3} 0 0 0 ${U},${ALTO} Z`;
  return {
    ancho: w + PAD * 2,
    alto: ALTO + TETON_ALTO + PAD * 2,
    contenido: (
      <g transform={`translate(${PAD} ${PAD + TETON_ALTO})`}>
        {Array.from({ length: largo }, (_, i) => (
          <TetonLado key={i} x={(i + 0.5) * U} p={p} />
        ))}
        <path d={forma} fill={p.relleno} />
      </g>
    ),
  };
}

type Lado = { w: number; capa: (relleno: string) => ReactNode };

function rampa(largo: number, reves: boolean, p: Pintura): Lado {
  const w = largo * U;
  if (reves) {
    const forma = `M0,0 H${w} V2.5 L${U},${ALTO} H0 Z`;
    return {
      w,
      capa: (relleno) => (
        <>
          {Array.from({ length: largo }, (_, i) => (
            <TetonLado key={i} x={(i + 0.5) * U} p={{ ...p, relleno }} />
          ))}
          <path d={forma} fill={relleno} />
        </>
      ),
    };
  }
  const forma = `M0,${ALTO} V0 H${U} L${w},${ALTO - 2.5} V${ALTO} Z`;
  return {
    w,
    capa: (relleno) => (
      <>
        <TetonLado x={U / 2} p={{ ...p, relleno }} />
        <path d={forma} fill={relleno} />
      </>
    ),
  };
}

function curva(largo: number): Lado {
  const w = largo * U;
  const forma = `M0,${ALTO} V0 Q${w - 0.3 * U},0 ${w},${ALTO - 2} V${ALTO} Z`;
  return { w, capa: (relleno) => <path d={forma} fill={relleno} /> };
}

/** Si la pieza tiene 2 de ancho, dibuja una copia detrás para dar fondo. */
function conFondo(ancho: number, p: Pintura, lado: Lado): Resultado {
  const desplaza = ancho > 1 ? 3.5 : 0;
  return {
    ancho: lado.w + desplaza + PAD * 2,
    alto: ALTO + TETON_ALTO + desplaza + PAD * 2,
    contenido: (
      <g transform={`translate(${PAD} ${PAD + TETON_ALTO + desplaza})`}>
        {desplaza > 0 && (
          <g transform={`translate(${desplaza} ${-desplaza})`}>{lado.capa(p.lado)}</g>
        )}
        {lado.capa(p.relleno)}
      </g>
    ),
  };
}

function viga(agujeros: number, p: Pintura): Resultado {
  const w = agujeros * U;
  return {
    ancho: w + PAD * 2,
    alto: U + PAD * 2,
    contenido: (
      <g transform={`translate(${PAD} ${PAD})`}>
        <rect x={0} y={0} width={w} height={U} rx={U / 2} fill={p.relleno} />
        {Array.from({ length: agujeros }, (_, i) => (
          <circle key={i} cx={(i + 0.5) * U} cy={U / 2} r={2.8} fill="#ffffff" fillOpacity={1} />
        ))}
      </g>
    ),
  };
}

function eje(largo: number, p: Pintura): Resultado {
  const w = largo * U;
  const h = 4.5;
  return {
    ancho: w + PAD * 2,
    alto: h + PAD * 2,
    contenido: (
      <g transform={`translate(${PAD} ${PAD})`}>
        <rect x={0} y={0} width={w} height={h} rx={1} fill={p.relleno} />
        <line x1={1.5} y1={h / 2} x2={w - 1.5} y2={h / 2} />
      </g>
    ),
  };
}

function pin(largo: boolean, p: Pintura): Resultado {
  const izq = U; // parte izquierda (1 tetón)
  const der = largo ? 2 * U : U;
  const collar = 2;
  const w = izq + collar + der;
  const h = 7;
  return {
    ancho: w + PAD * 2,
    alto: h + 2 + PAD * 2,
    contenido: (
      <g transform={`translate(${PAD} ${PAD + 1})`}>
        <rect x={0} y={0} width={izq} height={h} rx={1.5} fill={p.relleno} />
        <rect x={izq + collar} y={0} width={der} height={h} rx={1.5} fill={p.relleno} />
        <rect x={izq} y={-1} width={collar} height={h + 2} fill={p.lado} />
        <line x1={1} y1={h / 2} x2={izq * 0.45} y2={h / 2} />
        <line x1={w - 1} y1={h / 2} x2={w - der * 0.45} y2={h / 2} />
      </g>
    ),
  };
}

// ---------- Siluetas (muñecos y piezas raras) ----------

function silueta(nombre: Silueta, p: Pintura): Resultado {
  const f = p.relleno;
  const l = p.lado;
  const claro = "#ffffff";
  const formas: Record<Silueta, ReactNode> = {
    cabeza: (
      <>
        <rect x={15} y={3} width={10} height={5} rx={1} fill={f} />
        <rect x={9} y={7} width={22} height={22} rx={6} fill={f} />
        <rect x={14} y={29} width={12} height={5} fill={l} />
      </>
    ),
    cuerpo: (
      <>
        <rect x={16} y={3} width={8} height={4} fill={l} />
        <path d="M11 7 H29 L33 34 H7 Z" fill={f} />
        <path d="M11 8 L4 28 L8 30 L13 14 Z" fill={l} />
        <path d="M29 8 L36 28 L32 30 L27 14 Z" fill={l} />
      </>
    ),
    piernas: (
      <>
        <rect x={7} y={5} width={26} height={8} rx={1} fill={f} />
        <rect x={7} y={13} width={12} height={22} rx={1} fill={f} />
        <rect x={21} y={13} width={12} height={22} rx={1} fill={f} />
      </>
    ),
    pelo: <path d="M7 30 C6 12 13 6 20 6 C27 6 34 12 33 30 H27 V20 C24 16 16 16 13 20 V30 Z" fill={f} />,
    casco: (
      <>
        <path d="M6 28 A14 14 0 0 1 34 28 Z" fill={f} />
        <rect x={5} y={27} width={30} height={5} rx={1} fill={l} />
      </>
    ),
    sombrero: (
      <>
        <rect x={11} y={9} width={18} height={19} rx={3} fill={f} />
        <ellipse cx={20} cy={29} rx={18} ry={4.5} fill={l} />
      </>
    ),
    espada: (
      <>
        <path d="M18.5 3 L20 1 L21.5 3 L22 26 H18 Z" fill={f} />
        <rect x={12} y={26} width={16} height={3} rx={1} fill={l} />
        <rect x={18.5} y={29} width={3} height={7} fill={l} />
        <circle cx={20} cy={37} r={2} fill={l} />
      </>
    ),
    escudo: (
      <>
        <path d="M8 5 H32 V18 C32 28 26 33 20 37 C14 33 8 28 8 18 Z" fill={f} />
        <path d="M13 10 H27 V18 C27 24 24 27 20 30 C16 27 13 24 13 18 Z" fill={l} />
      </>
    ),
    taza: (
      <>
        <path d="M27 15 H31 A4 4 0 0 1 35 19 V23 A4 4 0 0 1 31 27 H27" fill="none" strokeWidth={3} stroke={l} />
        <rect x={9} y={9} width={19} height={24} rx={2} fill={f} />
        <ellipse cx={18.5} cy={9} rx={9.5} ry={2} fill={l} />
      </>
    ),
    herramienta: (
      <>
        <rect x={18} y={13} width={4} height={24} rx={2} fill={f} />
        <path d="M11 3 H17 V9 H23 V3 H29 V11 C29 14 26 15 23 15 H17 C14 15 11 14 11 11 Z" fill={f} />
      </>
    ),
    ventana: (
      <>
        <rect x={6} y={5} width={28} height={30} rx={1} fill={f} />
        <rect x={9.5} y={8.5} width={9.5} height={11} fill={claro} fillOpacity={0.8} />
        <rect x={21} y={8.5} width={9.5} height={11} fill={claro} fillOpacity={0.8} />
        <rect x={9.5} y={21.5} width={9.5} height={10} fill={claro} fillOpacity={0.8} />
        <rect x={21} y={21.5} width={9.5} height={10} fill={claro} fillOpacity={0.8} />
      </>
    ),
    puerta: (
      <>
        <rect x={10} y={2} width={20} height={36} rx={1} fill={f} />
        <rect x={13} y={5} width={14} height={13} rx={1} fill={l} />
        <rect x={13} y={21} width={14} height={14} rx={1} fill={l} />
        <circle cx={26} cy={20} r={1.6} fill={claro} />
      </>
    ),
    rueda: (
      <>
        <circle cx={20} cy={20} r={17} fill={tono(f, 0.55)} />
        <circle cx={20} cy={20} r={9} fill={f} />
        <circle cx={20} cy={20} r={3} fill={l} />
      </>
    ),
    bolita: (
      <>
        <circle cx={20} cy={21} r={12} fill={f} />
        <circle cx={16} cy={17} r={3} fill={claro} fillOpacity={0.5} stroke="none" />
      </>
    ),
    planta: (
      <>
        <rect x={18.5} y={14} width={3} height={22} fill={l} />
        <path d="M20 20 C12 22 5 16 4 8 C12 8 18 12 20 20 Z" fill={f} />
        <path d="M20 16 C26 16 33 10 35 3 C27 3 21 8 20 16 Z" fill={f} />
        <path d="M20 28 C26 28 32 24 35 18 C28 17 22 21 20 28 Z" fill={f} />
        <rect x={13} y={34} width={14} height={4} rx={1} fill={l} />
      </>
    ),
    gema: (
      <>
        <path d="M20 37 L5 15 L12 5 H28 L35 15 Z" fill={f} />
        <path d="M5 15 H35 M12 5 L16 15 L20 37 M28 5 L24 15 L20 37 M16 15 L20 5 L24 15" fill="none" />
      </>
    ),
    valla: (
      <>
        <rect x={3} y={13} width={34} height={4} fill={l} />
        <rect x={3} y={25} width={34} height={4} fill={l} />
        <rect x={5} y={6} width={5} height={30} rx={1} fill={f} />
        <rect x={17.5} y={6} width={5} height={30} rx={1} fill={f} />
        <rect x={30} y={6} width={5} height={30} rx={1} fill={f} />
      </>
    ),
    otra: (
      <>
        <rect x={6} y={6} width={28} height={28} rx={4} fill={f} strokeDasharray="3 2" />
        <path d="M15.5 16 C15.5 9.5 25 9.5 25 15.5 C25 19 20 19.5 20 23.5" fill="none" strokeWidth={2.6} strokeLinecap="round" />
        <circle cx={20} cy={28.5} r={1.7} fill={p.borde} />
      </>
    ),
  };
  return { ancho: 40, alto: 40, contenido: formas[nombre] };
}
