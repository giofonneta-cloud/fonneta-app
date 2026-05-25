'use client';

import { useState, useEffect } from 'react';
import { Venta } from '../types/sales-expenses.types';
import { salesService } from '../services/salesService';
import { Input } from '@/shared/components/ui/input';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Search, AlertCircle, Pencil, DollarSign, X, ReceiptText } from 'lucide-react';
import { useResizableColumns } from '@/shared/hooks/useResizableColumns';

// [col]: Fecha | Factura | Cliente | Proyecto | C. Costo | Valor Neto | Total+IVA | Estado | Nota Crédito | Acciones
const INITIAL_WIDTHS = [110, 140, 180, 180, 120, 120, 120, 100, 100, 100];

const fmt = (n: number) =>
    n.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });

function estadoBadge(estado: string) {
    if (estado === 'pagado')
        return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-none text-[10px] font-bold">Pagado</Badge>;
    if (estado === 'parcial')
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-none text-[10px] font-bold">Parcial</Badge>;
    return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200 border-none text-[10px] font-bold">Pendiente</Badge>;
}

function formatDate(d?: string) {
    if (!d) return '—';
    return new Date(d + 'T12:00:00').toLocaleDateString('es-CO', {
        day: '2-digit', month: 'short', year: 'numeric',
    });
}

interface Props {
    period?: string;
    selectedProjects?: string[];
    selectedCostCenters?: string[];
    selectedEstado?: string[];
    onEdit?: (sale: Venta) => void;
    onClientClick?: (clientId: string) => void;
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

export function SalesList({ period, selectedProjects, selectedCostCenters, selectedEstado, onEdit, onClientClick }: Props) {
    const [sales, setSales] = useState<Venta[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const { widths, startResize } = useResizableColumns(INITIAL_WIDTHS);

    // Estado del modal de pago
    const [payingId, setPayingId] = useState<string | null>(null);
    const [payAmount, setPayAmount] = useState('');
    const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0]);
    const [saving, setSaving] = useState(false);

    const loadSales = () => {
        setLoading(true);
        salesService.getAllSales()
            .then(data => setSales(data))
            .catch(err => console.error('Error loading sales', err))
            .finally(() => setLoading(false));
    };

    useEffect(() => { loadSales(); }, []);

    const filtered = sales.filter(s => {
        const matchesSearch = (s.cliente?.business_name ?? '').toLowerCase().includes(search.toLowerCase()) ||
            (s.proyecto?.name ?? '').toLowerCase().includes(search.toLowerCase()) ||
            (s.numero_factura ?? '').toLowerCase().includes(search.toLowerCase());
        const matchesPeriod = isInPeriod(s.fecha_factura || s.created_at, period);
        const matchesProject = !selectedProjects || selectedProjects.length === 0 || selectedProjects.includes(s.proyecto?.name ?? '');
        const matchesCostCenter = !selectedCostCenters || selectedCostCenters.length === 0 || selectedCostCenters.includes(s.cost_center ?? '');
        const matchesEstado = !selectedEstado || selectedEstado.length === 0 || selectedEstado.some(e => s.estado_pago === e.toLowerCase().replace(/ /g, '_'));
        return matchesSearch && matchesPeriod && matchesProject && matchesCostCenter && matchesEstado;
    });

    const payingSale = sales.find(s => s.id === payingId);
    const saldoPendiente = payingSale
        ? Number(payingSale.total_con_iva) - Number(payingSale.valor_pagado || 0)
        : 0;

    const openPayModal = (sale: Venta) => {
        const saldo = Number(sale.total_con_iva) - Number(sale.valor_pagado || 0);
        setPayingId(sale.id);
        setPayAmount(String(saldo > 0 ? Math.round(saldo) : ''));
        setPayDate(new Date().toISOString().split('T')[0]);
    };

    const handleRegisterPayment = async () => {
        if (!payingId) return;
        const amount = Number(payAmount);
        if (!amount || amount <= 0) { alert('Ingresa un valor válido'); return; }
        setSaving(true);
        try {
            await salesService.recordPayment(payingId, amount, payDate);
            setPayingId(null);
            loadSales();
        } catch (err: unknown) {
            alert('Error al registrar pago: ' + (err instanceof Error ? err.message : String(err)));
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h3 className="text-base font-bold text-slate-800">Registro de Ventas</h3>
                    <p className="text-xs text-slate-400 font-medium mt-0.5">
                        {loading ? 'Cargando...' : `${filtered.length} registros`}
                    </p>
                </div>
                <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                        placeholder="Buscar por cliente, proyecto o factura..."
                        className="pl-9 bg-slate-50 border-slate-200 text-sm h-9"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
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
                            {(['Fecha', 'Factura', 'Cliente', 'Proyecto', 'C. Costo', 'Valor Neto', 'Total + IVA', 'Estado', 'Nota Crédito', 'Acciones'] as const).map((label, i) => (
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
                                        {search ? 'Sin resultados' : 'No hay ventas registradas'}
                                    </p>
                                </td>
                            </tr>
                        ) : (
                            filtered.map(sale => (
                                <tr key={sale.id} className={`transition-colors ${sale.nota_credito ? 'bg-slate-50/60 opacity-60 hover:bg-slate-100/60' : 'hover:bg-slate-50/60'}`}>
                                    <td className="px-4 py-3.5 text-slate-600 font-medium text-xs overflow-hidden">
                                        <span className="block truncate">{formatDate(sale.fecha_factura ?? sale.created_at)}</span>
                                    </td>
                                    <td className="px-4 py-3.5 font-mono text-slate-700 text-xs font-bold overflow-hidden">
                                        <span className="block truncate">{sale.numero_factura || '—'}</span>
                                    </td>
                                    <td className="px-4 py-3.5 font-semibold text-xs overflow-hidden">
                                        {sale.cliente?.id && onClientClick ? (
                                            <button
                                                onClick={() => onClientClick?.(sale.cliente!.id)}
                                                className="block truncate text-blue-600 hover:underline hover:text-blue-700 transition-colors"
                                                title={sale.cliente?.business_name ?? ''}
                                            >
                                                {sale.cliente?.business_name || 'Sin cliente'}
                                            </button>
                                        ) : (
                                            <span className="block truncate" title={sale.cliente?.business_name ?? ''}>
                                                {sale.cliente?.business_name || 'Sin cliente'}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3.5 text-slate-600 text-xs overflow-hidden">
                                        <span className="block truncate" title={sale.proyecto?.name ?? ''}>
                                            {sale.proyecto?.name || '—'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3.5 text-slate-600 text-xs overflow-hidden">
                                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 capitalize">
                                            {sale.cost_center || '—'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3.5 text-right font-mono text-slate-700 text-xs overflow-hidden">
                                        <span className="block truncate">{fmt(sale.valor_venta_neto)}</span>
                                    </td>
                                    <td className="px-4 py-3.5 text-right font-mono font-bold text-emerald-600 text-xs overflow-hidden">
                                        <span className="block truncate">{fmt(sale.total_con_iva)}</span>
                                    </td>
                                    <td className="px-4 py-3.5 text-center">
                                        {estadoBadge(sale.estado_pago)}
                                    </td>
                                    <td className="px-4 py-3.5 text-center">
                                        <button
                                            onClick={() => salesService.updateSale(sale.id, { nota_credito: !sale.nota_credito }).then(() => loadSales()).catch(e => alert('Error: ' + e.message))}
                                            className={`p-1.5 rounded-lg transition-colors ${sale.nota_credito ? 'bg-red-100 text-red-600 hover:bg-red-200' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                                            title={sale.nota_credito ? 'Marcar como venta normal' : 'Marcar como nota de crédito'}
                                        >
                                            <ReceiptText className="w-4 h-4" />
                                        </button>
                                    </td>
                                    <td className="px-4 py-3.5 text-center">
                                        <div className="flex items-center justify-center gap-1">
                                            {sale.estado_pago !== 'pagado' && !sale.nota_credito && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => openPayModal(sale)}
                                                    className="h-7 px-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 text-[10px] font-bold gap-1"
                                                >
                                                    <DollarSign className="w-3 h-3" />
                                                    Pago
                                                </Button>
                                            )}
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => onEdit?.(sale)}
                                                className="h-7 w-7 p-0 text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                                            >
                                                <Pencil className="w-3.5 h-3.5" />
                                            </Button>
                                        </div>
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
                    <p className="text-xs text-slate-400">{filtered.length} registro{filtered.length !== 1 ? 's' : ''}</p>
                    <div className="flex gap-6 text-xs">
                        <span className="text-slate-500">
                            Neto: <span className="font-black text-slate-800">
                                {fmt(filtered.filter(s => !s.nota_credito).reduce((a, s) => a + (Number(s.valor_venta_neto) || 0), 0))}
                            </span>
                        </span>
                        <span className="text-slate-500">
                            Total + IVA: <span className="font-black text-emerald-600">
                                {fmt(filtered.filter(s => !s.nota_credito).reduce((a, s) => a + (Number(s.total_con_iva) || 0), 0))}
                            </span>
                        </span>
                    </div>
                </div>
            )}

            {/* Modal Registrar Pago */}
            {payingId && payingSale && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <h4 className="font-black text-slate-800 text-base">Registrar Pago</h4>
                            <button onClick={() => setPayingId(null)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="bg-slate-50 rounded-xl p-3 space-y-1 text-xs">
                            <p className="text-slate-500">Cliente: <span className="font-bold text-slate-800">{payingSale.cliente?.business_name}</span></p>
                            <p className="text-slate-500">Factura: <span className="font-bold text-slate-800">{payingSale.numero_factura || '—'}</span></p>
                            <p className="text-slate-500">Total: <span className="font-bold text-emerald-600">{fmt(Number(payingSale.total_con_iva))}</span></p>
                            <p className="text-slate-500">Saldo pendiente: <span className="font-black text-amber-600">{fmt(saldoPendiente)}</span></p>
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
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Fecha de Pago</label>
                                <Input
                                    type="date"
                                    value={payDate}
                                    onChange={e => setPayDate(e.target.value)}
                                    className="mt-1"
                                />
                            </div>
                        </div>
                        <div className="flex gap-2 pt-2">
                            <Button variant="outline" onClick={() => setPayingId(null)} className="flex-1">
                                Cancelar
                            </Button>
                            <Button
                                onClick={handleRegisterPayment}
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
