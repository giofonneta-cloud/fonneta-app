'use client';

import { useState, useEffect, useCallback } from 'react';
import { ShoppingCart, ExternalLink, CheckCircle, Clock, XCircle, Eye, Download, Loader2 } from 'lucide-react';
import { providerService } from '../services/providerService';
import { useProviderProfile } from '../hooks/useProviderProfile';
import type { ProviderPurchaseOrder, ProviderPOStatus } from '../types/provider.types';

const STATUS_LABELS: Record<ProviderPOStatus, string> = {
  enviada: 'Pendiente de aceptación',
  aceptada: 'Aceptada',
  completada: 'Completada',
  cancelada: 'Cancelada',
};

const STATUS_COLORS: Record<ProviderPOStatus, string> = {
  enviada: 'bg-yellow-100 text-yellow-700',
  aceptada: 'bg-blue-100 text-blue-700',
  completada: 'bg-green-100 text-green-700',
  cancelada: 'bg-gray-100 text-gray-500',
};

const STATUS_ICONS: Record<ProviderPOStatus, React.ElementType> = {
  enviada: Clock,
  aceptada: CheckCircle,
  completada: CheckCircle,
  cancelada: XCircle,
};

const fmt = (n: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);

const fmtDate = (s: string) => {
  const [y, m, d] = s.substring(0, 10).split('-');
  return `${d}/${m}/${y}`;
};

export function ProviderPurchaseOrdersSection() {
  const { provider, isLoading: profileLoading } = useProviderProfile();
  const [orders, setOrders] = useState<ProviderPurchaseOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<ProviderPurchaseOrder | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [acceptError, setAcceptError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!provider?.id) return;
    try {
      setLoading(true);
      const data = await providerService.getProviderPurchaseOrders(provider.id);
      setOrders(data);
    } catch (e) {
      console.error('Error cargando órdenes de compra:', e);
    } finally {
      setLoading(false);
    }
  }, [provider?.id]);

  useEffect(() => { load(); }, [load]);

  const handleAccept = async (poId: string) => {
    setAccepting(true);
    setAcceptError(null);
    try {
      const res = await fetch('/api/purchase-orders/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ purchaseOrderId: poId }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || 'Error al aceptar la orden de compra');
      }
      await load();
      setSelected((prev) => prev ? { ...prev, status: 'aceptada' } : null);
    } catch (e) {
      setAcceptError(e instanceof Error ? e.message : 'Error al aceptar');
    } finally {
      setAccepting(false);
    }
  };

  if (profileLoading || loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-black text-gray-900">Órdenes de Compra</h2>
          <p className="text-sm text-gray-500 mt-1">Órdenes emitidas por Fonneta Comunicaciones S.A.S.</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <ShoppingCart className="w-4 h-4" />
          <span>{orders.length} {orders.length === 1 ? 'orden' : 'órdenes'}</span>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
          <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No hay órdenes de compra aún</p>
          <p className="text-sm text-gray-400 mt-1">Aquí aparecerán las OCs que Fonneta te envíe.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">No. OC</th>
                <th className="text-left px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Fecha</th>
                <th className="text-left px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Centro de costo</th>
                <th className="text-right px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Total</th>
                <th className="text-left px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="px-5 py-3.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {orders.map((po) => {
                const Icon = STATUS_ICONS[po.status];
                return (
                  <tr key={po.id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="px-5 py-4 font-bold text-blue-700">{po.po_number}</td>
                    <td className="px-5 py-4 text-gray-600">{fmtDate(po.created_at)}</td>
                    <td className="px-5 py-4 text-gray-500 hidden sm:table-cell">{po.cost_center ?? '—'}</td>
                    <td className="px-5 py-4 text-right font-mono font-semibold text-gray-900">{fmt(po.total)}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[po.status]}`}>
                        <Icon className="w-3.5 h-3.5" />
                        {STATUS_LABELS[po.status]}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => { setSelected(po); setAcceptError(null); }}
                        className="flex items-center gap-1.5 ml-auto text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Ver
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de detalle */}
      {selected && (
        <PODetailModal
          po={selected}
          accepting={accepting}
          acceptError={acceptError}
          onAccept={() => handleAccept(selected.id)}
          onClose={() => { setSelected(null); setAcceptError(null); }}
        />
      )}
    </div>
  );
}

// ─── Modal de Detalle ─────────────────────────────────────────────────────────

interface ModalProps {
  po: ProviderPurchaseOrder;
  accepting: boolean;
  acceptError: string | null;
  onAccept: () => void;
  onClose: () => void;
}

function PODetailModal({ po, accepting, acceptError, onAccept, onClose }: ModalProps) {
  const items = [...(po.purchase_order_items ?? [])].sort((a, b) => a.order_index - b.order_index);
  const Icon = STATUS_ICONS[po.status];

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div>
            <h3 className="text-lg font-black text-gray-900">Orden de Compra {po.po_number}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[po.status]}`}>
                <Icon className="w-3 h-3" />
                {STATUS_LABELS[po.status]}
              </span>
              <span className="text-sm text-gray-400">{fmtDate(po.created_at)}</span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors text-xl font-light leading-none">
            ×
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Emisor */}
          <div className="bg-blue-50 rounded-xl px-4 py-3">
            <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">Emitido por</p>
            <p className="font-bold text-gray-900 text-sm">Fonneta Comunicaciones S.A.S.</p>
            <p className="text-xs text-gray-500">NIT 901.362.051-7 · Carrera 6 #123A-74, Bogotá D.C.</p>
          </div>

          {/* Meta */}
          {(po.authorized_by || po.cost_center) && (
            <div className="grid grid-cols-2 gap-3 text-sm">
              {po.authorized_by && (
                <div>
                  <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Autorizado por</p>
                  <p className="font-medium text-gray-900">{po.authorized_by}</p>
                </div>
              )}
              {po.cost_center && (
                <div>
                  <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Centro de costo</p>
                  <p className="font-medium text-gray-900">{po.cost_center}</p>
                </div>
              )}
            </div>
          )}

          {po.description && (
            <div className="text-sm">
              <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1">Descripción</p>
              <p className="text-gray-700">{po.description}</p>
            </div>
          )}

          {/* Items */}
          <div>
            <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-2">Ítems</p>
            <div className="border border-gray-100 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left px-4 py-2.5 text-xs text-gray-500 font-bold uppercase">#</th>
                    <th className="text-left px-4 py-2.5 text-xs text-gray-500 font-bold uppercase">Descripción</th>
                    <th className="text-right px-4 py-2.5 text-xs text-gray-500 font-bold uppercase">Precio</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {items.map((item, idx) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3 text-gray-400">{idx + 1}</td>
                      <td className="px-4 py-3 text-gray-800 whitespace-pre-wrap">{item.descripcion}</td>
                      <td className="px-4 py-3 text-right font-mono font-semibold text-gray-900">{fmt(item.precio)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-60 space-y-1.5 text-sm">
              <div className="flex justify-between text-gray-500">
                <span>Subtotal</span>
                <span className="font-mono">{fmt(po.subtotal)}</span>
              </div>
              {po.iva_porcentaje > 0 && (
                <div className="flex justify-between text-gray-500">
                  <span>IVA ({po.iva_porcentaje}%)</span>
                  <span className="font-mono">{fmt(po.iva_valor)}</span>
                </div>
              )}
              {po.otros_impuestos > 0 && (
                <div className="flex justify-between text-gray-500">
                  <span>Otros impuestos</span>
                  <span className="font-mono">{fmt(po.otros_impuestos)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-black text-gray-900 pt-2 border-t-2 border-gray-200">
                <span>TOTAL</span>
                <span className="font-mono text-blue-700">{fmt(po.total)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl space-y-3">
          {acceptError && (
            <p className="text-sm text-red-600 font-medium">{acceptError}</p>
          )}
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-gray-600 border border-gray-200 rounded-xl hover:bg-white transition-colors"
            >
              Cerrar
            </button>
            <div className="flex gap-2">
              {po.document_url && (
                <a
                  href={po.document_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-gray-700 border border-gray-200 rounded-xl hover:bg-white transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Ver PDF
                  <ExternalLink className="w-3 h-3 opacity-50" />
                </a>
              )}
              {po.status === 'enviada' && (
                <button
                  onClick={onAccept}
                  disabled={accepting}
                  className="flex items-center gap-1.5 px-5 py-2 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {accepting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  {accepting ? 'Aceptando...' : 'Aceptar Orden de Compra'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
