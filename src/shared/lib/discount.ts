export type DescuentoTipo = 'porcentaje' | 'valor';

// Resuelve el descuento sobre una base: por porcentaje (0-100) o por valor fijo en COP.
// El descuento nunca supera la base (el neto no baja de 0).
export function calcDescuento(
  base: number,
  tipo: DescuentoTipo | undefined,
  porcentaje: number | undefined,
  valor: number | undefined
): { descuento: number; neto: number } {
  const b = Number(base) || 0;
  const raw = tipo === 'valor'
    ? Number(valor) || 0
    : b * ((Number(porcentaje) || 0) / 100);
  const descuento = Math.min(Math.max(raw, 0), Math.max(b, 0));
  return { descuento, neto: b - descuento };
}

// Etiqueta corta para mostrar el descuento (ej. "10%" o "$ 1.000.000").
export function descuentoLabel(
  tipo: DescuentoTipo | undefined,
  porcentaje: number | undefined,
  valor: number | undefined,
  fmt: (n: number) => string
): string | null {
  if (tipo === 'valor') return Number(valor) > 0 ? fmt(Number(valor)) : null;
  return Number(porcentaje) > 0 ? `${porcentaje}%` : null;
}
