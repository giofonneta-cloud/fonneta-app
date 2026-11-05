'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, ReceiptText, Search } from 'lucide-react';
import { useResizableColumns } from '@/shared/hooks/useResizableColumns';
import { legalizacionesService } from '../services/legalizacionesService';
import type { Legalizacion, LegalizacionStatus } from '../types/legalizacion.types';
import { LEGALIZACION_STATUS_COLORS, LEGALIZACION_STATUS_LABELS } from '../types/legalizacion.types';
import { errorMessage, formatCOP, formatDate } from './legalizacionFormat';

// [col]: Número | Fecha | Beneficiario | Motivo | Centro de costo | Total | Estado
const INITIAL_WIDTHS = [130, 105, 210, 260, 160, 130, 120];

const HEADERS = ['Número', 'Fecha', 'Beneficiario', 'Motivo', 'Centro de costo', 'Total', 'Estado'];

interface Props {
  canApprove: boolean;
  onNew: () => void;
  onOpen: (id: string) => void;
}

export function LegalizacionesList({ canApprove, onNew, onOpen }: Props) {
  const [items, setItems] = useState<Legalizacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<LegalizacionStatus | 'all'>('all');
  const { widths, startResize } = useResizableColumns(INITIAL_WIDTHS);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setItems(await legalizacionesService.getAll());
    } catch (err) {
      setError(errorMessage(err, 'No se pudieron cargar las legalizaciones.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const pendientes = useMemo(() => items.filter((l) => l.status === 'enviada').length, [items]);

  const visibles = useMemo(() => {
    const term = search.trim().toLowerCase();
    return items.filter((l) => {
      if (statusFilter !== 'all' && l.status !== statusFilter) return false;
      if (!term) return true;
      return [l.numero, l.beneficiario_nombre, l.motivo, l.cost_center]
        .some((value) => value?.toLowerCase().includes(term));
    });
  }, [items, search, statusFilter]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-800">Legalizaciones de gastos</h3>
          <p className="text-xs text-slate-400 mt-0.5">Viáticos y reintegros con sus soportes</p>
        </div>
        <button
          onClick={onNew}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-black text-white text-sm font-semibold rounded-lg transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Nueva legalización
        </button>
      </div>

      {canApprove && pendientes > 0 && (
        <button
          onClick={() => setStatusFilter('enviada')}
          className="w-full text-left px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-lg text-sm font-semibold text-amber-800 hover:bg-amber-100 transition-colors"
        >
          {pendientes === 1 ? 'Hay 1 legalización por aprobar' : `Hay ${pendientes} legalizaciones por aprobar`}
        </button>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar por número, beneficiario o motivo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-colors placeholder:text-slate-300"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as LegalizacionStatus | 'all')}
          className="px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-colors text-slate-700 min-w-[160px]"
          aria-label="Filtrar por estado"
        >
          <option value="all">Todos los estados</option>
          {(Object.keys(LEGALIZACION_STATUS_LABELS) as LegalizacionStatus[]).map((status) => (
            <option key={status} value={status}>{LEGALIZACION_STATUS_LABELS[status]}</option>
          ))}
        </select>
      </div>

      {error && <p className="px-4 py-2.5 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</p>}

      <div className="overflow-x-auto border border-slate-100 rounded-xl">
        <table className="text-sm" style={{ tableLayout: 'fixed', width: widths.reduce((a, b) => a + b, 0) }}>
          <colgroup>
            {widths.map((width, i) => <col key={i} style={{ width }} />)}
          </colgroup>
          <thead className="bg-slate-50">
            <tr>
              {HEADERS.map((header, i) => (
                <th key={header} className="relative select-none overflow-hidden px-4 py-3 text-left text-xs font-bold text-slate-500">
                  {header}
                  <div onMouseDown={startResize(i)} className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-blue-400" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && (
              <tr><td colSpan={HEADERS.length} className="py-12 text-center text-sm text-slate-400">Cargando...</td></tr>
            )}
            {!loading && visibles.length === 0 && (
              <tr>
                <td colSpan={HEADERS.length} className="py-14 text-center">
                  <ReceiptText className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                  <p className="text-sm font-bold text-slate-400">
                    {items.length === 0 ? 'Aún no hay legalizaciones registradas.' : 'No hay resultados con esos filtros.'}
                  </p>
                </td>
              </tr>
            )}
            {!loading && visibles.map((leg) => (
              <tr key={leg.id} onClick={() => onOpen(leg.id)} className="cursor-pointer hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 font-bold text-slate-800 overflow-hidden"><span className="block truncate">{leg.numero}</span></td>
                <td className="px-4 py-3 text-slate-500 overflow-hidden"><span className="block truncate">{formatDate(leg.fecha_reporte)}</span></td>
                <td className="px-4 py-3 text-slate-700 overflow-hidden"><span className="block truncate">{leg.beneficiario_nombre}</span></td>
                <td className="px-4 py-3 text-slate-500 overflow-hidden"><span className="block truncate">{leg.motivo || '—'}</span></td>
                <td className="px-4 py-3 text-slate-500 overflow-hidden"><span className="block truncate">{leg.cost_center || '—'}</span></td>
                <td className="px-4 py-3 font-semibold text-slate-800 overflow-hidden"><span className="block truncate">{formatCOP(leg.total_gastos)}</span></td>
                <td className="px-4 py-3">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${LEGALIZACION_STATUS_COLORS[leg.status]}`}>
                    {LEGALIZACION_STATUS_LABELS[leg.status]}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
