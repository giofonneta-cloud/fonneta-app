'use client';

import { useState, useEffect } from 'react';
import { Venta } from '../types/sales-expenses.types';
import { salesService } from '../services/salesService';
import { Badge } from '@/shared/components/ui/badge';
import { AlertCircle, CheckCircle2, Clock } from 'lucide-react';

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

interface Props { period: string }

export function CXCList({ period }: Props) {
    const [sales, setSales] = useState<Venta[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        salesService.getAllSales()
            .then(data => {
                const pending = data
                    .filter(s => s.estado_pago !== 'pagado' && isInPeriod(s.fecha_cobro_estimada, period))
                    .sort((a, b) => {
                        const da = getDaysUntil(a.fecha_cobro_estimada) ?? 9999;
                        const db = getDaysUntil(b.fecha_cobro_estimada) ?? 9999;
                        return da - db;
                    });
                setSales(pending);
            })
            .catch(err => console.error('Error CXC', err))
            .finally(() => setLoading(false));
    }, [period]);

    const thisWeek = sales.filter(s => {
        const d = getDaysUntil(s.fecha_cobro_estimada);
        return d !== null && d <= 7;
    });
    const overdue = sales.filter(s => {
        const d = getDaysUntil(s.fecha_cobro_estimada);
        return d !== null && d < 0;
    });

    const totalPendiente = sales.reduce((a, s) => a + (Number(s.total_con_iva) - Number(s.valor_pagado || 0)), 0);

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
                <table className="w-full text-sm text-left">
                    <thead className="text-[10px] text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
                        <tr>
                            <th className="px-4 py-3 font-black tracking-widest">Cliente</th>
                            <th className="px-4 py-3 font-black tracking-widest">Factura</th>
                            <th className="px-4 py-3 font-black tracking-widest">Proyecto</th>
                            <th className="px-4 py-3 font-black tracking-widest text-right">Total Factura</th>
                            <th className="px-4 py-3 font-black tracking-widest text-right">Saldo por Cobrar</th>
                            <th className="px-4 py-3 font-black tracking-widest">Fecha Cobro Est.</th>
                            <th className="px-4 py-3 font-black tracking-widest text-center">Vencimiento</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {loading ? (
                            Array.from({ length: 4 }).map((_, i) => (
                                <tr key={i}>
                                    {Array.from({ length: 7 }).map((__, j) => (
                                        <td key={j} className="px-4 py-4">
                                            <div className="h-3 bg-slate-100 rounded animate-pulse" />
                                        </td>
                                    ))}
                                </tr>
                            ))
                        ) : sales.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="py-16 text-center">
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
                                        <td className="px-4 py-3.5 font-semibold text-blue-600 text-xs">
                                            {s.cliente?.business_name || 'Sin cliente'}
                                        </td>
                                        <td className="px-4 py-3.5 font-mono text-xs font-bold text-slate-700">
                                            {s.numero_factura || <span className="text-slate-300">—</span>}
                                        </td>
                                        <td className="px-4 py-3.5 text-xs text-slate-500">
                                            {s.proyecto?.name || '—'}
                                        </td>
                                        <td className="px-4 py-3.5 text-right font-mono text-xs text-slate-600">
                                            {fmt(Number(s.total_con_iva))}
                                        </td>
                                        <td className="px-4 py-3.5 text-right font-mono text-xs font-black text-emerald-600">
                                            {fmt(saldo)}
                                        </td>
                                        <td className="px-4 py-3.5 text-xs text-slate-500 font-medium">
                                            {formatDate(s.fecha_cobro_estimada)}
                                        </td>
                                        <td className="px-4 py-3.5 text-center">
                                            {urgencyBadge(days, s.estado_pago)}
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
        </div>
    );
}
