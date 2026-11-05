export const formatCOP = (value: number): string =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(Number(value) || 0);

export const formatDate = (value?: string | null): string => {
  if (!value) return '—';
  const [y, m, d] = value.split('T')[0].split('-');
  return `${d}/${m}/${y}`;
};

// Fecha local (Colombia), no UTC: toISOString() cambiaría de día en la noche.
export const todayISO = (): string => {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
};

// Los errores de Supabase son objetos con `message`, no siempre instancias de Error.
export const errorMessage = (error: unknown, fallback: string): string => {
  const message = (error as { message?: unknown } | null)?.message;
  return typeof message === 'string' && message ? message : fallback;
};

export const INPUT_CLASS =
  'w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-colors placeholder:text-slate-300 disabled:bg-slate-50 disabled:text-slate-400';

export const LABEL_CLASS = 'block text-xs font-bold text-slate-500 mb-1';
