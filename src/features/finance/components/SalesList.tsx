'use client';

import React, { useState, useEffect } from 'react';
import { Venta } from '../types/sales-expenses.types';
import { salesService } from '../services/salesService';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Input } from '@/shared/components/ui/input';
import { Search, Filter } from 'lucide-react';
import { Badge } from '@/shared/components/ui/badge';

export function SalesList() {
    const [sales, setSales] = useState<Venta[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadSales();
    }, []);

    const loadSales = async () => {
        try {
            const data = await salesService.getAllSales();
            setSales(data);
        } catch (error) {
            console.error("Error loading sales", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredSales = sales.filter(sale =>
        (sale.cliente?.business_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (sale.proyecto?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (sale.numero_factura || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Card className="mt-8 border-slate-200 shadow-lg">
            <CardHeader className="bg-slate-50 border-b p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <CardTitle className="text-xl font-bold text-slate-800">Historial de Ventas</CardTitle>
                    <p className="text-xs text-slate-500 font-medium">Registro detallado de transacciones</p>
                </div>
                <div className="relative w-full md:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                        placeholder="Buscar por cliente, proyecto o factura..."
                        className="pl-9 bg-white"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b">
                            <tr>
                                <th className="px-6 py-3 font-semibold">Fecha</th>
                                <th className="px-6 py-3 font-semibold">Factura</th>
                                <th className="px-6 py-3 font-semibold">Cliente</th>
                                <th className="px-6 py-3 font-semibold">Proyecto</th>
                                <th className="px-6 py-3 font-semibold text-right">Valor Neto</th>
                                <th className="px-6 py-3 font-semibold text-right">Total IVA Incl.</th>
                                <th className="px-6 py-3 font-semibold text-center">Estado</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan={7} className="p-8 text-center text-slate-500">Cargando ventas...</td></tr>
                            ) : filteredSales.length === 0 ? (
                                <tr><td colSpan={7} className="p-8 text-center text-slate-500">No hay ventas registradas</td></tr>
                            ) : (
                                filteredSales.map((sale) => (
                                    <tr key={sale.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-slate-700">
                                            {sale.fecha_factura || new Date(sale.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 font-mono text-xs">
                                            {sale.numero_factura || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-blue-600">
                                            {sale.cliente?.business_name || 'Sin cliente'}
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">
                                            {sale.proyecto?.name || 'Sin proyecto'}
                                        </td>
                                        <td className="px-6 py-4 text-right font-mono text-slate-700">
                                            {sale.valor_venta_neto.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-emerald-600">
                                            {sale.total_con_iva.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <Badge variant="secondary" className={
                                                sale.estado_pago === 'pagado' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' :
                                                    sale.estado_pago === 'parcial' ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' :
                                                        'bg-amber-100 text-amber-700 hover:bg-amber-200'
                                            }>
                                                {sale.estado_pago}
                                            </Badge>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
}
