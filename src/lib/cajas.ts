import type { FilaPieza } from "@/lib/piezas";

export type Bolsa = {
  codigo: string;
  tipos: number;
  piezas: number;
  /** La pieza de la que hay más unidades, para enseñarla en la tarjeta. */
  principal: FilaPieza;
};

export type Caja = {
  codigo: string;
  nombre: string;
  tipos: number;
  piezas: number;
  bolsas: Bolsa[];
};

const ordenNatural = (a: string, b: string) => a.localeCompare(b, "es", { numeric: true });

/** "C2" → "Caja 2"; cualquier otro código se deja tal cual. */
function nombreCaja(codigo: string): string {
  const n = /^C(\d+)$/.exec(codigo);
  return n ? `Caja ${Number(n[1])}` : codigo;
}

/**
 * Agrupa las piezas por caja y bolsa. La caja es lo que va antes del
 * primer guion: C2-B03 → caja C2, bolsa C2-B03.
 */
export function agruparPorCajas(filas: FilaPieza[]) {
  const sinOrdenar = filas.filter((f) => !f.ubicacion);
  const porBolsa = new Map<string, FilaPieza[]>();
  for (const f of filas) {
    if (!f.ubicacion) continue;
    porBolsa.set(f.ubicacion, [...(porBolsa.get(f.ubicacion) ?? []), f]);
  }

  const porCaja = new Map<string, Bolsa[]>();
  for (const [codigo, lista] of porBolsa) {
    const bolsa: Bolsa = {
      codigo,
      tipos: lista.length,
      piezas: lista.reduce((s, f) => s + f.cantidad, 0),
      principal: lista.reduce((a, b) => (b.cantidad > a.cantidad ? b : a)),
    };
    const caja = codigo.split("-")[0];
    porCaja.set(caja, [...(porCaja.get(caja) ?? []), bolsa]);
  }

  const cajas: Caja[] = [...porCaja.entries()]
    .sort(([a], [b]) => ordenNatural(a, b))
    .map(([codigo, bolsas]) => ({
      codigo,
      nombre: nombreCaja(codigo),
      tipos: bolsas.reduce((s, b) => s + b.tipos, 0),
      piezas: bolsas.reduce((s, b) => s + b.piezas, 0),
      bolsas: bolsas.sort((a, b) => ordenNatural(a.codigo, b.codigo)),
    }));

  return {
    sinOrdenar: {
      tipos: sinOrdenar.length,
      piezas: sinOrdenar.reduce((s, f) => s + f.cantidad, 0),
    },
    cajas,
  };
}
