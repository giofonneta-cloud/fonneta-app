'use client';

import { useState, useEffect } from 'react';
import { Venta } from '../types/sales-expenses.types';
import { salesService } from '../services/salesService';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';
import { useResizableColumns } from '@/shared/hooks/useResizableColumns';

// [col]: Cliente | Factura | Proyecto | C. Costo | Total Factura | Saldo por Cobrar | Fecha Cobro Est. | Vencimiento | Acción
const INITIAL_WIDTHS = [160, 120, 140, 110, 130, 130, 140, 110, 90];

const fmt = (n: number) =>
    n.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });

function isInPeriod(dateStr: string | undefined, periodStr: string): boolean {
    if (periodStr === 'all') return true;
    if (!dateStr) return false;
    const part = dateStr.split('T')[0];
    const [y, m] = part.split('-').map(Number);
    if (!y || !m) return false;
    if (periodStr.startsWith('2026-Q')) {
        if (y !== 2026) return false;
        const q = parseInt(periodStr.split('-Q')[1]);
        const start = (q - 1) * 3 + 1;
        return m >= start && m <= start + 2;
    }
    const [py, pm] = periodStr.split('-').map(Number);
    return y === py && m === pm;
}

function formatDate(d?: string) {
    if (!d) return '—';
    return new Date(d + 'T12:00:00').toLocaleDateString('es-CO', {
        day: '2-digit', month: 'short', year: 'numeric',
    });
}

function getDaysUntil(dateStr?: string): number | null {
    if (!dateStr) return null;
    const target = new Date(dateStr + 'T12:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function urgencyBadge(days: number | null, estadoPago: string) {
    if (estadoPago === 'pagado') {
        return (
            <Badge className="bg-emerald-100 text-emerald-700 border-none text-[10px] font-bold gap-1">
                <CheckCircle2 className="w-3 h-3" /> Cobrado
            </Badge>
        );
    }
    if (days === null) return <Badge className="bg-slate-100 text-slate-500 border-none text-[10px]">Sin fecha</Badge>;
    if (days < 0) return <Badge className="bg-red-100 text-red-700 border-none text-[10px] font-bold animate-pulse">Vencido {Math.abs(days)}d</Badge>;
    if (days === 0) return <Badge className="bg-orange-100 text-orange-700 border-none text-[10px] font-bold">Vence hoy</Badge>;
    if (days <= 7) return <Badge className="bg-amber-100 text-amber-700 border-none text-[10px] font-bold">Vence en {days}d</Badge>;
    return <Badge className="bg-slate-100 text-slate-500 border-none text-[10px] font-medium">{days}d restantes</Badge>;
}

interface Props {
    period: string;
    selectedProjects?: string[];
    selectedCostCenters?: string[];
    selectedEstado?: string[];
    onClientClick?: (clientId: string) => void;
}

export function CXCList({ period, selectedProjects, selectedCostCenters, selectedEstado, onClientClick }: Props) {
    const [sales, setSales] = useState<Venta[]>([]);
    const [loading, setLoading] = useState(true);
    const { widths, startResize } = useResizableColumns(INITIAL_WIDTHS);

    // Estado del modal de cobro
    const [confirmingId, setConfirmingId] = useState<string | null>(null);
    const [payAmount, setPayAmount] = useState('');
    const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0]);
    const [saving, setSaving] = useState(false);

    const loadData = () => {
        setLoading(true);
        salesService.getAllSales()
            .then(data => {
                const pending = data
                    .filter(s => {
                        const matchesPeriod = s.estado_pago !== 'pagado' && isInPeriod(s.fecha_cobro_estimada, period);
                        const matchesProject = !selectedProjects || selectedProjects.length === 0 || selectedProjects.includes(s.proyecto?.name ?? '');
                        const matchesCostCenter = !selectedCostCenters || selectedCostCenters.length === 0 || selectedCostCenters.includes(s.cost_center ?? '');
                        const matchesEstado = !selectedEstado || selectedEstado.length === 0 || selectedEstado.some(es => s.estado_pago === es.toLowerCase().replace(/ /g, '_'));
                        return matchesPeriod && matchesProject && matchesCostCenter && matchesEstado;
                    })
                    .sort((a, b) => {
                        const da = getDaysUntil(a.fecha_cobro_estimada) ?? 9999;
                        const db = getDaysUntil(b.fecha_cobro_estimada) ?? 9999;
                        return da - db;
                    });
                setSales(pending);
            })
            .catch(err => console.error('Error CXC', err))
            .finally(() => setLoading(false));
    };

    useEffect(() => { loadData(); }, [period, selectedProjects, selectedCostCenters, selectedEstado]);

    const thisWeek = sales.filter(s => {
        const d = getDaysUntil(s.fecha_cobro_estimada);
        return d !== null && d <= 7;
    });
    const overdue = sales.filter(s => {
        const d = getDaysUntil(s.fecha_cobro_estimada);
        return d !== null && d < 0;
    });

    const totalPendiente = sales.reduce((a, s) => a + (Number(s.total_con_iva) - Number(s.valor_pagado || 0)), 0);

    const confirmingSale = sales.find(s => s.id === confirmingId);
    const saldoPendiente = confirmingSale
        ? Number(confirmingSale.total_con_iva) - Number(confirmingSale.valor_pagado || 0)
        : 0;

    const openConfirmModal = (sale: Venta) => {
        const saldo = Number(sale.total_con_iva) - Number(sale.valor_pagado || 0);
        setConfirmingId(sale.id);
        setPayAmount(String(Math.round(saldo)));
        setPayDate(new Date().toISOString().split('T')[0]);
    };

    const handleConfirmCobro = async () => {
        if (!confirmingId) return;
        const amount = Number(payAmount);
        if (!amount || amount <= 0) { alert('Ingresa un valor válido'); return; }
        setSaving(true);
        try {
            await salesService.recordPayment(confirmingId, amount, payDate);
            setConfirmingId(null);
            loadData();
        } catch (err: unknown) {
            alert('Error al confirmar cobro: ' + (err instanceof Error ? err.message : String(err)));
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h3 className="text-base font-bold text-slate-800">Cuentas por Cobrar (CXC)</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                        Facturas de venta pendientes de cobro
                    </p>
                </div>
                <div className="flex gap-3">
                    <div className="text-center px-4 py-2 bg-amber-50 rounded-xl border border-amber-100">
                        <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Esta semana</p>
                        <p className="text-lg font-black text-amber-700">{thisWeek.length}</p>
                    </div>
                    <div className="text-center px-4 py-2 bg-red-50 rounded-xl border border-red-100">
                        <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">Vencidas</p>
                        <p className="text-lg font-black text-red-700">{overdue.length}</p>
                    </div>
                    <div className="text-center px-4 py-2 bg-slate-50 rounded-xl border border-slate-100">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total pendiente</p>
                        <p className="text-sm font-black text-slate-800">{fmt(totalPendiente)}</p>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-100">
                <table className="text-sm text-left" style={{ tableLayout: 'fixed', width: widths.reduce((a, b) => a + b, 0) }}>
                    <colgroup>
                        {widths.map((w, i) => <col key={i} style={{ width: w }} />)}
                    </colgroup>
                    <thead className="text-[10px] text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
                        <tr>
                            {(['Cliente', 'Factura', 'Proyecto', 'C. Costo', 'Total Factura', 'Saldo por Cobrar', 'Fecha Cobro Est.', 'Vencimiento', 'Acción'] as const).map((label, i) => (
                                <th
                                    key={i}
                                    className="px-4 py-3 font-black tracking-widest relative select-none overflow-hidden"
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
                    <tbody className="divide-y divide-slate-50">
                        {loading ? (
                            Array.from({ length: 4 }).map((_, i) => (
                                <tr key={i}>
                                    {Array.from({ length: 9 }).map((__, j) => (
                                        <td key={j} className="px-4 py-4">
                                            <div className="h-3 bg-slate-100 rounded animate-pulse" />
                                        </td>
                                    ))}
                                </tr>
                            ))
                        ) : sales.length === 0 ? (
                            <tr>
                                <td colSpan={9} className="py-16 text-center">
                                    <CheckCircle2 className="w-10 h-10 text-emerald-200 mx-auto mb-3" />
                                    <p className="text-sm font-bold text-slate-400">¡Todo cobrado! No hay cuentas por cobrar pendientes.</p>
                                </td>
                            </tr>
                        ) : (
                            sales.map(s => {
                                const days = getDaysUntil(s.fecha_cobro_estimada);
                                const saldo = Number(s.total_con_iva) - Number(s.valor_pagado || 0);
                                const isUrgent = days !== null && days <= 7;
                                const isOverdue = days !== null && days < 0;
                                return (
                                    <tr
                                        key={s.id}
                                        className={`transition-colors ${
                                            isOverdue ? 'bg-red-50/40 hover:bg-red-50' :
                                            isUrgent ? 'bg-amber-50/30 hover:bg-amber-50/60' :
                                            'hover:bg-slate-50/60'
                                        }`}
                                    >
                                        <td className="px-4 py-3.5 font-semibold text-xs overflow-hidden">
                                            {s.cliente?.id && onClientClick ? (
                                                <button
                                                    onClick={() => onClientClick?.(s.cliente!.id)}
                                                    className="block truncate text-blue-600 hover:underline hover:text-blue-700 transition-colors"
                                                    title={s.cliente?.business_name ?? ''}
                                                >
                                                    {s.cliente?.business_name || 'Sin cliente'}
                                                </button>
                                            ) : (
                                                <span className="block truncate" title={s.cliente?.business_name ?? ''}>
                                                    {s.cliente?.business_name || 'Sin cliente'}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3.5 font-mono text-xs font-bold text-slate-700 overflow-hidden">
                                            <span className="block truncate">{s.numero_factura || '—'}</span>
                                        </td>
                                        <td className="px-4 py-3.5 text-xs text-slate-500 overflow-hidden">
                                            <span className="block truncate" title={s.proyecto?.name ?? ''}>
                                                {s.proyecto?.name || '—'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3.5 text-xs text-slate-700 font-medium overflow-hidden">
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 capitalize">
                                                {s.cost_center || '—'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3.5 text-right font-mono text-xs text-slate-600 overflow-hidden">
                                            <span className="block truncate">{fmt(Number(s.total_con_iva))}</span>
                                        </td>
                                        <td className="px-4 py-3.5 text-right font-mono text-xs font-black text-emerald-600 overflow-hidden">
                                            <span className="block truncate">{fmt(saldo)}</span>
                                        </td>
                                        <td className="px-4 py-3.5 text-xs text-slate-500 font-medium overflow-hidden">
                                            <span className="block truncate">{formatDate(s.fecha_cobro_estimada)}</span>
                                        </td>
                                        <td className="px-4 py-3.5 text-center">
                                            {urgencyBadge(days, s.estado_pago)}
                                        </td>
                                        <td className="px-4 py-3.5 text-center">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => openConfirmModal(s)}
                                                className="h-7 px-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 text-[10px] font-bold gap-1"
                                            >
                                                <CheckCircle2 className="w-3 h-3" />
                                                Cobrado
                                            </Button>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {!loading && sales.length > 0 && (
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-400">
                    <span>{sales.length} factura{sales.length !== 1 ? 's' : ''} por cobrar</span>
                    <span className="font-black text-slate-700">
                        Total pendiente: <span className="text-emerald-600">{fmt(totalPendiente)}</span>
                    </span>
                </div>
            )}

            {/* Modal Confirmar Cobro */}
            {confirmingId && confirmingSale && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <h4 className="font-black text-slate-800 text-base">Confirmar Cobro</h4>
                            <button onClick={() => setConfirmingId(null)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="bg-slate-50 rounded-xl p-3 space-y-1 text-xs">
                            <p className="text-slate-500">Cliente: <span className="font-bold text-slate-800">{confirmingSale.cliente?.business_name}</span></p>
                            <p className="text-slate-500">Factura: <span className="font-bold text-slate-800">{confirmingSale.numero_factura || '—'}</span></p>
                            <p className="text-slate-500">Saldo por cobrar: <span className="font-black text-emerald-600">{fmt(saldoPendiente)}</span></p>
                        </div>
                        <div className="space-y-3">
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Valor Recibido (COP)</label>
                                <Input
                                    type="number"
                                    value={payAmount}
                                    onChange={e => setPayAmount(e.target.value)}
                                    placeholder="0"
                                    className="mt-1"
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Fecha de Cobro</label>
                                <Input
                                    type="date"
                                    value={payDate}
                                    onChange={e => setPayDate(e.target.value)}
                                    className="mt-1"
                                />
                            </div>
                        </div>
                        <div className="flex gap-2 pt-2">
                            <Button variant="outline" onClick={() => setConfirmingId(null)} className="flex-1">
                                Cancelar
                            </Button>
                            <Button
                                onClick={handleConfirmCobro}
                                disabled={saving}
                                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                            >
                                {saving ? 'Guardando...' : 'Confirmar Cobro'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
