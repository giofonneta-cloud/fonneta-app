'use client';

import { useState, useEffect } from 'react';
import { salesService } from '../services/salesService';
import { expensesService } from '../services/expensesService';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, LineChart,
} from 'recharts';
import { TrendingUp } from 'lucide-react';

interface Props {
  period?: string;
  selectedProjects?: string[];
  selectedCostCenters?: string[];
}

interface MonthlyData {
  month: string;
  monthNum: number;
  ingresos: number;
  gastos: number;
  utilidad: number;
}

const MONTHS = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
];

const fmt = (n: number) =>
  n.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });

function getYearMonth(dateStr: string): { year: number; month: number } | null {
  if (!dateStr) return null;
  const part = dateStr.split('T')[0];
  const [y, m] = part.split('-').map(Number);
  if (!y || !m) return null;
  return { year: y, month: m };
}

function isInPeriod(dateStr: string, periodStr?: string): boolean {
  if (!periodStr || periodStr === 'all') return true;
  const ym = getYearMonth(dateStr);
  if (!ym) return false;
  const { year, month } = ym;

  if (periodStr.startsWith('2026-Q')) {
    if (year !== 2026) return false;
    const q = parseInt(periodStr.split('-Q')[1]);
    const start = (q - 1) * 3 + 1;
    return month >= start && month <= start + 2;
  }
  const [py, pm] = periodStr.split('-').map(Number);
  return year === py && month === pm;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-100 rounded-xl shadow-xl p-3 text-sm min-w-[200px]">
      <p className="font-black text-slate-700 mb-2 text-xs uppercase tracking-widest">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full inline-block" style={{ background: p.color }} />
            <span className="text-xs font-medium text-slate-500">{p.name}</span>
          </div>
          <span className="text-xs font-black text-slate-700">{fmt(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

export function MonthlyTrendChart({ period, selectedProjects, selectedCostCenters }: Props) {
  const [data, setData] = useState<MonthlyData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [sales, expenses] = await Promise.all([
          salesService.getAllSales(),
          expensesService.getAllExpenses(),
        ]);

        // Inicializar array de 12 meses
        const monthlyMap: Record<number, MonthlyData> = {};
        for (let i = 1; i <= 12; i++) {
          monthlyMap[i] = {
            month: MONTHS[i - 1],
            monthNum: i,
            ingresos: 0,
            gastos: 0,
            utilidad: 0,
          };
        }

        // Filtrar y agrupar ventas por mes
        sales
          .filter(s => {
            const matchesPeriod = !period || isInPeriod(s.fecha_factura || s.created_at, period);
            const matchesProject = !selectedProjects || selectedProjects.length === 0 || selectedProjects.includes(s.proyecto?.name ?? '');
            const matchesCostCenter = !selectedCostCenters || selectedCostCenters.length === 0 || selectedCostCenters.includes(s.cost_center ?? '');
            return matchesPeriod && matchesProject && matchesCostCenter;
          })
          .forEach(s => {
            const dateStr = s.fecha_factura || s.created_at;
            if (!dateStr) return;
            const part = dateStr.split('T')[0];
            const [, m] = part.split('-').map(Number);
            if (m && monthlyMap[m]) {
              monthlyMap[m].ingresos += Number(s.valor_venta_neto) || 0;
            }
          });

        // Filtrar y agrupar gastos por mes
        expenses
          .filter(e => {
            const matchesPeriod = !period || isInPeriod(e.fecha_radicado || e.created_at, period);
            const matchesCostCenter = !selectedCostCenters || selectedCostCenters.length === 0 || selectedCostCenters.includes(e.cost_center ?? '');
            return matchesPeriod && matchesCostCenter;
          })
          .forEach(e => {
            const dateStr = e.fecha_radicado || e.created_at;
            if (!dateStr) return;
            const part = dateStr.split('T')[0];
            const [, m] = part.split('-').map(Number);
            if (m && monthlyMap[m]) {
              monthlyMap[m].gastos += Number(e.valor_neto) || 0;
            }
          });

        // Calcular utilidad
        Object.values(monthlyMap).forEach(row => {
          row.utilidad = row.ingresos - row.gastos;
        });

        setData(Object.values(monthlyMap).sort((a, b) => a.monthNum - b.monthNum));
      } catch (error) {
        console.error('Error loading monthly trend:', error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [period, selectedProjects, selectedCostCenters]);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 h-96 animate-pulse">
        <div className="h-8 bg-slate-100 rounded w-1/3 mb-6" />
        <div className="h-64 bg-slate-50 rounded" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-bold text-slate-800">Tendencia Mensual 2026</h3>
      </div>
      <ResponsiveContainer width="100%" height={350}>
        <ComposedChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="month" stroke="#94a3b8" />
          <YAxis stroke="#94a3b8" tickFormatter={(v) => `${(v / 1e9).toFixed(1)}B`} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ paddingTop: 20 }} />
          <Bar dataKey="ingresos" fill="#10b981" name="Ingresos" radius={[8, 8, 0, 0]} />
          <Bar dataKey="gastos" fill="#ef4444" name="Gastos" radius={[8, 8, 0, 0]} />
          <Line
            type="monotone"
            dataKey="utilidad"
            stroke="#3b82f6"
            strokeWidth={3}
            name="Utilidad Neta"
            dot={{ fill: '#3b82f6', r: 4 }}
            activeDot={{ r: 6 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
