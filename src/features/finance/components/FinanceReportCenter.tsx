'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import {
    BarChart3,
    Download,
    Filter,
    Search,
    TrendingUp,
    TrendingDown,
    PieChart as PieChartIcon,
    Table as TableIcon,
    FileSpreadsheet,
    FileJson,
    ArrowUpRight,
    ArrowDownRight,
    Target
} from 'lucide-react';
import { Input } from '@/shared/components/ui/input';
import { salesService } from '../services/salesService';
import { expensesService } from '../services/expensesService';

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    PieChart,
    Pie
} from 'recharts';

export function FinanceReportCenter() {
    const [period, setPeriod] = useState('2024-Q1');
    const [stats, setStats] = useState({ income: 0, expenses: 0, projectData: [] as any[] });

    React.useEffect(() => {
        const loadData = async () => {
            try {
                const [sales, expenses] = await Promise.all([
                    salesService.getAllSales(),
                    expensesService.getAllExpenses()
                ]);

                const totalIncome = sales.reduce((acc, curr) => acc + (Number(curr.valor_venta_neto) || 0), 0);
                const totalExpenses = expenses.reduce((acc, curr) => acc + (Number(curr.valor_neto) || 0), 0);

                // Agrupar por proyecto para el gráfico
                const projectsMap: Record<string, { name: string, income: number, expense: number }> = {};
                
                sales.forEach(s => {
                    const name = s.proyecto?.name || 'Varios';
                    if (!projectsMap[name]) projectsMap[name] = { name, income: 0, expense: 0 };
                    projectsMap[name].income += Number(s.valor_venta_neto) || 0;
                });

                expenses.forEach(e => {
                    // Nota: Asumiendo que e tiene proyecto_id y necesitamos su nombre. 
                    // En una implementación real se haría un join o fetch previo.
                    const name = 'Proyecto ' + (e.proyecto_id?.substring(0, 4) || 'Desconocido');
                    if (!projectsMap[name]) projectsMap[name] = { name, income: 0, expense: 0 };
                    projectsMap[name].expense += Number(e.valor_neto) || 0;
                });

                const projectData = Object.values(projectsMap).map(p => ({
                    ...p,
                    profit: p.income - p.expense
                })).sort((a, b) => b.income - a.income).slice(0, 7);

                setStats({ income: totalIncome, expenses: totalExpenses, projectData });
            } catch (e) {
                console.error("Error loading finance stats", e);
            }
        };
        loadData();
    }, []);

    const netIncome = stats.income - stats.expenses;
    const margin = stats.income > 0 ? (netIncome / stats.income) * 100 : 0;

    const fmt = (n: number) => n.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });

    const kpis = [
        { label: 'Ingresos Totales', value: fmt(stats.income), trend: '+12.5%', isUp: true, color: 'emerald' },
        { label: 'Gastos Totales', value: fmt(stats.expenses), trend: '+4.2%', isUp: false, color: 'rose' },
        { label: 'Utilidad Neta', value: fmt(netIncome), trend: '+8.1%', isUp: true, color: 'blue' },
        { label: 'Margen de Utilidad', value: `${margin.toFixed(1)}%`, trend: '+2.4%', isUp: true, color: 'orange' },
    ];

    return (
        <div className="space-y-8 p-1">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div>
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">Centro de Reportes Financieros</h2>
                    <p className="text-sm text-slate-500 font-medium">Análisis en tiempo real de rentabilidad, ventas y costos</p>
                </div>
                <div className="flex items-center gap-3">
                    <Select value={period} onValueChange={setPeriod}>
                        <SelectTrigger className="w-[180px] bg-slate-50 border-none font-bold text-slate-600">
                            <SelectValue placeholder="Periodo" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todo el tiempo</SelectItem>
                            <SelectItem value="2024-Q1">Q1 - 2024</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button variant="outline" size="icon" className="border-slate-200">
                        <Filter className="w-4 h-4 text-slate-500" />
                    </Button>
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold gap-2">
                        <Download className="w-4 h-4" />
                        Exportar
                    </Button>
                </div>
            </div>

            {/* KPIs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {kpis.map((kpi, idx) => (
                    <Card key={idx} className="border-none shadow-xl bg-white overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
                        <CardContent className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{kpi.label}</span>
                                <div className={`p-2 rounded-lg bg-${kpi.color}-50 text-${kpi.color}-600 group-hover:rotate-12 transition-transform`}>
                                    {kpi.isUp ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                                </div>
                            </div>
                            <h4 className="text-3xl font-black text-slate-900 tracking-tighter mb-1">{kpi.value}</h4>
                            <div className="flex items-center gap-2">
                                <span className={`flex items-center text-xs font-bold ${kpi.isUp ? 'text-emerald-500' : 'text-rose-500'}`}>
                                    {kpi.isUp ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                                    {kpi.trend}
                                </span>
                                <span className="text-[10px] text-slate-400 font-medium italic text-nowrap">vs mes anterior</span>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Chart Section */}
                <Card className="lg:col-span-8 border-slate-200 shadow-sm overflow-hidden min-h-[500px]">
                    <CardHeader className="bg-slate-50/50 border-b p-6">
                        <div className="flex items-center justify-between">
                            <div className="flex gap-4">
                                <CardTitle className="text-lg font-bold">Distribución de Rentabilidad</CardTitle>
                                <Tabs defaultValue="bars">
                                    <TabsList className="h-8 bg-white border border-slate-100">
                                        <TabsTrigger value="bars" className="h-6 px-3"><BarChart3 className="w-3 h-3" /></TabsTrigger>
                                        <TabsTrigger value="pie" className="h-6 px-3"><PieChartIcon className="w-3 h-3" /></TabsTrigger>
                                        <TabsTrigger value="table" className="h-6 px-3"><TableIcon className="w-3 h-3" /></TabsTrigger>
                                    </TabsList>
                                </Tabs>
                            </div>
                            <Button variant="ghost" size="sm" className="text-xs font-bold text-blue-600 gap-1"> Ver detalle completo </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-10 pt-16">
                        <div className="h-[350px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={stats.projectData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis 
                                        dataKey="name" 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                                        dy={10}
                                    />
                                    <YAxis 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                                        tickFormatter={(v) => `$${v/1000}k`}
                                    />
                                    <Tooltip 
                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                                        cursor={{ fill: '#f8fafc' }}
                                    />
                                    <Bar dataKey="income" name="Ingresos" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={40} />
                                    <Bar dataKey="expense" name="Egresos" fill="#f43f5e" radius={[6, 6, 0, 0]} barSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Right Sidebar - Reports & Quick Actions */}
                <div className="lg:col-span-4 space-y-8">
                    {/* Exports List */}
                    <Card className="border-slate-200 shadow-sm overflow-hidden">
                        <CardHeader className="p-6 pb-2">
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <Download className="w-4 h-4 text-blue-500" />
                                Exportaciones Disponibles
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y border-t mt-4">
                                {[
                                    { title: 'Ventas por Línea', icon: FileSpreadsheet, color: 'emerald' },
                                    { title: 'Ejecución de Gastos', icon: FileSpreadsheet, color: 'blue' },
                                    { title: 'Ranking Rentabilidad', icon: PieChartIcon, color: 'orange' },
                                    { title: 'Cartera Pendiente', icon: Target, color: 'rose' },
                                    { title: 'Data JSON API', icon: FileJson, color: 'slate' },
                                ].map((report, i) => (
                                    <button
                                        key={i}
                                        className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors text-left"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded bg-${report.color}-50 text-${report.color}-600`}>
                                                <report.icon className="w-4 h-4" />
                                            </div>
                                            <span className="text-xs font-bold text-slate-700">{report.title}</span>
                                        </div>
                                        <ArrowDownRight className="w-3 h-3 text-slate-300" />
                                    </button>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Progress Card */}
                    <Card className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white border-none shadow-lg">
                        <CardHeader className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <Badge className="bg-white/20 hover:bg-white/30 text-white border-none text-[8px] uppercase tracking-widest font-black">
                                    Meta Trimestral
                                </Badge>
                                <Target className="w-5 h-5 opacity-50" />
                            </div>
                            <CardTitle className="text-2xl font-black mb-1">$5.000M COP</CardTitle>
                            <CardDescription className="text-blue-100 text-xs font-medium">Faltan $1.750M para el objetivo</CardDescription>
                        </CardHeader>
                        <CardContent className="p-6 pt-0 space-y-4">
                            <div className="h-2 w-full bg-white/20 rounded-full overflow-hidden">
                                <div className="h-full w-[65%] bg-emerald-400 rounded-full shadow-[0_0_10px_rgba(52,211,153,0.5)]"></div>
                            </div>
                            <div className="flex justify-between text-[10px] uppercase font-black tracking-tighter opacity-80">
                                <span>65% Completado</span>
                                <span>Q1 v/s Q4 +15%</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
