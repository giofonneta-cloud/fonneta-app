'use client';

import { useState, useEffect } from 'react';
import { GastoExtendido } from '../types/sales-expenses.types';
import { expensesService } from '../services/expensesService';
import { Input } from '@/shared/components/ui/input';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Search, AlertCircle, Pencil } from 'lucide-react';
import { useResizableColumns } from '@/shared/hooks/useResizableColumns';

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

// [col]: Fecha Radicado | Factura Prov. | Proveedor | Categoría | OC/Release | Valor Neto | Total+IVA | Límite Pago | Estado | Editar
const INITIAL_WIDTHS = [130, 140, 200, 120, 130, 120, 120, 120, 100, 70];

interface Props {
    onEdit?: (expense: GastoExtendido) => void;
}

export function ExpensesList({ onEdit }: Props) {
    const [expenses, setExpenses] = useState<GastoExtendido[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const { widths, startResize } = useResizableColumns(INITIAL_WIDTHS);

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
            (e.codigo_oc ?? '').toLowerCase().includes(q) ||
            (e.proveedor_nombre ?? '').toLowerCase().includes(q)
        );
    });

    const headers = [
        'Fecha Radicado', 'Factura Prov.', 'Proveedor', 'Categoría',
        'OC / Release', 'Valor Neto', 'Total + IVA', 'Límite Pago', 'Estado', 'Editar',
    ];

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
                <table className="text-sm text-left" style={{ tableLayout: 'fixed', width: widths.reduce((a, b) => a + b, 0) }}>
                    <colgroup>
                        {widths.map((w, i) => <col key={i} style={{ width: w }} />)}
                    </colgroup>
                    <thead className="text-[10px] text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
                        <tr>
                            {headers.map((label, i) => (
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
                                        {search ? 'Sin resultados' : 'No hay gastos registrados'}
                                    </p>
                                </td>
                            </tr>
                        ) : (
                            filtered.map(e => (
                                <tr key={e.id} className="hover:bg-slate-50/60 transition-colors">
                                    <td className="px-4 py-3.5 text-slate-600 font-medium text-xs overflow-hidden">
                                        <span className="block truncate">{formatDate(e.fecha_radicado)}</span>
                                    </td>
                                    <td className="px-4 py-3.5 font-mono text-slate-700 text-xs font-bold overflow-hidden">
                                        <span className="block truncate">{e.numero_factura_proveedor || '—'}</span>
                                    </td>
                                    <td className="px-4 py-3.5 text-xs text-slate-700 font-medium overflow-hidden">
                                        <span className="block truncate" title={e.proveedor_nombre ?? ''}>
                                            {e.proveedor_nombre || <span className="text-slate-300">—</span>}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3.5 overflow-hidden">
                                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 capitalize truncate max-w-full">
                                            {e.categoria || '—'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3.5 text-xs text-slate-500 overflow-hidden">
                                        {e.codigo_oc
                                            ? <span className="font-mono font-semibold text-blue-600 truncate block">{e.codigo_oc}</span>
                                            : <span className="text-slate-300">—</span>}
                                        {e.codigo_release && <span className="ml-1.5 text-slate-400 truncate">/ {e.codigo_release}</span>}
                                    </td>
                                    <td className="px-4 py-3.5 text-right font-mono text-slate-700 text-xs overflow-hidden">
                                        <span className="block truncate">{fmt(Number(e.valor_neto) || 0)}</span>
                                    </td>
                                    <td className="px-4 py-3.5 text-right font-mono font-bold text-rose-600 text-xs overflow-hidden">
                                        <span className="block truncate">{fmt(Number(e.total_con_iva) || 0)}</span>
                                    </td>
                                    <td className="px-4 py-3.5 text-xs text-slate-500 font-medium overflow-hidden">
                                        <span className="block truncate">{formatDate(e.fecha_limite_pago)}</span>
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
