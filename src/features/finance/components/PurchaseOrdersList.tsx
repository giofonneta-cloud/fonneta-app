'use client';

import { useState, useEffect, useCallback } from 'react';
import { purchaseOrderService } from '../services/purchaseOrderService';
import type { PurchaseOrder, POStatus } from '../types/purchase-order.types';
import { PO_STATUS_LABELS, PO_STATUS_COLORS } from '../types/purchase-order.types';
import { Search, Eye, Pencil, Trash2, Plus, FileText } from 'lucide-react';

// ─── Helpers ────────────────────────────────────────────────────────────────

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value);

const formatDate = (dateStr: string) => {
  const [datePart] = dateStr.split('T');
  const [y, m, d] = datePart.split('-');
  return `${d}/${m}/${y}`;
};

// ─── Types ───────────────────────────────────────────────────────────────────

interface PurchaseOrdersListProps {
  onEdit: (po: PurchaseOrder) => void;
  onPreview: (po: PurchaseOrder) => void;
  onNewPO: () => void;
}

const STATUS_OPTIONS: Array<{ value: POStatus | 'all'; label: string }> = [
  { value: 'all', label: 'Todos' },
  { value: 'borrador', label: 'Borrador' },
  { value: 'enviada', label: 'Enviada' },
  { value: 'aceptada', label: 'Aceptada' },
  { value: 'completada', label: 'Completada' },
  { value: 'cancelada', label: 'Cancelada' },
];

// ─── Skeleton ────────────────────────────────────────────────────────────────

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

// ─── Empty State ─────────────────────────────────────────────────────────────

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <tr>
      <td colSpan={7} className="py-16 text-center">
        <FileText className="w-10 h-10 text-slate-200 mx-auto mb-3" />
        <p className="text-sm font-bold text-slate-400">
          {hasFilters
            ? 'No se encontraron órdenes de compra con esos filtros.'
            : 'Aún no hay órdenes de compra registradas.'}
        </p>
        {hasFilters && (
          <p className="text-xs text-slate-300 mt-1">
            Intenta cambiar el estado o el texto de búsqueda.
          </p>
        )}
      </td>
    </tr>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function PurchaseOrdersList({ onEdit, onPreview, onNewPO }: PurchaseOrdersListProps) {
  // State
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<POStatus | 'all'>('all');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Fetch
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const filters = {
        ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
        ...(search.trim() ? { search: search.trim() } : {}),
      };
      const data = await purchaseOrderService.getPurchaseOrders(filters);
      setOrders(data);
    } catch (err) {
      console.error('Error cargando órdenes de compra:', err);
      setError('No se pudieron cargar las órdenes de compra.');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Handlers
  const handleDelete = async (id: string) => {
    setDeleting(true);
    try {
      await purchaseOrderService.deletePurchaseOrder(id);
      setDeleteConfirm(null);
      await fetchOrders();
    } catch (err) {
      console.error('Error eliminando OC:', err);
      setError('No se pudo eliminar la orden de compra.');
    } finally {
      setDeleting(false);
    }
  };

  const hasFilters = search.trim().length > 0 || statusFilter !== 'all';

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-800">Órdenes de Compra</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Gestiona y rastrea tus órdenes de compra a proveedores
          </p>
        </div>
        <button
          onClick={onNewPO}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Nueva OC
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar por No. OC o proveedor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-colors placeholder:text-slate-300"
          />
        </div>

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as POStatus | 'all')}
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

      {/* Error Banner */}
      {error && (
        <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600 font-medium">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-[10px] text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-4 py-3 font-bold tracking-wider">No. OC</th>
              <th className="px-4 py-3 font-bold tracking-wider">Fecha</th>
              <th className="px-4 py-3 font-bold tracking-wider">Proveedor</th>
              <th className="px-4 py-3 font-bold tracking-wider">Descripcion</th>
              <th className="px-4 py-3 font-bold tracking-wider text-right">Total</th>
              <th className="px-4 py-3 font-bold tracking-wider text-center">Estado</th>
              <th className="px-4 py-3 font-bold tracking-wider text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <TableSkeleton />
            ) : orders.length === 0 ? (
              <EmptyState hasFilters={hasFilters} />
            ) : (
              orders.map((po) => {
                const isDraft = po.status === 'borrador';
                const canEdit = po.status === 'borrador' || po.status === 'enviada';
                const isConfirmingDelete = deleteConfirm === po.id;

                return (
                  <tr key={po.id} className="hover:bg-gray-50 transition-colors">
                    {/* No. OC */}
                    <td className="px-4 py-3.5 font-mono text-xs font-bold text-slate-700">
                      {po.po_number}
                    </td>

                    {/* Fecha */}
                    <td className="px-4 py-3.5 text-xs text-slate-500 whitespace-nowrap">
                      {formatDate(po.created_at)}
                    </td>

                    {/* Proveedor */}
                    <td className="px-4 py-3.5 text-xs text-slate-700 max-w-[180px]">
                      <span className="block truncate font-medium" title={po.provider_name ?? po.recipient_name}>
                        {po.provider_name ?? po.recipient_name}
                      </span>
                    </td>

                    {/* Descripcion */}
                    <td className="px-4 py-3.5 text-xs text-slate-500 max-w-[250px]">
                      <span className="block truncate" title={po.items_summary ?? po.description ?? ''}>
                        {po.items_summary ?? po.description ?? <span className="text-slate-300">—</span>}
                      </span>
                      {po.project_name && (
                        <span className="block text-[10px] text-slate-400 truncate mt-0.5" title={po.project_name}>
                          {po.project_name}
                        </span>
                      )}
                    </td>

                    {/* Total */}
                    <td className="px-4 py-3.5 text-right font-mono text-xs font-semibold text-slate-700 whitespace-nowrap">
                      {formatCurrency(po.total)}
                    </td>

                    {/* Estado */}
                    <td className="px-4 py-3.5 text-center">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold ${PO_STATUS_COLORS[po.status]}`}
                      >
                        {PO_STATUS_LABELS[po.status]}
                      </span>
                    </td>

                    {/* Acciones */}
                    <td className="px-4 py-3.5">
                      {isConfirmingDelete ? (
                        <div className="flex items-center gap-2 justify-center">
                          <span className="text-xs text-slate-500 whitespace-nowrap">
                            ¿Eliminar?
                          </span>
                          <button
                            onClick={() => handleDelete(po.id)}
                            disabled={deleting}
                            className="px-2.5 py-1 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors disabled:opacity-60"
                            aria-label="Confirmar eliminación"
                          >
                            {deleting ? 'Eliminando...' : 'Confirmar'}
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            disabled={deleting}
                            className="px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-md transition-colors disabled:opacity-60"
                            aria-label="Cancelar eliminación"
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 justify-center">
                          {/* Ver */}
                          <button
                            onClick={() => onPreview(po)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            title="Ver OC"
                            aria-label={`Ver orden de compra ${po.po_number}`}
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Editar — borrador y enviada */}
                          {canEdit && (
                            <button
                              onClick={() => onEdit(po)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                              title="Editar OC"
                              aria-label={`Editar orden de compra ${po.po_number}`}
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                          )}

                          {/* Eliminar — solo borrador */}
                          {isDraft && (
                            <button
                              onClick={() => setDeleteConfirm(po.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                              title="Eliminar OC"
                              aria-label={`Eliminar orden de compra ${po.po_number}`}
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

      {/* Footer count */}
      {!loading && orders.length > 0 && (
        <div className="flex items-center justify-between pt-1 text-xs text-slate-400">
          <span>
            {orders.length} orden{orders.length !== 1 ? 'es' : ''} de compra
          </span>
          <span className="font-semibold text-slate-600">
            Total:{' '}
            <span className="text-blue-600">
              {formatCurrency(orders.reduce((acc, po) => acc + po.total, 0))}
            </span>
          </span>
        </div>
      )}
    </div>
  );
}
