'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Progress } from '@/shared/components/ui/progress';
import { Separator } from '@/shared/components/ui/separator';
import { TrendingUp, TrendingDown, DollarSign, AlertCircle } from 'lucide-react';

interface FinanceSummaryProps {
    projectName: string;
    ventasFacturado: number;
    ventasCobrado: number;
    gastosAprobado: number;
    gastosPagado: number;
    comisionValor: number;
    comisionPorcentaje: number;
    utilidadProyectada: number;
    utilidadReal: number;
    currency?: string;
}

export function ProjectFinanceSummary({
    projectName,
    ventasFacturado,
    ventasCobrado,
    gastosAprobado,
    gastosPagado,
    comisionValor,
    comisionPorcentaje,
    utilidadProyectada,
    utilidadReal,
    currency = 'COP'
}: FinanceSummaryProps) {
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: currency,
            maximumFractionDigits: 0,
        }).format(value);
    };

    const deviation = utilidadReal - utilidadProyectada;
    const isDeviationNegative = deviation < 0;
    const paddingCobro = ventasFacturado > 0 ? (ventasCobrado / ventasFacturado) * 100 : 0;
    const paddingPago = gastosAprobado > 0 ? (gastosPagado / gastosAprobado) * 100 : 0;

    return (
        <Card className="w-full max-w-2xl bg-gradient-to-br from-white to-slate-50 border-slate-200 shadow-lg animate-in fade-in duration-500">
            <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                    <CardTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-blue-600" />
                        Resumen Financiero
                    </CardTitle>
                    <Badge variant="outline" className="text-xs uppercase tracking-wider">
                        Real-Time Insight
                    </Badge>
                </div>
                <p className="text-sm text-slate-500 font-medium">{projectName}</p>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Ventas */}
                <div className="space-y-2">
                    <div className="flex justify-between items-end">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Ventas (sin IVA)</span>
                        <span className="text-sm font-semibold text-slate-700">{formatCurrency(ventasFacturado)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-500">
                        <span>Cobrado: {formatCurrency(ventasCobrado)}</span>
                        <span>Pendiente: {formatCurrency(ventasFacturado - ventasCobrado)}</span>
                    </div>
                    <Progress value={paddingCobro} className="h-1.5 bg-slate-100" />
                </div>

                <Separator className="bg-slate-100" />

                {/* Gastos */}
                <div className="space-y-2">
                    <div className="flex justify-between items-end">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Gastos (sin IVA)</span>
                        <span className="text-sm font-semibold text-slate-700">{formatCurrency(gastosAprobado)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-500">
                        <span>Pagado: {formatCurrency(gastosPagado)}</span>
                        <span>Pendiente: {formatCurrency(gastosAprobado - gastosPagado)}</span>
                    </div>
                    <Progress value={paddingPago} className="h-1.5 bg-slate-100" />
                </div>

                <Separator className="bg-slate-100" />

                {/* Comisiones y Utilidad */}
                <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-1">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Comisiones</span>
                        <p className="text-lg font-bold text-slate-800">{formatCurrency(comisionValor)}</p>
                        <p className="text-[10px] text-slate-400 font-medium">({comisionPorcentaje}% sobre base)</p>
                    </div>
                    <div className="space-y-1">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Utilidad Neta</span>
                        <div className="flex items-center gap-2">
                            <p className="text-lg font-bold text-slate-900">{formatCurrency(utilidadReal)}</p>
                            {isDeviationNegative ? (
                                <TrendingDown className="w-4 h-4 text-rose-500" />
                            ) : (
                                <TrendingUp className="w-4 h-4 text-emerald-500" />
                            )}
                        </div>
                        <p className="text-[10px] font-medium text-slate-500">
                            Proyectada: {formatCurrency(utilidadProyectada)}
                        </p>
                    </div>
                </div>

                {isDeviationNegative && (
                    <div className="bg-rose-50 p-3 rounded-lg flex items-start gap-3 border border-rose-100">
                        <AlertCircle className="w-4 h-4 text-rose-500 mt-0.5" />
                        <div className="space-y-1">
                            <p className="text-xs font-bold text-rose-800">Desviación Negativa</p>
                            <p className="text-[10px] text-rose-600 leading-relaxed md:w-[80%]">
                                La utilidad real está {formatCurrency(Math.abs(deviation))} por debajo de la proyección inicial. Revisa los gastos extraordinarios.
                            </p>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
