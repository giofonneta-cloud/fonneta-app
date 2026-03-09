'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { SalesForm } from '@/features/finance/components/SalesForm';
import { ExpenseForm } from '@/features/finance/components/ExpenseForm';
import { SalesList } from '@/features/finance/components/SalesList';
import { ExpensesList } from '@/features/finance/components/ExpensesList';
import { CXCList } from '@/features/finance/components/CXCList';
import { CXPList } from '@/features/finance/components/CXPList';
import { PurchaseOrdersList } from '@/features/finance/components/PurchaseOrdersList';
import { PurchaseOrderForm } from '@/features/finance/components/PurchaseOrderForm';
import { PurchaseOrderPreview } from '@/features/finance/components/PurchaseOrderPreview';
import { FinanceReportCenter } from '@/features/finance/components/FinanceReportCenter';
import { TarifarioList } from '@/features/tarifario/components/TarifarioList';
import { salesService } from '@/features/finance/services/salesService';
import { expensesService } from '@/features/finance/services/expensesService';
import { purchaseOrderService } from '@/features/finance/services/purchaseOrderService';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/shared/components/ui/select';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
import { Button } from '@/shared/components/ui/button';
import {
    TrendingUp, TrendingDown, Plus, Receipt, ArrowLeft,
    DollarSign, CreditCard, BarChart3, Percent, Target,
    Download, FileSpreadsheet, FileJson, PieChart as PieChartIcon,
    AlertCircle, Clock, FileText, ClipboardList,
} from 'lucide-react';
import { Venta } from '@/features/finance/types/sales-expenses.types';
import { GastoExtendido } from '@/features/finance/types/sales-expenses.types';
import type { PurchaseOrder } from '@/features/finance/types/purchase-order.types';

type View = 'dashboard' | 'sales-form' | 'expense-form' | 'oc-form';
type Tab = 'resumen' | 'ventas' | 'gastos' | 'cxc' | 'cxp' | 'oc' | 'tarifario';

const PERIODS = [
    { value: 'all', label: 'Todo el tiempo' },
    { value: '2026-Q1', label: 'Q1 2026' },
    { value: '2026-Q2', label: 'Q2 2026' },
    { value: '2026-Q3', label: 'Q3 2026' },
    { value: '2026-Q4', label: 'Q4 2026' },
    { value: '2026-01', label: 'Enero 2026' },
    { value: '2026-02', label: 'Febrero 2026' },
    { value: '2026-03', label: 'Marzo 2026' },
    { value: '2026-04', label: 'Abril 2026' },
    { value: '2026-05', label: 'Mayo 2026' },
    { value: '2026-06', label: 'Junio 2026' },
    { value: '2026-07', label: 'Julio 2026' },
    { value: '2026-08', label: 'Agosto 2026' },
    { value: '2026-09', label: 'Septiembre 2026' },
    { value: '2026-10', label: 'Octubre 2026' },
    { value: '2026-11', label: 'Noviembre 2026' },
    { value: '2026-12', label: 'Diciembre 2026' },
];

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
    // Formato '2026-01'
    const [py, pm] = periodStr.split('-').map(Number);
    return year === py && month === pm;
}

const GOAL_AMOUNT = 5_000_000_000;

const fmt = (n: number) =>
    n.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });

interface KpiData {
    label: string;
    value: string;
    sub: string;
    Icon: React.ElementType;
    iconBg: string;
    iconColor: string;
    extra?: React.ReactNode;
}

const EXPORTS = [
    { label: 'Ventas por Línea', icon: FileSpreadsheet },
    { label: 'Ejecución de Gastos', icon: FileSpreadsheet },
    { label: 'Ranking Rentabilidad', icon: PieChartIcon },
    { label: 'Cartera Pendiente', icon: AlertCircle },
    { label: 'Data JSON API', icon: FileJson },
];

export default function FinancePage() {
    const [view, setView] = useState<View>('dashboard');
    const [tab, setTab] = useState<Tab>('resumen');
    const [period, setPeriod] = useState('all');
    const [kpis, setKpis] = useState<KpiData[]>([]);
    const [loadingKpis, setLoadingKpis] = useState(true);
    const [isMounted, setIsMounted] = useState(false);
    const [editingSale, setEditingSale] = useState<Venta | null>(null);
    const [editingExpense, setEditingExpense] = useState<GastoExtendido | null>(null);
    const [editingPO, setEditingPO] = useState<PurchaseOrder | null>(null);
    const [previewPO, setPreviewPO] = useState<PurchaseOrder | null>(null);

    useEffect(() => { setIsMounted(true); }, []);

    const loadKPIs = useCallback(async () => {
        setLoadingKpis(true);
        try {
            const [sales, expenses] = await Promise.all([
                salesService.getAllSales(),
                expensesService.getAllExpenses(),
            ]);

            const fs = sales.filter(s => isInPeriod(s.fecha_factura || s.created_at, period));
            const fe = expenses.filter(e => isInPeriod(e.fecha_radicado || e.created_at, period));

            const income = fs.reduce((a, s) => a + (Number(s.valor_venta_neto) || 0), 0);
            const exp = fe.reduce((a, e) => a + (Number(e.valor_neto) || 0), 0);
            const net = income - exp;
            const margin = income > 0 ? (net / income) * 100 : 0;
            const goalPct = Math.min((income / GOAL_AMOUNT) * 100, 100);

            setKpis([
                {
                    label: 'Ingresos Totales',
                    value: fmt(income),
                    sub: `${fs.length} facturas`,
                    Icon: TrendingUp,
                    iconBg: 'bg-emerald-50',
                    iconColor: 'text-emerald-600',
                },
                {
                    label: 'Gastos Totales',
                    value: fmt(exp),
                    sub: `${fe.length} pagos`,
                    Icon: CreditCard,
                    iconBg: 'bg-rose-50',
                    iconColor: 'text-rose-600',
                },
                {
                    label: 'Utilidad Neta',
                    value: fmt(net),
                    sub: net >= 0 ? 'Resultado positivo' : 'Resultado negativo',
                    Icon: DollarSign,
                    iconBg: net >= 0 ? 'bg-blue-50' : 'bg-rose-50',
                    iconColor: net >= 0 ? 'text-blue-600' : 'text-rose-600',
                },
                {
                    label: 'Margen de Utilidad',
                    value: `${margin.toFixed(1)}%`,
                    sub: 'Sobre ingresos brutos',
                    Icon: Percent,
                    iconBg: 'bg-violet-50',
                    iconColor: 'text-violet-600',
                },
                {
                    label: 'Meta Anual',
                    value: `${goalPct.toFixed(0)}%`,
                    sub: goalPct >= 100 ? 'Meta alcanzada' : `Faltan ${fmt(GOAL_AMOUNT - income)}`,
                    Icon: Target,
                    iconBg: 'bg-amber-50',
                    iconColor: 'text-amber-600',
                    extra: (
                        <div className="mt-2.5 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-amber-400 rounded-full transition-all duration-700"
                                style={{ width: `${goalPct}%` }}
                            />
                        </div>
                    ),
                },
            ]);
        } catch (e) {
            console.error('Error loading KPIs', e);
        } finally {
            setLoadingKpis(false);
        }
    }, [period]);

    useEffect(() => {
        if (isMounted) loadKPIs();
    }, [loadKPIs, isMounted]);

    if (!isMounted) return null;

    const periodLabel = PERIODS.find(p => p.value === period)?.label ?? 'Todo el tiempo';

    const goBack = () => {
        setView('dashboard');
        setEditingSale(null);
        setEditingExpense(null);
        setEditingPO(null);
    };

    const handleEditSale = (sale: Venta) => {
        setEditingSale(sale);
        setView('sales-form');
    };

    const handleEditExpense = (expense: GastoExtendido) => {
        setEditingExpense(expense);
        setView('expense-form');
    };

    const handleFormSuccess = () => {
        goBack();
        loadKPIs();
    };

    const handleEditPO = async (po: PurchaseOrder) => {
        try {
            const fullPO = await purchaseOrderService.getPurchaseOrderById(po.id);
            setEditingPO(fullPO);
        } catch {
            setEditingPO(po);
        }
        setView('oc-form');
    };

    const handlePreviewPO = async (po: PurchaseOrder) => {
        try {
            const fullPO = await purchaseOrderService.getPurchaseOrderById(po.id);
            setPreviewPO(fullPO);
        } catch {
            setPreviewPO(po);
        }
    };

    const handlePOFormSuccess = () => {
        goBack();
    };

    const handlePOSent = () => {
        setPreviewPO(null);
    };

    const TABS: { id: Tab; label: string; Icon: React.ElementType; accent?: string }[] = [
        { id: 'resumen', label: 'Resumen', Icon: BarChart3 },
        { id: 'ventas', label: 'Ventas', Icon: TrendingUp },
        { id: 'gastos', label: 'Gastos', Icon: TrendingDown },
        { id: 'cxc', label: 'CXC', Icon: Clock, accent: 'emerald' },
        { id: 'cxp', label: 'CXP', Icon: AlertCircle, accent: 'rose' },
        { id: 'oc', label: 'OC', Icon: FileText, accent: 'blue' },
        { id: 'tarifario', label: 'Tarifario', Icon: ClipboardList, accent: 'violet' },
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-500">

            {/* Back */}
            {view !== 'dashboard' && (
                <button
                    onClick={goBack}
                    className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors group"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Volver al Panel Financiero
                </button>
            )}

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                        Gestión Financiera
                    </h1>
                    <p className="text-sm text-slate-500 mt-0.5">
                        {view === 'dashboard' && `Análisis estratégico · ${periodLabel}`}
                        {view === 'sales-form' && (editingSale ? 'Editando venta registrada' : 'Registrando nueva venta / factura')}
                        {view === 'expense-form' && (editingExpense ? 'Editando gasto registrado' : 'Registrando nuevo gasto / pago')}
                        {view === 'oc-form' && (editingPO ? `Editando OC ${editingPO.po_number}` : 'Nueva orden de compra')}
                    </p>
                </div>

                {view === 'dashboard' && (
                    <div className="flex items-center gap-2 flex-wrap">
                        {/* Period */}
                        <Select value={period} onValueChange={setPeriod}>
                            <SelectTrigger className="w-[148px] bg-white border-slate-200 font-semibold text-slate-700 text-sm h-9">
                                <SelectValue placeholder="Periodo" />
                            </SelectTrigger>
                            <SelectContent>
                                {PERIODS.map(p => (
                                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Export dropdown */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="gap-1.5 h-9 border-slate-200 text-slate-600 font-bold">
                                    <Download className="w-3.5 h-3.5" />
                                    Exportar
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-52">
                                {EXPORTS.map((e, i) => (
                                    <DropdownMenuItem key={i} className="gap-2 cursor-pointer">
                                        <e.icon className="w-4 h-4 text-slate-400" />
                                        <span className="text-sm font-medium">{e.label}</span>
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* Actions */}
                        <Button
                            onClick={() => setView('sales-form')}
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1.5 h-9"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            Nueva Venta
                        </Button>
                        <Button
                            onClick={() => setView('expense-form')}
                            size="sm"
                            className="bg-slate-800 hover:bg-slate-900 text-white font-bold gap-1.5 h-9"
                        >
                            <Receipt className="w-3.5 h-3.5" />
                            Nuevo Gasto
                        </Button>
                    </div>
                )}
            </div>

            {view === 'dashboard' ? (
                <div className="space-y-5">

                    {/* KPI Cards — 5 cards */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                        {loadingKpis
                            ? Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 animate-pulse">
                                    <div className="h-3 bg-slate-100 rounded w-2/3 mb-4" />
                                    <div className="h-7 bg-slate-100 rounded w-full mb-2" />
                                    <div className="h-3 bg-slate-100 rounded w-1/2" />
                                </div>
                            ))
                            : kpis.map((kpi, i) => (
                                <div
                                    key={i}
                                    className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-all duration-200 group"
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-tight">
                                            {kpi.label}
                                        </span>
                                        <div className={`p-2 rounded-xl ${kpi.iconBg} group-hover:scale-110 transition-transform`}>
                                            <kpi.Icon className={`w-4 h-4 ${kpi.iconColor}`} />
                                        </div>
                                    </div>
                                    <p className="text-xl font-black text-slate-900 tracking-tight truncate">
                                        {kpi.value}
                                    </p>
                                    <p className="text-xs text-slate-400 font-medium mt-1">{kpi.sub}</p>
                                    {kpi.extra}
                                </div>
                            ))
                        }
                    </div>

                    {/* Tabs panel */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                        {/* Nav */}
                        <div className="flex border-b border-slate-100 overflow-x-auto">
                            {TABS.map(t => {
                                const isActive = tab === t.id;
                                const accentActive = t.accent === 'emerald'
                                    ? 'border-emerald-500 text-emerald-600 bg-emerald-50/50'
                                    : t.accent === 'rose'
                                        ? 'border-rose-500 text-rose-600 bg-rose-50/50'
                                        : t.accent === 'blue'
                                            ? 'border-blue-500 text-blue-600 bg-blue-50/50'
                                            : t.accent === 'violet'
                                                ? 'border-violet-500 text-violet-600 bg-violet-50/50'
                                                : 'border-blue-600 text-blue-600 bg-blue-50/50';
                                return (
                                    <button
                                        key={t.id}
                                        onClick={() => setTab(t.id)}
                                        className={`flex items-center gap-2 px-5 py-4 text-sm font-bold whitespace-nowrap transition-all border-b-2 ${isActive
                                                ? accentActive
                                                : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                                            }`}
                                    >
                                        <t.Icon className="w-4 h-4" />
                                        {t.label}
                                        {t.id === 'cxc' && (
                                            <span className="ml-0.5 text-[9px] font-black bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">
                                                COBRAR
                                            </span>
                                        )}
                                        {t.id === 'cxp' && (
                                            <span className="ml-0.5 text-[9px] font-black bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded-full">
                                                PAGAR
                                            </span>
                                        )}
                                        {t.id === 'oc' && (
                                            <span className="ml-0.5 text-[9px] font-black bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">
                                                COMPRAS
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Content */}
                        <div className="p-6">
                            {tab === 'resumen' && <FinanceReportCenter period={period} />}
                            {tab === 'ventas' && <SalesList onEdit={handleEditSale} />}
                            {tab === 'gastos' && <ExpensesList onEdit={handleEditExpense} />}
                            {tab === 'cxc' && <CXCList period={period} />}
                            {tab === 'cxp' && <CXPList period={period} />}
                            {tab === 'oc' && (
                                <PurchaseOrdersList
                                    onEdit={handleEditPO}
                                    onPreview={handlePreviewPO}
                                    onNewPO={() => setView('oc-form')}
                                />
                            )}
                            {tab === 'tarifario' && <TarifarioList />}
                        </div>
                    </div>
                </div>
            ) : view === 'sales-form' ? (
                <SalesForm
                    key={editingSale?.id ?? 'new-sale'}
                    initialData={editingSale ?? undefined}
                    onSuccess={handleFormSuccess}
                    onCancel={goBack}
                />
            ) : view === 'expense-form' ? (
                <ExpenseForm
                    key={editingExpense?.id ?? 'new-expense'}
                    initialData={editingExpense ?? undefined}
                    onSuccess={handleFormSuccess}
                    onCancel={goBack}
                />
            ) : (
                <PurchaseOrderForm
                    key={editingPO?.id ?? 'new-po'}
                    initialData={editingPO ?? undefined}
                    onSuccess={handlePOFormSuccess}
                    onCancel={goBack}
                />
            )}

            {/* PO Preview Modal */}
            {previewPO && (
                <PurchaseOrderPreview
                    po={previewPO}
                    onClose={() => setPreviewPO(null)}
                    onEdit={() => {
                        setPreviewPO(null);
                        handleEditPO(previewPO);
                    }}
                    onSent={handlePOSent}
                />
            )}
        </div>
    );
}
