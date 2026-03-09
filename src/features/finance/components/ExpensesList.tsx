'use client';

import { useState, useEffect } from 'react';
import { GastoExtendido } from '../types/sales-expenses.types';
import { expensesService } from '../services/expensesService';
import { Input } from '@/shared/components/ui/input';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Search, AlertCircle, Pencil } from 'lucide-react';

const fmt = (n: number) =>
    n.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });

function estadoBadge(estado: string) {
    if (estado === 'pagado')
        return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-none text-[10px] font-bold">Pagado</Badge>;
    if (estado === 'solicite_documentos')
        return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200 border-none text-[10px] font-bold">Docs. Faltantes</Badge>;
    return <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-200 border-none text-[10px] font-bold">Pendiente</Badge>;
}

function formatDate(d?: string) {
    if (!d) return '—';
    return new Date(d + 'T12:00:00').toLocaleDateString('es-CO', {
        day: '2-digit', month: 'short', year: 'numeric',
    });
}

interface Props {
    onEdit?: (expense: GastoExtendido) => void;
}

export function ExpensesList({ onEdit }: Props) {
    const [expenses, setExpenses] = useState<GastoExtendido[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        expensesService.getAllExpenses()
            .then(data => setExpenses(data))
            .catch(err => console.error('Error loading expenses', err))
            .finally(() => setLoading(false));
    }, []);

    const filtered = expenses.filter(e => {
        const q = search.toLowerCase();
        return (
            (e.numero_factura_proveedor ?? '').toLowerCase().includes(q) ||
            (e.categoria ?? '').toLowerCase().includes(q) ||
            (e.codigo_oc ?? '').toLowerCase().includes(q)
        );
    });

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h3 className="text-base font-bold text-slate-800">Registro de Gastos</h3>
                    <p className="text-xs text-slate-400 font-medium mt-0.5">
                        {loading ? 'Cargando...' : `${filtered.length} registros`}
                    </p>
                </div>
                <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                        placeholder="Buscar por factura, categoría, OC..."
                        className="pl-9 bg-slate-50 border-slate-200 text-sm h-9"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-100">
                <table className="w-full text-sm text-left">
                    <thead className="text-[10px] text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
                        <tr>
                            <th className="px-4 py-3 font-black tracking-widest">Fecha Radicado</th>
                            <th className="px-4 py-3 font-black tracking-widest">Factura Prov.</th>
                            <th className="px-4 py-3 font-black tracking-widest">Categoría</th>
                            <th className="px-4 py-3 font-black tracking-widest">OC / Release</th>
                            <th className="px-4 py-3 font-black tracking-widest text-right">Valor Neto</th>
                            <th className="px-4 py-3 font-black tracking-widest text-right">Total + IVA</th>
                            <th className="px-4 py-3 font-black tracking-widest">Límite Pago</th>
                            <th className="px-4 py-3 font-black tracking-widest text-center">Estado</th>
                            <th className="px-4 py-3 font-black tracking-widest text-center">Editar</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {loading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <tr key={i}>
                                    {Array.from({ length: 9 }).map((__, j) => (
                                        <td key={j} className="px-4 py-4">
                                            <div className="h-3 bg-slate-100 rounded animate-pulse w-full" />
                                        </td>
                                    ))}
                                </tr>
                            ))
                        ) : filtered.length === 0 ? (
                            <tr>
                                <td colSpan={9} className="py-16 text-center">
                                    <AlertCircle className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                                    <p className="text-sm text-slate-400 font-medium">
                                        {search ? 'Sin resultados' : 'No hay gastos registrados'}
                                    </p>
                                </td>
                            </tr>
                        ) : (
                            filtered.map(e => (
                                <tr key={e.id} className="hover:bg-slate-50/60 transition-colors">
                                    <td className="px-4 py-3.5 text-slate-600 font-medium text-xs">
                                        {formatDate(e.fecha_radicado)}
                                    </td>
                                    <td className="px-4 py-3.5 font-mono text-slate-700 text-xs font-bold">
                                        {e.numero_factura_proveedor || <span className="text-slate-300">—</span>}
                                    </td>
                                    <td className="px-4 py-3.5">
                                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 capitalize">
                                            {e.categoria || '—'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3.5 text-xs text-slate-500">
                                        {e.codigo_oc
                                            ? <span className="font-mono font-semibold text-blue-600">{e.codigo_oc}</span>
                                            : <span className="text-slate-300">—</span>}
                                        {e.codigo_release && <span className="ml-1.5 text-slate-400">/ {e.codigo_release}</span>}
                                    </td>
                                    <td className="px-4 py-3.5 text-right font-mono text-slate-700 text-xs">
                                        {fmt(Number(e.valor_neto) || 0)}
                                    </td>
                                    <td className="px-4 py-3.5 text-right font-mono font-bold text-rose-600 text-xs">
                                        {fmt(Number(e.total_con_iva) || 0)}
                                    </td>
                                    <td className="px-4 py-3.5 text-xs text-slate-500 font-medium">
                                        {formatDate(e.fecha_limite_pago)}
                                    </td>
                                    <td className="px-4 py-3.5 text-center">
                                        {estadoBadge(e.estado_pago)}
                                    </td>
                                    <td className="px-4 py-3.5 text-center">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => onEdit?.(e)}
                                            className="h-7 w-7 p-0 text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                                        >
                                            <Pencil className="w-3.5 h-3.5" />
                                        </Button>
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
                                {fmt(filtered.reduce((a, e) => a + (Number(e.valor_neto) || 0), 0))}
                            </span>
                        </span>
                        <span className="text-slate-500">
                            Total + IVA: <span className="font-black text-rose-600">
                                {fmt(filtered.reduce((a, e) => a + (Number(e.total_con_iva) || 0), 0))}
                            </span>
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}
