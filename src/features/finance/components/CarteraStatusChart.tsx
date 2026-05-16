'use client';

import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Venta } from '../types/sales-expenses.types';

interface Props {
  sales: Venta[];
}

const fmt = (n: number) =>
  n.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });

const COLORS = {
  pagado: '#10b981',
  parcial: '#3b82f6',
  pendiente: '#ef4444',
};

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const data = payload[0];
  return (
    <div className="bg-white border border-slate-100 rounded-lg shadow-lg p-3 text-sm">
      <p className="font-bold text-slate-700">{data.name}</p>
      <p className="text-slate-600">Valor: {fmt(data.value)}</p>
      <p className="text-slate-500">{data.payload.percentage.toFixed(1)}%</p>
    </div>
  );
};

export function CarteraStatusChart({ sales }: Props) {
  const data = useMemo(() => {
    const pagado = sales
      .filter(s => s.estado_pago === 'pagado')
      .reduce((a, s) => a + (Number(s.total_con_iva) || 0), 0);

    const parcial = sales
      .filter(s => s.estado_pago === 'parcial')
      .reduce((a, s) => a + (Number(s.total_con_iva) - Number(s.valor_pagado || 0)), 0);

    const pendiente = sales
      .filter(s => s.estado_pago === 'pendiente')
      .reduce((a, s) => a + (Number(s.total_con_iva) || 0), 0);

    const total = pagado + parcial + pendiente;

    return [
      {
        name: 'Pagado',
        value: pagado,
        percentage: total > 0 ? (pagado / total) * 100 : 0,
      },
      {
        name: 'Parcial',
        value: parcial,
        percentage: total > 0 ? (parcial / total) * 100 : 0,
      },
      {
        name: 'Pendiente',
        value: pendiente,
        percentage: total > 0 ? (pendiente / total) * 100 : 0,
      },
    ].filter(d => d.value > 0);
  }, [sales]);

  const total = data.reduce((a, d) => a + d.value, 0);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-slate-800">Estado de Cartera (CXC)</h3>
        <p className="text-xs text-slate-400 mt-1">Distribución de facturas por estado de pago</p>
        <p className="text-base font-black text-slate-900 mt-2">{fmt(total)}</p>
      </div>

      {data.length > 0 ? (
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((entry, idx) => {
                const colorKey = entry.name.toLowerCase() as keyof typeof COLORS;
                return <Cell key={idx} fill={COLORS[colorKey]} />;
              })}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value, entry: any) => `${value}: ${fmt(entry.payload.value)}`}
            />
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-80 flex items-center justify-center text-slate-400">
          <p>Sin datos de cartera</p>
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 mt-6 pt-4 border-t border-slate-100">
        {[
          { label: 'Pagado', key: 'pagado', color: 'text-emerald-600' },
          { label: 'Parcial', key: 'parcial', color: 'text-blue-600' },
          { label: 'Pendiente', key: 'pendiente', color: 'text-rose-600' },
        ].map(s => {
          const item = data.find(d => d.name === s.label);
          return (
            <div key={s.key} className="text-center">
              <p className="text-[10px] font-bold text-slate-500 uppercase">
                {s.label}
              </p>
              <p className={`text-sm font-black mt-1 ${s.color}`}>
                {item ? `${item.percentage.toFixed(0)}%` : '0%'}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                {item ? fmt(item.value) : fmt(0)}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
