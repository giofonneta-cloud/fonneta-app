'use client';

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from 'recharts';
import { ArrowUpRight, ArrowDownRight, Wallet, TrendingUp, AlertCircle } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

const data = [
    { name: 'Caja Inicial', value: 45000 },
    { name: 'Facturación S1', value: 12000 },
    { name: 'Pagos S1', value: -8000 },
    { name: 'Facturación S2', value: 15000 },
    { name: 'Pagos S2', value: -10000 },
    { name: 'Proyectado', value: 54000 },
];

export function FinanceDashboard() {
    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Top Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatCard label="Flujo Neto" value="$41,000" trend="+12%" icon={Wallet} color="blue" />
                <StatCard label="Ingresos (30d)" value="$15,000" trend="+5%" icon={ArrowUpRight} color="green" />
                <StatCard label="Egresos (30d)" value="$8,000" trend="-2%" icon={ArrowDownRight} color="red" />
                <StatCard label="Rentabilidad" value="34%" trend="+2.5%" icon={TrendingUp} color="purple" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Waterfall Chart */}
                <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h3 className="text-xl font-black text-gray-900 tracking-tight">Flujo de Caja Proyectado</h3>
                            <p className="text-sm text-gray-400 font-bold uppercase tracking-widest mt-1">Próximos 30 días</p>
                        </div>
                        <div className="flex gap-2">
                            <span className="flex items-center gap-1 text-xs font-black text-green-500 bg-green-50 px-3 py-1.5 rounded-full border border-green-100">
                                POSICIÓN SALUDABLE
                            </span>
                        </div>
                    </div>

                    <div className="h-[400px] w-full mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                                />
                                <Tooltip
                                    cursor={{ fill: 'transparent' }}
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            return (
                                                <div className="bg-gray-900 text-white p-3 rounded-xl shadow-xl border border-gray-800">
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{payload[0].payload.name}</p>
                                                    <p className="text-lg font-black">${payload[0].value?.toLocaleString()}</p>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Bar dataKey="value" radius={[8, 8, 8, 8]} barSize={40}>
                                    {data.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={entry.value > 0 ? (index === data.length - 1 ? '#4F46E5' : '#10B981') : '#EF4444'}
                                            fillOpacity={index === data.length - 1 ? 1 : 0.8}
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Risk Alerts */}
                <div className="space-y-6">
                    <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                        <h3 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 text-orange-500" />
                            Alertas de Riesgo
                        </h3>
                        <div className="space-y-4">
                            <RiskItem title="Proyecto: Navidad 2026" subtitle="5 días sin facturar" level="high" />
                            <RiskItem title="Margen Bajo: Revista Mayo" subtitle="Desviación -15%" level="medium" />
                            <RiskItem title="Vencimiento RUT" subtitle="Proveedor: Los Andes" level="low" />
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-8 rounded-3xl text-white shadow-xl">
                        <h3 className="text-lg font-black mb-2">TRM del Día</h3>
                        <div className="flex items-end gap-3">
                            <span className="text-4xl font-black">$3,945.50</span>
                            <span className="text-sm font-bold text-green-400 pb-1.5 lowercase">cop/usd</span>
                        </div>
                        <p className="text-xs text-gray-400 font-bold mt-4 uppercase tracking-widest">Actualizado: 07:00 AM</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({ label, value, trend, icon: Icon, color }: { label: string, value: string, trend: string, icon: any, color: string }) {
    const colors: any = {
        blue: 'text-blue-600 bg-blue-50 border-blue-100',
        green: 'text-green-600 bg-green-50 border-green-100',
        red: 'text-red-600 bg-red-50 border-red-100',
        purple: 'text-purple-600 bg-purple-50 border-purple-100',
    };

    return (
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:translate-y-[-4px] transition-all group">
            <div className="flex justify-between items-start mb-4">
                <div className={cn("p-2 rounded-xl border", colors[color])}>
                    <Icon className="w-5 h-5" />
                </div>
                <span className={cn(
                    "text-[10px] font-black px-2 py-1 rounded-full",
                    trend.startsWith('+') ? "text-green-600 bg-green-50" : "text-red-600 bg-red-50"
                )}>
                    {trend}
                </span>
            </div>
            <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{label}</p>
                <p className="text-2xl font-black text-gray-900 mt-1">{value}</p>
            </div>
        </div>
    );
}

function RiskItem({ title, subtitle, level }: { title: string, subtitle: string, level: 'high' | 'medium' | 'low' }) {
    const levels = {
        high: 'bg-red-500',
        medium: 'bg-orange-500',
        low: 'bg-yellow-500'
    };

    return (
        <div className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer group">
            <div className={cn("w-2 h-8 rounded-full", levels[level])} />
            <div>
                <h4 className="text-sm font-bold text-gray-800">{title}</h4>
                <p className="text-xs text-gray-400 font-medium">{subtitle}</p>
            </div>
        </div>
    );
}
