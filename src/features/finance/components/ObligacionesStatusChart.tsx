'use client';

import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { GastoExtendido } from '../types/sales-expenses.types';

interface Props {
  expenses: GastoExtendido[];
}

const fmt = (n: number) =>
  n.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });

const COLORS = {
  pagado: '#10b981',
  pendiente: '#ef4444',
  solicite_documentos: '#f59e0b',
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

export function ObligacionesStatusChart({ expenses }: Props) {
  const { porPagar, items: data } = useMemo(() => {
    const pagado = expenses
      .filter(e => e.estado_pago === 'pagado')
      .reduce((a, e) => a + (Number(e.total_con_iva) || 0), 0);

    const pendiente = expenses
      .filter(e => e.estado_pago === 'pendiente')
      .reduce((a, e) => a + (Number(e.total_con_iva) || 0), 0);

    const soliciteDocumentos = expenses
      .filter(e => e.estado_pago === 'solicite_documentos')
      .reduce((a, e) => a + (Number(e.total_con_iva) || 0), 0);

    const total = pagado + pendiente + soliciteDocumentos;

    return {
      porPagar: pendiente + soliciteDocumentos,
      items: [
        {
          name: 'Pagado',
          value: pagado,
          percentage: total > 0 ? (pagado / total) * 100 : 0,
        },
        {
          name: 'Pendiente',
          value: pendiente,
          percentage: total > 0 ? (pendiente / total) * 100 : 0,
        },
        {
          name: 'Solicite Documentos',
          value: soliciteDocumentos,
          percentage: total > 0 ? (soliciteDocumentos / total) * 100 : 0,
        },
      ].filter(d => d.value > 0),
    };
  }, [expenses]);

  const total = data.reduce((a, d) => a + d.value, 0);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-slate-800">Estado de Obligaciones (CXP)</h3>
        <p className="text-xs text-slate-400 mt-1">Distribución de gastos por estado de pago</p>
        <div className="flex items-baseline gap-4 mt-2">
          <div>
            <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest">Por pagar</p>
            <p className="text-base font-black text-rose-600">{fmt(porPagar)}</p>
          </div>
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total radicado</p>
            <p className="text-sm font-bold text-slate-500">{fmt(total)}</p>
          </div>
        </div>
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
                const colorKey = entry.name.toLowerCase().replace(/ /g, '_') as keyof typeof COLORS;
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
          <p>Sin datos de obligaciones</p>
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 mt-6 pt-4 border-t border-slate-100">
        {[
          { label: 'Pagado', key: 'pagado', color: 'text-emerald-600' },
          { label: 'Pendiente', key: 'pendiente', color: 'text-rose-600' },
          { label: 'Solicite', key: 'solicite_documentos', color: 'text-amber-600' },
        ].map(s => {
          const item = data.find(d =>
            d.name.toLowerCase().replace(/ /g, '_') === s.key
          );
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
