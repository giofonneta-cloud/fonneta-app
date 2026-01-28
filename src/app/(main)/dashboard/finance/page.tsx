'use client';

import React, { useState, useEffect } from 'react';
import { FinanceReportCenter } from '@/features/finance/components/FinanceReportCenter';
import { SalesForm } from '@/features/finance/components/SalesForm';
import { ExpenseForm } from '@/features/finance/components/ExpenseForm';
import { SalesList } from '@/features/finance/components/SalesList';
import { Button } from '@/shared/components/ui/button';
import { Plus, BarChart3, Receipt, DollarSign, ArrowLeft } from 'lucide-react';

export default function FinancePage() {
    const [view, setView] = useState<'reports' | 'sales-form' | 'expense-form'>('reports');
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) return null;

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Context Navigation */}
            {view !== 'reports' && (
                <Button
                    variant="ghost"
                    onClick={() => setView('reports')}
                    className="group flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Volver al Panel de Reportes
                </Button>
            )}

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <DollarSign className="w-10 h-10 text-blue-600 bg-blue-50 p-2 rounded-2xl" />
                        Gestión Financiera
                    </h1>
                    <p className="text-slate-500 font-medium mt-1">
                        {view === 'reports' && "Análisis global de rentabilidad y cumplimiento."}
                        {view === 'sales-form' && "Registrando nuevo ingreso / factura de venta."}
                        {view === 'expense-form' && "Registrando nuevo costo / pago a proveedor."}
                    </p>
                </div>

                {view === 'reports' && (
                    <div className="flex items-center gap-3">
                        <Button
                            onClick={() => setView('sales-form')}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2 shadow-lg shadow-emerald-100"
                        >
                            <Plus className="w-4 h-4" />
                            Registrar Venta
                        </Button>
                        <Button
                            onClick={() => setView('expense-form')}
                            className="bg-slate-900 hover:bg-black text-white font-bold gap-2 shadow-lg shadow-slate-200"
                        >
                            <Receipt className="w-4 h-4" />
                            Registrar Gasto
                        </Button>
                    </div>
                )}
            </div>

            <main className="bg-slate-50/30 rounded-3xl min-h-[600px]">
                {view === 'reports' && (
                    <div className="space-y-12">
                        <FinanceReportCenter />
                        <SalesList />
                    </div>
                )}
                {view === 'sales-form' && <SalesForm onSuccess={() => setView('reports')} />}
                {view === 'expense-form' && <ExpenseForm onSuccess={() => setView('reports')} />}
            </main>
        </div>
    );
}
