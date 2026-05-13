'use client';

import { useState, useEffect } from 'react';
import { GastoExtendido } from '../types/sales-expenses.types';
import { expensesService } from '../services/expensesService';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { CheckCircle2, X } from 'lucide-react';
import { useResizableColumns } from '@/shared/hooks/useResizableColumns';

// [col]: Factura Prov. | Proveedor | C. Costo | Categoría | OC | Radicado | Valor Neto | Total+IVA | Límite Pago | Vencimiento | Acción
const INITIAL_WIDTHS = [140, 200, 120, 120, 100, 130, 120, 120, 120, 120, 90];

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

function urgencyBadge(days: number | null, estado: string) {
    if (estado === 'pagado') {
        return (
            <Badge className="bg-emerald-100 text-emerald-700 border-none text-[10px] font-bold gap-1">
                <CheckCircle2 className="w-3 h-3" /> Pagado
            </Badge>
        );
    }
    if (days === null) return <Badge className="bg-slate-100 text-slate-500 border-none text-[10px]">Sin fecha</Badge>;
    if (days < 0) return <Badge className="bg-red-100 text-red-700 border-none text-[10px] font-bold animate-pulse">Vencido {Math.abs(days)}d</Badge>;
    if (days === 0) return <Badge className="bg-orange-100 text-orange-700 border-none text-[10px] font-bold">Vence hoy</Badge>;
    if (days <= 7) return <Badge className="bg-amber-100 text-amber-700 border-none text-[10px] font-bold">Vence en {days}d</Badge>;
    return <Badge className="bg-slate-100 text-slate-500 border-none text-[10px] font-medium">{days}d restantes</Badge>;
}

const METODOS_PAGO = ['TRANSFERENCIA', 'CHEQUE', 'EFECTIVO', 'PSE', 'OTRO'];

interface Props {
    period: string;
    selectedProjects?: string[];
    selectedCostCenters?: string[];
    selectedEstado?: string[];
    onProviderClick?: (providerId: string) => void;
}

export function CXPList({ period, selectedProjects, selectedCostCenters, selectedEstado, onProviderClick }: Props) {
    const [expenses, setExpenses] = useState<GastoExtendido[]>([]);
    const [loading, setLoading] = useState(true);
    const { widths, startResize } = useResizableColumns(INITIAL_WIDTHS);

    // Estado del modal de pago
    const [payingId, setPayingId] = useState<string | null>(null);
    const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0]);
    const [metodoPago, setMetodoPago] = useState('TRANSFERENCIA');
    const [saving, setSaving] = useState(false);

    const loadData = () => {
        setLoading(true);
        expensesService.getAllExpenses()
            .then(data => {
                const pending = data
                    .filter(e => {
                        const matchesPeriod = e.estado_pago !== 'pagado' && isInPeriod(e.fecha_limite_pago, period);
                        const matchesProject = !selectedProjects || selectedProjects.length === 0 || !e.proyecto_id || true; // TODO: implement project filtering when proyecto is available
                        const matchesCostCenter = !selectedCostCenters || selectedCostCenters.length === 0 || selectedCostCenters.includes(e.cost_center ?? '');
                        const matchesEstado = !selectedEstado || selectedEstado.length === 0 || selectedEstado.some(es => e.estado_pago === es.toLowerCase().replace(/ /g, '_'));
                        return matchesPeriod && matchesProject && matchesCostCenter && matchesEstado;
                    })
                    .sort((a, b) => {
                        const da = getDaysUntil(a.fecha_limite_pago) ?? 9999;
                        const db = getDaysUntil(b.fecha_limite_pago) ?? 9999;
                        return da - db;
                    });
                setExpenses(pending);
            })
            .catch(err => console.error('Error CXP', err))
            .finally(() => setLoading(false));
    };

    useEffect(() => { loadData(); }, [period, selectedProjects, selectedCostCenters, selectedEstado]);

    const thisWeek = expenses.filter(e => {
        const d = getDaysUntil(e.fecha_limite_pago);
        return d !== null && d <= 7;
    });
    const overdue = expenses.filter(e => {
        const d = getDaysUntil(e.fecha_limite_pago);
        return d !== null && d < 0;
    });

    const totalPendiente = expenses.reduce((a, e) => a + (Number(e.total_con_iva) || 0), 0);

    const payingExpense = expenses.find(e => e.id === payingId);

    const openPayModal = (expense: GastoExtendido) => {
        setPayingId(expense.id);
        setPayDate(new Date().toISOString().split('T')[0]);
        setMetodoPago(expense.metodo_pago || 'TRANSFERENCIA');
    };

    const handleConfirmPago = async () => {
        if (!payingId) return;
        setSaving(true);
        try {
            await expensesService.updateGasto(payingId, {
                estado_pago: 'pagado',
                fecha_pago_real: payDate,
                metodo_pago: metodoPago,
            });
            setPayingId(null);
            loadData();
        } catch (err: unknown) {
            alert('Error al confirmar pago: ' + (err instanceof Error ? err.message : String(err)));
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h3 className="text-base font-bold text-slate-800">Cuentas por Pagar (CXP)</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                        Gastos y pagos a proveedores pendientes
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
                            {(['Factura Prov.', 'Proveedor', 'C. Costo', 'Categoría', 'OC', 'Radicado', 'Valor Neto', 'Total + IVA', 'Límite Pago', 'Vencimiento', 'Acción'] as const).map((label, i) => (
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
                                    {Array.from({ length: 11 }).map((__, j) => (
                                        <td key={j} className="px-4 py-4">
                                            <div className="h-3 bg-slate-100 rounded animate-pulse" />
                                        </td>
                                    ))}
                                </tr>
                            ))
                        ) : expenses.length === 0 ? (
                            <tr>
                                <td colSpan={11} className="py-16 text-center">
                                    <CheckCircle2 className="w-10 h-10 text-emerald-200 mx-auto mb-3" />
                                    <p className="text-sm font-bold text-slate-400">¡Todo pagado! No hay cuentas por pagar pendientes.</p>
                                </td>
                            </tr>
                        ) : (
                            expenses.map(e => {
                                const days = getDaysUntil(e.fecha_limite_pago);
                                const isUrgent = days !== null && days <= 7;
                                const isOverdue = days !== null && days < 0;
                                return (
                                    <tr
                                        key={e.id}
                                        className={`transition-colors ${
                                            isOverdue ? 'bg-red-50/40 hover:bg-red-50' :
                                            isUrgent ? 'bg-amber-50/30 hover:bg-amber-50/60' :
                                            'hover:bg-slate-50/60'
                                        }`}
                                    >
                                        <td className="px-4 py-3.5 font-mono text-xs font-bold text-slate-700 overflow-hidden">
                                            <span className="block truncate">{e.numero_factura_proveedor || '—'}</span>
                                        </td>
                                        <td className="px-4 py-3.5 text-xs text-slate-700 font-medium overflow-hidden">
                                            {e.proveedor_id && onProviderClick ? (
                                                <button
                                                    onClick={() => onProviderClick(e.proveedor_id)}
                                                    className="block truncate text-blue-600 hover:underline hover:text-blue-700 transition-colors"
                                                    title={e.proveedor_nombre ?? ''}
                                                >
                                                    {e.proveedor_nombre}
                                                </button>
                                            ) : (
                                                <span className="block truncate" title={e.proveedor_nombre ?? ''}>
                                                    {e.proveedor_nombre || <span className="text-slate-300">—</span>}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3.5 text-xs text-slate-700 font-medium overflow-hidden">
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 capitalize">
                                                {e.cost_center || '—'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3.5 overflow-hidden">
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 capitalize truncate max-w-full">
                                                {e.categoria || '—'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3.5 text-xs overflow-hidden">
                                            {e.codigo_oc
                                                ? <span className="font-mono font-semibold text-blue-600 block truncate">{e.codigo_oc}</span>
                                                : <span className="text-slate-300">—</span>
                                            }
                                        </td>
                                        <td className="px-4 py-3.5 text-xs text-slate-500 overflow-hidden">
                                            <span className="block truncate">{formatDate(e.fecha_radicado)}</span>
                                        </td>
                                        <td className="px-4 py-3.5 text-right font-mono text-xs text-slate-600 overflow-hidden">
                                            <span className="block truncate">{fmt(Number(e.valor_neto) || 0)}</span>
                                        </td>
                                        <td className="px-4 py-3.5 text-right font-mono text-xs font-black text-rose-600 overflow-hidden">
                                            <span className="block truncate">{fmt(Number(e.total_con_iva) || 0)}</span>
                                        </td>
                                        <td className="px-4 py-3.5 text-xs text-slate-500 font-medium overflow-hidden">
                                            <span className="block truncate">{formatDate(e.fecha_limite_pago)}</span>
                                        </td>
                                        <td className="px-4 py-3.5 text-center">
                                            {urgencyBadge(days, e.estado_pago)}
                                        </td>
                                        <td className="px-4 py-3.5 text-center">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => openPayModal(e)}
                                                className="h-7 px-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 text-[10px] font-bold gap-1"
                                            >
                                                <CheckCircle2 className="w-3 h-3" />
                                                Pagado
                                            </Button>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {!loading && expenses.length > 0 && (
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-400">
                    <span>{expenses.length} pago{expenses.length !== 1 ? 's' : ''} pendiente{expenses.length !== 1 ? 's' : ''}</span>
                    <span className="font-black text-slate-700">
                        Total a pagar: <span className="text-rose-600">{fmt(totalPendiente)}</span>
                    </span>
                </div>
            )}

            {/* Modal Confirmar Pago */}
            {payingId && payingExpense && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <h4 className="font-black text-slate-800 text-base">Confirmar Pago</h4>
                            <button onClick={() => setPayingId(null)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="bg-slate-50 rounded-xl p-3 space-y-1 text-xs">
                            <p className="text-slate-500">Factura: <span className="font-bold text-slate-800">{payingExpense.numero_factura_proveedor || '—'}</span></p>
                            <p className="text-slate-500">Categoría: <span className="font-bold text-slate-800 capitalize">{payingExpense.categoria}</span></p>
                            <p className="text-slate-500">Total a pagar: <span className="font-black text-rose-600">{fmt(Number(payingExpense.total_con_iva))}</span></p>
                        </div>
                        <div className="space-y-3">
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
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Método de Pago</label>
                                <select
                                    value={metodoPago}
                                    onChange={e => setMetodoPago(e.target.value)}
                                    className="mt-1 w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                >
                                    {METODOS_PAGO.map(m => (
                                        <option key={m} value={m}>{m}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="flex gap-2 pt-2">
                            <Button variant="outline" onClick={() => setPayingId(null)} className="flex-1">
                                Cancelar
                            </Button>
                            <Button
                                onClick={handleConfirmPago}
                                disabled={saving}
                                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white"
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
