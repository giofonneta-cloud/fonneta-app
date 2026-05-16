'use client';

import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { GastoExtendido } from '../types/sales-expenses.types';

interface Props {
  expenses: GastoExtendido[];
}

const fmt = (n: number) =>
  n.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const data = payload[0];
  return (
    <div className="bg-white border border-slate-100 rounded-lg shadow-lg p-3 text-sm">
      <p className="font-bold text-slate-700">{data.payload.nombre}</p>
      <p className="text-slate-600">Gastos: {fmt(data.value)}</p>
      <p className="text-slate-500">{data.payload.percentage.toFixed(1)}% del total</p>
    </div>
  );
};

export function TopProveedoresChart({ expenses }: Props) {
  const data = useMemo(() => {
    const proveedores: Record<string, number> = {};

    expenses.forEach(e => {
      const nombre = e.proveedor_nombre || 'Sin proveedor';
      proveedores[nombre] = (proveedores[nombre] || 0) + (Number(e.valor_neto) || 0);
    });

    const total = Object.values(proveedores).reduce((a, b) => a + b, 0);

    return Object.entries(proveedores)
      .map(([nombre, value]) => ({
        nombre: nombre.length > 20 ? nombre.substring(0, 17) + '...' : nombre,
        nombreCompleto: nombre,
        value,
        percentage: total > 0 ? (value / total) * 100 : 0,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [expenses]);

  const total = data.reduce((a, d) => a + d.value, 0);

  const getColor = (idx: number) => {
    const colors = ['#dc2626', '#ef4444', '#f87171', '#fca5a5', '#fee2e2'];
    return colors[idx];
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-slate-800">Top 5 Proveedores</h3>
        <p className="text-xs text-slate-400 mt-1">Por gastos totales</p>
        <p className="text-base font-black text-slate-900 mt-2">{fmt(total)}</p>
      </div>

      {data.length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 120, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis type="number" stroke="#94a3b8" tickFormatter={v => `$${(v / 1e9).toFixed(0)}B`} />
            <YAxis
              type="category"
              dataKey="nombre"
              stroke="#94a3b8"
              width={115}
              tick={{ fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="value" radius={[0, 8, 8, 0]} isAnimationActive={false}>
              {data.map((entry, idx) => (
                <Cell key={idx} fill={getColor(idx)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-80 flex items-center justify-center text-slate-400">
          <p>Sin datos de proveedores</p>
        </div>
      )}

      {/* Summary */}
      {data.length > 0 && (
        <div className="mt-6 pt-4 border-t border-slate-100">
          <p className="text-xs font-bold text-slate-500 uppercase mb-3">Concentración</p>
          <div className="space-y-1.5">
            {data.map((prov, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-black text-slate-700 w-5">#{idx + 1}</span>
                  <span className="text-slate-600 truncate" title={prov.nombreCompleto}>
                    {prov.nombre}
                  </span>
                </div>
                <span className="font-black text-slate-900">{prov.percentage.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
