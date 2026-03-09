'use client';

import { useState, useEffect } from 'react';
import { PieChart as PieChartIcon } from 'lucide-react';
import { salesService } from '../services/salesService';
import { expensesService } from '../services/expensesService';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Legend,
} from 'recharts';

interface Props {
    period: string;
}

// Parsea año y mes directamente del string para evitar bugs de zona horaria
function getYearMonth(dateStr: string): { year: number; month: number } | null {
    if (!dateStr) return null;
    const part = dateStr.split('T')[0];
    const [y, m] = part.split('-').map(Number);
    if (!y || !m) return null;
    return { year: y, month: m };
}

function isInPeriod(dateStr: string, periodStr: string): boolean {
    if (periodStr === 'all') return true;
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

const fmt = (n: number) =>
    n.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });

const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-white border border-slate-100 rounded-xl shadow-xl p-4 text-sm min-w-[180px]">
            <p className="font-black text-slate-700 mb-2 text-xs uppercase tracking-widest truncate">{label}</p>
            {payload.map((p: any) => (
                <div key={p.dataKey} className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full inline-block" style={{ background: p.color }} />
                        <span className="text-xs font-medium text-slate-500">{p.name}</span>
                    </div>
                    <span className="text-xs font-black" style={{ color: p.color }}>{fmt(p.value)}</span>
                </div>
            ))}
        </div>
    );
};

interface ProjectRow {
    name: string;
    ingresos: number;
    gastos: number;
    utilidad: number;
}

export function FinanceReportCenter({ period }: Props) {
    const [data, setData] = useState<ProjectRow[]>([]);
    const [totalIncome, setTotalIncome] = useState(0);
    const [totalExp, setTotalExp] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const [sales, expenses] = await Promise.all([
                    salesService.getAllSales(),
                    expensesService.getAllExpenses(),
                ]);

                const fs = sales.filter(s => isInPeriod(s.fecha_factura || s.created_at, period));
                const fe = expenses.filter(e => isInPeriod(e.fecha_radicado || e.created_at, period));

                const income = fs.reduce((a, s) => a + (Number(s.valor_venta_neto) || 0), 0);
                const exp = fe.reduce((a, e) => a + (Number(e.valor_neto) || 0), 0);
                setTotalIncome(income);
                setTotalExp(exp);

                const map: Record<string, ProjectRow> = {};
                fs.forEach(s => {
                    const name = s.proyecto?.name || 'Sin proyecto';
                    if (!map[name]) map[name] = { name, ingresos: 0, gastos: 0, utilidad: 0 };
                    map[name].ingresos += Number(s.valor_venta_neto) || 0;
                });
                fe.forEach(e => {
                    const name = 'Proyecto ' + (e.proyecto_id?.substring(0, 6) ?? 'N/A');
                    if (!map[name]) map[name] = { name, ingresos: 0, gastos: 0, utilidad: 0 };
                    map[name].gastos += Number(e.valor_neto) || 0;
                });

                const rows = Object.values(map)
                    .map(r => ({ ...r, utilidad: r.ingresos - r.gastos }))
                    .sort((a, b) => b.ingresos - a.ingresos)
                    .slice(0, 7);

                setData(rows);
            } catch (err) {
                console.error('Error loading chart', err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [period]);

    const net = totalIncome - totalExp;

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-base font-bold text-slate-800">Ingresos vs Gastos por Proyecto</h3>
                <p className="text-xs text-slate-400 mt-0.5">Comparativa de rentabilidad en el periodo seleccionado</p>
            </div>

            {loading ? (
                <div className="h-[360px] flex items-center justify-center">
                    <div className="text-sm text-slate-400 animate-pulse">Cargando datos...</div>
                </div>
            ) : data.length === 0 ? (
                <div className="h-[360px] flex flex-col items-center justify-center gap-3 text-slate-400">
                    <PieChartIcon className="w-12 h-12 opacity-20" />
                    <p className="text-sm font-medium">Sin datos para el periodo seleccionado</p>
                    <p className="text-xs text-slate-300">Registra ventas o gastos para ver el análisis</p>
                </div>
            ) : (
                <div className="h-[360px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} barGap={4} barCategoryGap="32%">
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                                dy={8}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                                tickFormatter={v => `$${(v / 1_000_000).toFixed(0)}M`}
                                width={52}
                            />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc', radius: 4 }} />
                            <Legend
                                wrapperStyle={{ fontSize: 11, fontWeight: 700, paddingTop: 16 }}
                                formatter={val => <span className="text-slate-600">{val}</span>}
                            />
                            <Bar dataKey="ingresos" name="Ingresos" fill="#10b981" radius={[6, 6, 0, 0]} />
                            <Bar dataKey="gastos" name="Gastos" fill="#f43f5e" radius={[6, 6, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* Summary strip */}
            {!loading && (
                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-100">
                    {[
                        { label: 'Ingresos periodo', value: fmt(totalIncome), color: 'text-emerald-600' },
                        { label: 'Gastos periodo', value: fmt(totalExp), color: 'text-rose-500' },
                        { label: 'Utilidad neta', value: fmt(net), color: net >= 0 ? 'text-blue-600' : 'text-rose-600' },
                    ].map((s, i) => (
                        <div key={i} className="text-center">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{s.label}</p>
                            <p className={`text-sm font-black mt-1 ${s.color}`}>{s.value}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
