'use client';

import { useState, useEffect } from 'react';
import { Venta, Retencion } from '../types/sales-expenses.types';
import { salesService } from '../services/salesService';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { CheckCircle2, X, Plus, Trash2, Send, Loader2, Mail, Phone, ClipboardList, FileText, Search } from 'lucide-react';
import { useResizableColumns } from '@/shared/hooks/useResizableColumns';
import { cxcReminderService, type SeguimientoEntry, type SeguimientoTipo } from '../services/cxcReminderService';

// [col]: Cliente | Factura | Proyecto | C. Costo | Total Factura | Saldo por Cobrar | Fecha Cobro Est. | Vencimiento | Seguimiento | Acción
const INITIAL_WIDTHS = [160, 120, 140, 110, 130, 130, 140, 110, 90, 90];

const TIPOS_RETENCION: { value: Retencion['tipo']; label: string }[] = [
    { value: 'retefuente', label: 'Retención en la Fuente' },
    { value: 'reteica', label: 'Retención ICA' },
    { value: 'reteiva', label: 'Retención IVA' },
    { value: 'otro', label: 'Otro' },
];

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

const SEG_TIPO_LABEL: Record<SeguimientoTipo, string> = {
    correo_recordatorio: 'Correo automático',
    correo: 'Correo enviado',
    llamada: 'Llamada',
    nota: 'Nota',
    otro: 'Otra gestión',
};

const SEG_TIPO_COLOR: Record<SeguimientoTipo, string> = {
    correo_recordatorio: 'bg-emerald-100 text-emerald-700',
    correo: 'bg-blue-100 text-blue-700',
    llamada: 'bg-violet-100 text-violet-700',
    nota: 'bg-slate-100 text-slate-600',
    otro: 'bg-amber-100 text-amber-700',
};

function segIcon(tipo: SeguimientoTipo) {
    if (tipo === 'correo_recordatorio' || tipo === 'correo') return <Mail className="w-3.5 h-3.5" />;
    if (tipo === 'llamada') return <Phone className="w-3.5 h-3.5" />;
    if (tipo === 'nota') return <FileText className="w-3.5 h-3.5" />;
    return <ClipboardList className="w-3.5 h-3.5" />;
}

function formatFecha(fecha: string): string {
    // fecha es YYYY-MM-DD
    const [y, m, d] = fecha.split('-');
    if (y && m && d) return new Date(`${fecha}T12:00:00`).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
    return fecha;
}

// Opciones de gestión manual (excluye el tipo automático).
const MANUAL_TIPOS: { value: Exclude<SeguimientoTipo, 'correo_recordatorio'>; label: string }[] = [
    { value: 'llamada', label: 'Llamada' },
    { value: 'correo', label: 'Correo enviado' },
    { value: 'nota', label: 'Nota' },
    { value: 'otro', label: 'Otra gestión' },
];

interface Props {
    period: string;
    selectedProjects?: string[];
    selectedCostCenters?: string[];
    selectedEstado?: string[];
    onClientClick?: (clientId: string) => void;
}

export function CXCList({ period, selectedProjects, selectedCostCenters, selectedEstado, onClientClick }: Props) {
    const [sales, setSales] = useState<Venta[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [seguimiento, setSeguimiento] = useState<Record<string, SeguimientoEntry[]>>({});
    const [sendingReminders, setSendingReminders] = useState(false);
    const { widths, startResize } = useResizableColumns(INITIAL_WIDTHS);

    // Estado del modal de cobro
    const [confirmingId, setConfirmingId] = useState<string | null>(null);
    const [payAmount, setPayAmount] = useState('');
    const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0]);
    const [retenciones, setRetenciones] = useState<Retencion[]>([]);
    const [saving, setSaving] = useState(false);

    // Estado del modal de seguimiento (bitácora unificada)
    const [segModalId, setSegModalId] = useState<string | null>(null);
    const [segTipo, setSegTipo] = useState<Exclude<SeguimientoTipo, 'correo_recordatorio'>>('llamada');
    const [segFecha, setSegFecha] = useState(new Date().toISOString().split('T')[0]);
    const [segDescripcion, setSegDescripcion] = useState('');
    const [savingSeg, setSavingSeg] = useState(false);

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
                cxcReminderService
                    .getByVentaIds(pending.map(s => s.id))
                    .then(setSeguimiento)
                    .catch(err => console.error('Error cargando seguimiento', err));
            })
            .catch(err => console.error('Error CXC', err))
            .finally(() => setLoading(false));
    };

    const handleSendReminders = async () => {
        if (sendingReminders) return;
        setSendingReminders(true);
        try {
            const r = await cxcReminderService.runNow();
            const modo = r.testMode ? '\n\n(MODO PRUEBA: los correos se enviaron al correo de prueba, no a los clientes reales.)' : '';
            const consolidados = r.itemsConsolidados > 0 ? `\n• Ítems consolidados en un solo correo: ${r.itemsConsolidados}` : '';
            alert(`Recordatorios procesados (${r.checked} facturas revisadas):\n\n• Enviados: ${r.sent}\n• Ya enviados hoy: ${r.yaEnviado}\n• Sin correo: ${r.sinEmail}\n• Sin condición hoy: ${r.skipped}\n• Errores: ${r.errores}${consolidados}${modo}`);
            loadData();
        } catch (err) {
            alert('Error al enviar recordatorios: ' + (err instanceof Error ? err.message : String(err)));
        } finally {
            setSendingReminders(false);
        }
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
    const totalVencido = overdue.reduce((a, s) => a + (Number(s.total_con_iva) - Number(s.valor_pagado || 0)), 0);

    const q = search.trim().toLowerCase();
    const visible = q
        ? sales.filter(s =>
            (s.cliente?.business_name ?? '').toLowerCase().includes(q) ||
            (s.numero_factura ?? '').toLowerCase().includes(q) ||
            (s.proyecto?.name ?? '').toLowerCase().includes(q))
        : sales;
    const visibleTotalPendiente = visible.reduce((a, s) => a + (Number(s.total_con_iva) - Number(s.valor_pagado || 0)), 0);

    const confirmingSale = sales.find(s => s.id === confirmingId);
    const saldoPendiente = confirmingSale
        ? Number(confirmingSale.total_con_iva) - Number(confirmingSale.valor_pagado || 0)
        : 0;
    const totalRetenciones = retenciones.reduce((s, r) => s + r.valor, 0);
    const totalCobrado = (Number(payAmount) || 0) + totalRetenciones;

    const openConfirmModal = (sale: Venta) => {
        const saldo = Number(sale.total_con_iva) - Number(sale.valor_pagado || 0);
        setConfirmingId(sale.id);
        setPayAmount(String(Math.round(saldo)));
        setPayDate(new Date().toISOString().split('T')[0]);
        setRetenciones([]);
    };

    const addRetencion = () =>
        setRetenciones(prev => [...prev, { tipo: 'retefuente', descripcion: 'Retención en la Fuente', valor: 0 }]);

    const removeRetencion = (i: number) =>
        setRetenciones(prev => prev.filter((_, idx) => idx !== i));

    const updateRetencion = (i: number, field: 'tipo' | 'valor', raw: string) =>
        setRetenciones(prev => prev.map((r, idx) => {
            if (idx !== i) return r;
            if (field === 'tipo') {
                const found = TIPOS_RETENCION.find(t => t.value === raw);
                return { ...r, tipo: raw as Retencion['tipo'], descripcion: found?.label ?? raw };
            }
            return { ...r, valor: Number(raw) || 0 };
        }));

    const handleConfirmCobro = async () => {
        if (!confirmingId) return;
        const valorRecibido = Number(payAmount);
        if (!valorRecibido || valorRecibido <= 0) { alert('Ingresa un valor recibido válido'); return; }
        const totalRetenciones = retenciones.reduce((s, r) => s + r.valor, 0);
        const totalCobrado = valorRecibido + totalRetenciones;
        setSaving(true);
        try {
            await salesService.recordPayment(
                confirmingId,
                totalCobrado,
                payDate,
                retenciones.length > 0 ? retenciones : undefined
            );
            setConfirmingId(null);
            loadData();
        } catch (err: unknown) {
            alert('Error al confirmar cobro: ' + (err instanceof Error ? err.message : String(err)));
        } finally {
            setSaving(false);
        }
    };

    const reloadSeguimiento = () => {
        cxcReminderService
            .getByVentaIds(sales.map(s => s.id))
            .then(setSeguimiento)
            .catch(err => console.error('Error cargando seguimiento', err));
    };

    const openSegModal = (saleId: string) => {
        setSegModalId(saleId);
        setSegTipo('llamada');
        setSegFecha(new Date().toISOString().split('T')[0]);
        setSegDescripcion('');
    };

    const handleSaveSeg = async () => {
        if (!segModalId) return;
        if (!segDescripcion.trim()) { alert('Escribe una descripción de la gestión'); return; }
        setSavingSeg(true);
        try {
            await cxcReminderService.addManual(segModalId, {
                tipo: segTipo,
                fecha: segFecha,
                descripcion: segDescripcion.trim(),
            });
            setSegDescripcion('');
            reloadSeguimiento();
        } catch (err: unknown) {
            alert('Error al registrar la gestión: ' + (err instanceof Error ? err.message : String(err)));
        } finally {
            setSavingSeg(false);
        }
    };

    const handleDeleteSeg = async (id: string) => {
        try {
            await cxcReminderService.deleteEntry(id);
            reloadSeguimiento();
        } catch (err: unknown) {
            alert('Error al eliminar: ' + (err instanceof Error ? err.message : String(err)));
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
                <div className="flex gap-3 items-center">
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                            placeholder="Buscar cliente, proyecto o factura..."
                            className="pl-9 bg-slate-50 border-slate-200 text-sm h-9"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSendReminders}
                        disabled={sendingReminders}
                        className="h-9 gap-2 text-xs font-bold text-blue-600 border-blue-200 hover:bg-blue-50"
                        title="Envía los recordatorios de pago que correspondan hoy (5 días antes, día de vencimiento, y cada 8 días vencida)"
                    >
                        {sendingReminders ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                        {sendingReminders ? 'Enviando...' : 'Enviar recordatorios'}
                    </Button>
                    <div className="text-center px-4 py-2 bg-amber-50 rounded-xl border border-amber-100">
                        <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Esta semana</p>
                        <p className="text-lg font-black text-amber-700">{thisWeek.length}</p>
                    </div>
                    <div className="text-center px-4 py-2 bg-red-50 rounded-xl border border-red-100">
                        <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">Vencidas</p>
                        <p className="text-lg font-black text-red-700">{overdue.length}</p>
                    </div>
                    <div className="text-center px-4 py-2 bg-red-50 rounded-xl border border-red-100">
                        <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">Total vencido</p>
                        <p className="text-sm font-black text-red-700">{fmt(totalVencido)}</p>
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
                            {(['Cliente', 'Factura', 'Proyecto', 'C. Costo', 'Total Factura', 'Saldo por Cobrar', 'Fecha Cobro Est.', 'Vencimiento', 'Seguimiento', 'Acción'] as const).map((label, i) => (
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
                                    {Array.from({ length: 10 }).map((__, j) => (
                                        <td key={j} className="px-4 py-4">
                                            <div className="h-3 bg-slate-100 rounded animate-pulse" />
                                        </td>
                                    ))}
                                </tr>
                            ))
                        ) : visible.length === 0 ? (
                            <tr>
                                <td colSpan={10} className="py-16 text-center">
                                    <CheckCircle2 className="w-10 h-10 text-emerald-200 mx-auto mb-3" />
                                    <p className="text-sm font-bold text-slate-400">
                                        {q ? 'Sin resultados para tu búsqueda.' : '¡Todo cobrado! No hay cuentas por cobrar pendientes.'}
                                    </p>
                                </td>
                            </tr>
                        ) : (
                            visible.map(s => {
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
                                            {(() => {
                                                const list = seguimiento[s.id] ?? [];
                                                const correos = list.filter(e => e.tipo === 'correo_recordatorio' || e.tipo === 'correo').length;
                                                return (
                                                    <button
                                                        onClick={() => openSegModal(s.id)}
                                                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold transition-colors ${list.length > 0 ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                                                        title="Ver y registrar seguimiento de cobro"
                                                    >
                                                        <ClipboardList className="w-3 h-3" />
                                                        {list.length > 0 ? `${list.length} gestion${list.length !== 1 ? 'es' : ''}` : 'Registrar'}
                                                        {correos > 0 && <Mail className="w-3 h-3 text-blue-500" />}
                                                    </button>
                                                );
                                            })()}
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

            {!loading && visible.length > 0 && (
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-400">
                    <span>{visible.length} factura{visible.length !== 1 ? 's' : ''} por cobrar{q ? ` (de ${sales.length})` : ''}</span>
                    <span className="font-black text-slate-700">
                        Total pendiente: <span className="text-emerald-600">{fmt(visibleTotalPendiente)}</span>
                    </span>
                </div>
            )}

            {/* Modal Confirmar Cobro */}
            {confirmingId && confirmingSale && (
                    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
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

                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Valor Recibido en Cuenta (COP)</label>
                                <Input
                                    type="number"
                                    value={payAmount}
                                    onChange={e => setPayAmount(e.target.value)}
                                    placeholder="0"
                                    className="mt-1"
                                    autoFocus
                                />
                            </div>

                            {/* Retenciones */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Retenciones Aplicadas</label>
                                    <button
                                        onClick={addRetencion}
                                        className="flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:text-blue-700"
                                    >
                                        <Plus className="w-3 h-3" /> Agregar
                                    </button>
                                </div>
                                {retenciones.length === 0 && (
                                    <p className="text-[10px] text-slate-400 italic">Sin retenciones — haz clic en Agregar si aplican.</p>
                                )}
                                {retenciones.map((r, i) => (
                                    <div key={i} className="flex gap-1.5 items-center">
                                        <select
                                            value={r.tipo}
                                            onChange={e => updateRetencion(i, 'tipo', e.target.value)}
                                            className="flex-1 min-w-0 text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-400"
                                        >
                                            {TIPOS_RETENCION.map(t => (
                                                <option key={t.value} value={t.value}>{t.label}</option>
                                            ))}
                                        </select>
                                        <Input
                                            type="number"
                                            value={r.valor || ''}
                                            onChange={e => updateRetencion(i, 'valor', e.target.value)}
                                            placeholder="0"
                                            className="w-32 text-xs"
                                        />
                                        <button onClick={() => removeRetencion(i)} className="text-slate-300 hover:text-red-500 flex-shrink-0 transition-colors">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            {/* Resumen */}
                            <div className="bg-slate-50 rounded-xl p-3 text-xs space-y-1.5 border border-slate-100">
                                <div className="flex justify-between text-slate-500">
                                    <span>Valor recibido en cuenta</span>
                                    <span className="font-mono font-bold">{fmt(Number(payAmount) || 0)}</span>
                                </div>
                                {retenciones.length > 0 && (
                                    <div className="flex justify-between text-amber-600">
                                        <span>+ Retenciones ({retenciones.length})</span>
                                        <span className="font-mono font-bold">{fmt(totalRetenciones)}</span>
                                    </div>
                                )}
                                <div className={`flex justify-between font-black pt-1 border-t border-slate-200 ${Math.abs(totalCobrado - saldoPendiente) < 1 ? 'text-emerald-700' : 'text-amber-600'}`}>
                                    <span>= Total cobrado</span>
                                    <span className="font-mono">{fmt(totalCobrado)}</span>
                                </div>
                                {Math.abs(totalCobrado - saldoPendiente) >= 1 && (
                                    <p className="text-[10px] text-amber-500 italic">
                                        Diferencia de {fmt(Math.abs(totalCobrado - saldoPendiente))} vs saldo ({fmt(saldoPendiente)})
                                    </p>
                                )}
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

                            <div className="flex gap-2 pt-1">
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

            {/* Modal Seguimiento de Cobro (bitácora unificada: correos automáticos + gestión manual) */}
            {segModalId && (() => {
                const venta = sales.find(s => s.id === segModalId);
                const historial = seguimiento[segModalId] ?? [];
                return (
                    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4 max-h-[88vh] overflow-y-auto">
                            <div className="flex items-center justify-between">
                                <h4 className="font-black text-slate-800 text-base flex items-center gap-2">
                                    <ClipboardList className="w-5 h-5 text-blue-600" />
                                    Seguimiento de Cobro
                                </h4>
                                <button onClick={() => setSegModalId(null)} className="text-slate-400 hover:text-slate-600">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="bg-slate-50 rounded-xl p-3 text-xs space-y-1">
                                <p className="text-slate-500">Cliente: <span className="font-bold text-slate-800">{venta?.cliente?.business_name ?? '—'}</span></p>
                                <p className="text-slate-500">Factura: <span className="font-bold text-slate-800">{venta?.numero_factura || '—'}</span></p>
                            </div>

                            {/* Registrar gestión manual */}
                            <div className="border border-slate-200 rounded-xl p-3 space-y-3">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Registrar gestión</p>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400">Tipo</label>
                                        <select
                                            value={segTipo}
                                            onChange={e => setSegTipo(e.target.value as Exclude<SeguimientoTipo, 'correo_recordatorio'>)}
                                            className="w-full mt-1 text-sm border border-slate-200 rounded-lg px-2 py-1.5 bg-white"
                                        >
                                            {MANUAL_TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400">Fecha</label>
                                        <Input type="date" value={segFecha} onChange={e => setSegFecha(e.target.value)} className="mt-1 h-9 text-sm" />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400">Descripción</label>
                                    <textarea
                                        value={segDescripcion}
                                        onChange={e => setSegDescripcion(e.target.value)}
                                        placeholder="Ej: Llamé al cliente, confirma pago para el viernes..."
                                        className="w-full mt-1 p-2 border border-slate-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
                                        rows={2}
                                    />
                                </div>
                                <Button
                                    onClick={handleSaveSeg}
                                    disabled={savingSeg}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white h-9 text-xs font-bold gap-1"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    {savingSeg ? 'Registrando...' : 'Registrar gestión'}
                                </Button>
                            </div>

                            {/* Bitácora */}
                            <div>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Bitácora ({historial.length})</p>
                                {historial.length === 0 ? (
                                    <p className="text-sm text-slate-400 text-center py-6">Aún no hay gestiones registradas para esta factura.</p>
                                ) : (
                                    <div className="space-y-2">
                                        {historial.map(e => (
                                            <div key={e.id} className="border border-slate-100 rounded-lg p-3 space-y-1">
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${SEG_TIPO_COLOR[e.tipo]}`}>
                                                        {segIcon(e.tipo)}
                                                        {SEG_TIPO_LABEL[e.tipo]}
                                                    </span>
                                                    <div className="flex items-center gap-2">
                                                        {e.es_automatico ? (
                                                            <span className="text-[10px] text-slate-400">Automático</span>
                                                        ) : (
                                                            <button onClick={() => handleDeleteSeg(e.id)} className="text-slate-300 hover:text-red-500" title="Eliminar">
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                                <p className="text-xs text-slate-700 whitespace-pre-line">{e.descripcion || '—'}</p>
                                                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                                                    <span>{formatFecha(e.fecha)}</span>
                                                    {e.test_mode && <span className="px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 font-bold">Prueba</span>}
                                                    {e.recipient_email && <span className="truncate">· {e.recipient_email}</span>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <Button variant="outline" onClick={() => setSegModalId(null)} className="w-full">
                                Cerrar
                            </Button>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
}
