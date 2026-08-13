'use client';

import { useState, useEffect } from 'react';
import { Venta } from '../types/sales-expenses.types';
import { salesService } from '../services/salesService';
import { Input } from '@/shared/components/ui/input';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Search, AlertCircle, CheckCircle2, Clock, X, BadgeCheck } from 'lucide-react';
import { useResizableColumns } from '@/shared/hooks/useResizableColumns';

// [col]: Comercial | Factura | Cliente | Proyecto | Valor Venta | % Com. | Valor Comisión | Estado Venta | Comisión | Acción
const INITIAL_WIDTHS = [150, 110, 160, 150, 130, 80, 140, 110, 120, 120];

const fmt = (n: number) =>
    n.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });

function formatDate(d?: string) {
    if (!d) return '—';
    return new Date(d + 'T12:00:00').toLocaleDateString('es-CO', {
        day: '2-digit', month: 'short', year: 'numeric',
    });
}

function ventaEstadoBadge(estado: string) {
    if (estado === 'pagado')
        return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-none text-[10px] font-bold">Cobrada</Badge>;
    if (estado === 'parcial')
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-none text-[10px] font-bold">Parcial</Badge>;
    return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200 border-none text-[10px] font-bold">Pendiente</Badge>;
}

function getYearMonth(dateStr: string): { year: number; month: number } | null {
    if (!dateStr) return null;
    const part = dateStr.split('T')[0];
    const [y, m] = part.split('-').map(Number);
    if (!y || !m) return null;
    return { year: y, month: m };
}

function isInPeriod(dateStr: string, periodStr?: string): boolean {
    if (!periodStr || periodStr === 'all') return true;
    const ym = getYearMonth(dateStr);
    if (!ym) return false;
    const { year, month } = ym;

    if (periodStr.startsWith('2026-Q')) {
        if (year !== 2026) return false;
        const q = parseInt(periodStr.split('-Q')[1]);
        const start = (q - 1) * 3 + 1;
        return month >= start && month <= start + 2;
    }
    const [py, pm] = periodStr.split('-').map(Number);
    return year === py && month === pm;
}

interface Props {
    period?: string;
    selectedProjects?: string[];
    selectedCostCenters?: string[];
    selectedComerciales?: string[];
    onClientClick?: (clientId: string) => void;
}

export function CommissionsList({ period, selectedProjects, selectedCostCenters, selectedComerciales, onClientClick }: Props) {
    const [sales, setSales] = useState<Venta[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const { widths, startResize } = useResizableColumns(INITIAL_WIDTHS);

    // Modal marcar pagada
    const [payingId, setPayingId] = useState<string | null>(null);
    const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0]);
    const [saving, setSaving] = useState(false);

    const loadData = () => {
        setLoading(true);
        salesService.getAllSales()
            .then(data => {
                // Solo ventas con comisión asignada
                const withCommission = data.filter(
                    s => !s.nota_credito && Number(s.valor_comision) > 0
                );
                setSales(withCommission);
            })
            .catch(err => console.error('Error loading commissions', err))
            .finally(() => setLoading(false));
    };

    useEffect(() => { loadData(); }, []);

    const q = search.trim().toLowerCase();
    const filtered = sales.filter(s => {
        const matchesSearch = !q ||
            (s.comercial?.nombre ?? '').toLowerCase().includes(q) ||
            (s.cliente?.business_name ?? '').toLowerCase().includes(q) ||
            (s.proyecto?.name ?? '').toLowerCase().includes(q) ||
            (s.numero_factura ?? '').toLowerCase().includes(q);
        const matchesPeriod = isInPeriod(s.fecha_factura || s.created_at, period);
        const matchesProject = !selectedProjects || selectedProjects.length === 0 || selectedProjects.includes(s.proyecto?.name ?? '');
        const matchesCostCenter = !selectedCostCenters || selectedCostCenters.length === 0 || selectedCostCenters.includes(s.cost_center ?? '');
        const matchesComercial = !selectedComerciales || selectedComerciales.length === 0 || selectedComerciales.includes(s.comercial?.nombre ?? '');
        return matchesSearch && matchesPeriod && matchesProject && matchesCostCenter && matchesComercial;
    });

    const totalComisiones = filtered.reduce((a, s) => a + (Number(s.valor_comision) || 0), 0);
    const totalPagadas = filtered.filter(s => s.comision_pagada).reduce((a, s) => a + (Number(s.valor_comision) || 0), 0);
    const totalPendientes = totalComisiones - totalPagadas;
    const countPendientes = filtered.filter(s => !s.comision_pagada).length;

    const payingSale = sales.find(s => s.id === payingId);

    const openPayModal = (sale: Venta) => {
        setPayingId(sale.id);
        setPayDate(new Date().toISOString().split('T')[0]);
    };

    const handleConfirmPago = async () => {
        if (!payingId) return;
        setSaving(true);
        try {
            await salesService.setCommissionPaid(payingId, true, payDate);
            setPayingId(null);
            loadData();
        } catch (err: unknown) {
            alert('Error al marcar comisión pagada: ' + (err instanceof Error ? err.message : String(err)));
        } finally {
            setSaving(false);
        }
    };

    const handleMarkPending = async (sale: Venta) => {
        try {
            await salesService.setCommissionPaid(sale.id, false);
            loadData();
        } catch (err: unknown) {
            alert('Error al marcar comisión pendiente: ' + (err instanceof Error ? err.message : String(err)));
        }
    };

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h3 className="text-base font-bold text-slate-800">Comisiones de Comerciales</h3>
                    <p className="text-xs text-slate-400 font-medium mt-0.5">
                        {loading ? 'Cargando...' : `${filtered.length} comisión${filtered.length !== 1 ? 'es' : ''} generada${filtered.length !== 1 ? 's' : ''}`}
                    </p>
                </div>
                <div className="flex gap-3 items-center">
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                            placeholder="Buscar comercial, cliente, factura..."
                            className="pl-9 bg-slate-50 border-slate-200 text-sm h-9"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="text-center px-4 py-2 bg-amber-50 rounded-xl border border-amber-100">
                        <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Pendientes</p>
                        <p className="text-sm font-black text-amber-700">{fmt(totalPendientes)}</p>
                    </div>
                    <div className="text-center px-4 py-2 bg-emerald-50 rounded-xl border border-emerald-100">
                        <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Pagadas</p>
                        <p className="text-sm font-black text-emerald-700">{fmt(totalPagadas)}</p>
                    </div>
                    <div className="text-center px-4 py-2 bg-slate-50 rounded-xl border border-slate-100">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total</p>
                        <p className="text-sm font-black text-slate-800">{fmt(totalComisiones)}</p>
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
                            {(['Comercial', 'Factura', 'Cliente', 'Proyecto', 'Valor Venta', '% Com.', 'Valor Comisión', 'Estado Venta', 'Comisión', 'Acción'] as const).map((label, i) => (
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
                            Array.from({ length: 5 }).map((_, i) => (
                                <tr key={i}>
                                    {Array.from({ length: 10 }).map((__, j) => (
                                        <td key={j} className="px-4 py-4">
                                            <div className="h-3 bg-slate-100 rounded animate-pulse w-full" />
                                        </td>
                                    ))}
                                </tr>
                            ))
                        ) : filtered.length === 0 ? (
                            <tr>
                                <td colSpan={10} className="py-16 text-center">
                                    <AlertCircle className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                                    <p className="text-sm text-slate-400 font-medium">
                                        {q ? 'Sin resultados para tu búsqueda' : 'No hay comisiones generadas'}
                                    </p>
                                </td>
                            </tr>
                        ) : (
                            filtered.map(sale => (
                                <tr key={sale.id} className="hover:bg-slate-50/60 transition-colors">
                                    <td className="px-4 py-3.5 font-semibold text-xs text-slate-700 overflow-hidden">
                                        <span className="block truncate" title={sale.comercial?.nombre ?? ''}>
                                            {sale.comercial?.nombre || 'Sin comercial'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3.5 font-mono text-slate-700 text-xs font-bold overflow-hidden">
                                        <span className="block truncate">{sale.numero_factura || '—'}</span>
                                    </td>
                                    <td className="px-4 py-3.5 text-xs overflow-hidden">
                                        {sale.cliente?.id && onClientClick ? (
                                            <button
                                                onClick={() => onClientClick(sale.cliente!.id)}
                                                className="block truncate text-blue-600 hover:underline hover:text-blue-700 transition-colors"
                                                title={sale.cliente?.business_name ?? ''}
                                            >
                                                {sale.cliente?.business_name || 'Sin cliente'}
                                            </button>
                                        ) : (
                                            <span className="block truncate text-slate-600" title={sale.cliente?.business_name ?? ''}>
                                                {sale.cliente?.business_name || 'Sin cliente'}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3.5 text-slate-600 text-xs overflow-hidden">
                                        <span className="block truncate" title={sale.proyecto?.name ?? ''}>
                                            {sale.proyecto?.name || '—'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3.5 text-right font-mono text-slate-600 text-xs overflow-hidden">
                                        <span className="block truncate">{fmt(Number(sale.valor_venta_neto) || 0)}</span>
                                    </td>
                                    <td className="px-4 py-3.5 text-center font-mono text-slate-500 text-xs overflow-hidden">
                                        <span className="block truncate">{Number(sale.porcentaje_comision) || 0}%</span>
                                    </td>
                                    <td className="px-4 py-3.5 text-right font-mono font-bold text-orange-600 text-xs overflow-hidden">
                                        <span className="block truncate">{fmt(Number(sale.valor_comision) || 0)}</span>
                                    </td>
                                    <td className="px-4 py-3.5 text-center">
                                        {ventaEstadoBadge(sale.estado_pago)}
                                    </td>
                                    <td className="px-4 py-3.5 text-center">
                                        {sale.comision_pagada ? (
                                            <div className="flex flex-col items-center gap-0.5">
                                                <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-none text-[10px] font-bold gap-1">
                                                    <CheckCircle2 className="w-3 h-3" /> Pagada
                                                </Badge>
                                                {sale.fecha_pago_comision && (
                                                    <span className="text-[9px] text-slate-400">{formatDate(sale.fecha_pago_comision)}</span>
                                                )}
                                            </div>
                                        ) : (
                                            <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200 border-none text-[10px] font-bold gap-1">
                                                <Clock className="w-3 h-3" /> Pendiente
                                            </Badge>
                                        )}
                                    </td>
                                    <td className="px-4 py-3.5 text-center">
                                        {sale.comision_pagada ? (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleMarkPending(sale)}
                                                className="h-7 px-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 text-[10px] font-bold"
                                            >
                                                Revertir
                                            </Button>
                                        ) : (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => openPayModal(sale)}
                                                className="h-7 px-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 text-[10px] font-bold gap-1"
                                            >
                                                <BadgeCheck className="w-3 h-3" />
                                                Pagar
                                            </Button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Footer */}
            {!loading && filtered.length > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t border-slate-100">
                    <p className="text-xs text-slate-400">
                        {countPendientes} pendiente{countPendientes !== 1 ? 's' : ''} de {filtered.length}
                    </p>
                    <div className="flex gap-6 text-xs">
                        <span className="text-slate-500">
                            Pendiente: <span className="font-black text-amber-600">{fmt(totalPendientes)}</span>
                        </span>
                        <span className="text-slate-500">
                            Total comisiones: <span className="font-black text-slate-800">{fmt(totalComisiones)}</span>
                        </span>
                    </div>
                </div>
            )}

            {/* Modal Marcar Comisión Pagada */}
            {payingId && payingSale && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <h4 className="font-black text-slate-800 text-base">Pagar Comisión</h4>
                            <button onClick={() => setPayingId(null)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="bg-slate-50 rounded-xl p-3 space-y-1 text-xs">
                            <p className="text-slate-500">Comercial: <span className="font-bold text-slate-800">{payingSale.comercial?.nombre || '—'}</span></p>
                            <p className="text-slate-500">Factura: <span className="font-bold text-slate-800">{payingSale.numero_factura || '—'}</span></p>
                            <p className="text-slate-500">Valor comisión: <span className="font-black text-orange-600">{fmt(Number(payingSale.valor_comision) || 0)}</span></p>
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Fecha de Pago</label>
                            <Input
                                type="date"
                                value={payDate}
                                onChange={e => setPayDate(e.target.value)}
                                className="mt-1"
                                autoFocus
                            />
                        </div>
                        <div className="flex gap-2 pt-2">
                            <Button variant="outline" onClick={() => setPayingId(null)} className="flex-1">
                                Cancelar
                            </Button>
                            <Button
                                onClick={handleConfirmPago}
                                disabled={saving}
                                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                            >
                                {saving ? 'Guardando...' : 'Confirmar Pago'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
