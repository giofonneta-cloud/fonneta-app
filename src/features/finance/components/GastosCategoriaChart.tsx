'use client';

import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { GastoExtendido } from '../types/sales-expenses.types';

interface Props {
  expenses: GastoExtendido[];
}

const fmt = (n: number) =>
  n.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });

const COLORS = [
  '#3b82f6', // Azul
  '#10b981', // Verde
  '#f59e0b', // Ámbar
  '#ef4444', // Rojo
  '#8b5cf6', // Púrpura
  '#06b6d4', // Cyan
  '#ec4899', // Rosa
  '#6366f1', // Índigo
  '#14b8a6', // Teal
  '#f97316', // Orange
];

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const data = payload[0];
  return (
    <div className="bg-white border border-slate-100 rounded-lg shadow-lg p-3 text-sm">
      <p className="font-bold text-slate-700">{data.payload.nombre}</p>
      <p className="text-slate-600">Valor: {fmt(data.value)}</p>
      <p className="text-slate-500">{data.payload.percentage.toFixed(1)}%</p>
    </div>
  );
};

export function GastosCategoriaChart({ expenses }: Props) {
  const data = useMemo(() => {
    const categorias: Record<string, number> = {};

    expenses.forEach(e => {
      const cat = e.categoria || 'Sin categoría';
      categorias[cat] = (categorias[cat] || 0) + (Number(e.valor_neto) || 0);
    });

    const total = Object.values(categorias).reduce((a, b) => a + b, 0);

    return Object.entries(categorias)
      .map(([nombre, value]) => ({
        nombre: nombre.length > 25 ? nombre.substring(0, 22) + '...' : nombre,
        nombreCompleto: nombre,
        value,
        percentage: total > 0 ? (value / total) * 100 : 0,
      }))
      .sort((a, b) => b.value - a.value)
      .filter(d => d.value > 0);
  }, [expenses]);

  const total = data.reduce((a, d) => a + d.value, 0);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-slate-800">Gastos por Categoría</h3>
        <p className="text-xs text-slate-400 mt-1">Distribución de costos operacionales</p>
        <p className="text-base font-black text-slate-900 mt-2">{fmt(total)}</p>
      </div>

      {data.length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 200, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis type="number" stroke="#94a3b8" tickFormatter={v => `$${(v / 1e9).toFixed(1)}B`} />
            <YAxis
              type="category"
              dataKey="nombre"
              stroke="#94a3b8"
              width={195}
              tick={{ fontSize: 11 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="value" radius={[0, 8, 8, 0]} isAnimationActive={false}>
              {data.map((entry, idx) => (
                <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-80 flex items-center justify-center text-slate-400">
          <p>Sin datos de gastos</p>
        </div>
      )}

      {/* Top Categories Summary */}
      {data.length > 0 && (
        <div className="mt-6 pt-4 border-t border-slate-100">
          <p className="text-xs font-bold text-slate-500 uppercase mb-3">Top categorías</p>
          <div className="space-y-2">
            {data.slice(0, 5).map((cat, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ background: COLORS[idx % COLORS.length] }}
                  />
                  <span className="text-slate-600 truncate" title={cat.nombreCompleto}>
                    {cat.nombre}
                  </span>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="font-black text-slate-900">{cat.percentage.toFixed(1)}%</span>
                  <span className="text-slate-400 ml-2">{fmt(cat.value)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
