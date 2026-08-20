'use client';

import { useState, useEffect, useCallback } from 'react';
import { quotesService } from '../services/quotesService';
import type { Quote, QuoteStatus } from '../types/quote.types';
import { QUOTE_STATUS_LABELS, QUOTE_STATUS_COLORS } from '../types/quote.types';
import { Search, Eye, Pencil, Trash2, Plus, FileSignature, CheckCircle2, XCircle } from 'lucide-react';
import { useResizableColumns } from '@/shared/hooks/useResizableColumns';

// [col]: No. Cotización | Fecha | Cliente | Descripcion | Total | Estado | Acciones
const INITIAL_WIDTHS = [130, 110, 200, 240, 130, 110, 140];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value);

const formatDate = (dateStr: string) => {
  const [datePart] = dateStr.split('T');
  const [y, m, d] = datePart.split('-');
  return `${d}/${m}/${y}`;
};

interface QuotesListProps {
  onEdit: (quote: Quote) => void;
  onPreview: (quote: Quote) => void;
  onNewQuote: () => void;
}

const STATUS_OPTIONS: Array<{ value: QuoteStatus | 'all'; label: string }> = [
  { value: 'all', label: 'Todos' },
  { value: 'borrador', label: 'Borrador' },
  { value: 'enviada', label: 'Enviada' },
  { value: 'aceptada', label: 'Aceptada' },
  { value: 'rechazada', label: 'Rechazada' },
];

function TableSkeleton() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <tr key={i}>
          {Array.from({ length: 7 }).map((__, j) => (
            <td key={j} className="px-4 py-4">
              <div className="h-3 bg-slate-100 rounded animate-pulse" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <tr>
      <td colSpan={7} className="py-16 text-center">
        <FileSignature className="w-10 h-10 text-slate-200 mx-auto mb-3" />
        <p className="text-sm font-bold text-slate-400">
          {hasFilters ? 'No se encontraron cotizaciones con esos filtros.' : 'Aún no hay cotizaciones registradas.'}
        </p>
        {hasFilters && <p className="text-xs text-slate-300 mt-1">Intenta cambiar el estado o el texto de búsqueda.</p>}
      </td>
    </tr>
  );
}

export function QuotesList({ onEdit, onPreview, onNewQuote }: QuotesListProps) {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const { widths, startResize } = useResizableColumns(INITIAL_WIDTHS);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<QuoteStatus | 'all'>('all');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchQuotes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const filters = {
        ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
        ...(search.trim() ? { search: search.trim() } : {}),
      };
      const data = await quotesService.getQuotes(filters);
      setQuotes(data);
    } catch (err) {
      console.error('Error cargando cotizaciones:', err);
      setError('No se pudieron cargar las cotizaciones.');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    fetchQuotes();
  }, [fetchQuotes]);

  const handleDelete = async (id: string) => {
    setDeleting(true);
    try {
      await quotesService.deleteQuote(id);
      setDeleteConfirm(null);
      await fetchQuotes();
    } catch (err) {
      console.error('Error eliminando cotización:', err);
      setError('No se pudo eliminar la cotización.');
    } finally {
      setDeleting(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: QuoteStatus) => {
    setUpdatingId(id);
    try {
      await quotesService.updateStatus(id, status);
      await fetchQuotes();
    } catch (err) {
      console.error('Error actualizando estado:', err);
      setError('No se pudo actualizar el estado.');
    } finally {
      setUpdatingId(null);
    }
  };

  const hasFilters = search.trim().length > 0 || statusFilter !== 'all';

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-800">Cotizaciones</h3>
          <p className="text-xs text-slate-400 mt-0.5">Propuestas comerciales para clientes y prospectos</p>
        </div>
        <button
          onClick={onNewQuote}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-black text-white text-sm font-semibold rounded-lg transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Nueva Cotización
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar por No. cotización o cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-colors placeholder:text-slate-300"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as QuoteStatus | 'all')}
          className="px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-colors text-slate-700 min-w-[150px]"
          aria-label="Filtrar por estado"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600 font-medium">{error}</div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-x-auto">
        <table className="text-sm text-left" style={{ tableLayout: 'fixed', width: widths.reduce((a, b) => a + b, 0) }}>
          <colgroup>
            {widths.map((w, i) => <col key={i} style={{ width: w }} />)}
          </colgroup>
          <thead className="text-[10px] text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
            <tr>
              {(['No. Cotización', 'Fecha', 'Cliente', 'Descripción', 'Total', 'Estado', 'Acciones'] as const).map((label, i) => (
                <th
                  key={i}
                  className="px-4 py-3 font-bold tracking-wider relative select-none overflow-hidden"
                  style={{ width: widths[i] }}
                >
                  <span className="block truncate">{label}</span>
                  <div
                    onMouseDown={startResize(i)}
                    className="absolute right-0 top-0 h-full w-1.5 cursor-col-resize hover:bg-blue-400 transition-colors z-10"
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <TableSkeleton />
            ) : quotes.length === 0 ? (
              <EmptyState hasFilters={hasFilters} />
            ) : (
              quotes.map((quote) => {
                const isDraft = quote.status === 'borrador';
                const canEdit = quote.status === 'borrador' || quote.status === 'enviada';
                const isConfirmingDelete = deleteConfirm === quote.id;

                return (
                  <tr key={quote.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3.5 font-mono text-xs font-bold text-slate-700 overflow-hidden">
                      <span className="block truncate">{quote.quote_number}</span>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-500 overflow-hidden">
                      <span className="block truncate">{formatDate(quote.created_at)}</span>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-700 overflow-hidden">
                      <span className="block truncate font-medium" title={quote.client_registered_name ?? quote.client_name}>
                        {quote.client_registered_name ?? quote.client_name}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-500 overflow-hidden">
                      <span className="block truncate" title={quote.items_summary ?? ''}>
                        {quote.items_summary ?? <span className="text-slate-300">—</span>}
                      </span>
                      {quote.project_name && (
                        <span className="block text-[10px] text-slate-400 truncate mt-0.5" title={quote.project_name}>
                          {quote.project_name}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono text-xs font-semibold text-slate-700 overflow-hidden">
                      <span className="block truncate">{formatCurrency(quote.total)}</span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${QUOTE_STATUS_COLORS[quote.status]}`}>
                        {QUOTE_STATUS_LABELS[quote.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      {isConfirmingDelete ? (
                        <div className="flex items-center gap-2 justify-center">
                          <span className="text-xs text-slate-500 whitespace-nowrap">¿Eliminar?</span>
                          <button
                            onClick={() => handleDelete(quote.id)}
                            disabled={deleting}
                            className="px-2.5 py-1 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors disabled:opacity-60"
                          >
                            {deleting ? 'Eliminando...' : 'Confirmar'}
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            disabled={deleting}
                            className="px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-md transition-colors disabled:opacity-60"
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 justify-center">
                          <button
                            onClick={() => onPreview(quote)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            title="Ver cotización"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {canEdit && (
                            <button
                              onClick={() => onEdit(quote)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                              title="Editar cotización"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                          )}
                          {quote.status === 'enviada' && (
                            <>
                              <button
                                onClick={() => handleUpdateStatus(quote.id, 'aceptada')}
                                disabled={updatingId === quote.id}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors disabled:opacity-50"
                                title="Marcar como aceptada"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(quote.id, 'rechazada')}
                                disabled={updatingId === quote.id}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                                title="Marcar como rechazada"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          {isDraft && (
                            <button
                              onClick={() => setDeleteConfirm(quote.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                              title="Eliminar cotización"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {!loading && quotes.length > 0 && (
        <div className="flex items-center justify-between pt-1 text-xs text-slate-400">
          <span>{quotes.length} cotización{quotes.length !== 1 ? 'es' : ''}</span>
          <span className="font-semibold text-slate-600">
            Total: <span className="text-gray-900">{formatCurrency(quotes.reduce((acc, q) => acc + q.total, 0))}</span>
          </span>
        </div>
      )}
    </div>
  );
}
