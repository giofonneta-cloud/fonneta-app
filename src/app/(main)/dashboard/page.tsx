import {
  FolderKanban,
  Users,
  CreditCard,
  MessageSquare,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const supabase = await createClient();

  const SYSTEM_START_DATE = '2026-01-01T00:00:00Z';

  // 1. Fetch Stats
  const { count: projectsCount } = await supabase
    .from('projects')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', SYSTEM_START_DATE);

  const { count: providersCount } = await supabase
    .from('providers')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', SYSTEM_START_DATE);

  // 2. Fetch Recent Activity (Projects & Providers)
  const { data: recentProjects } = await supabase
    .from('projects')
    .select('name, created_at')
    .gte('created_at', SYSTEM_START_DATE)
    .order('created_at', { ascending: false })
    .limit(3);

  const { data: recentProviders } = await supabase
    .from('providers')
    .select('business_name, created_at')
    .gte('created_at', SYSTEM_START_DATE)
    .order('created_at', { ascending: false })
    .limit(3);

  // Combine and sort activity
  const activities = [
    ...(recentProjects?.map(p => ({
      text: `Nuevo proyecto '${p.name}' creado`,
      time: p.created_at,
      type: 'project'
    })) || []),
    ...(recentProviders?.map(p => ({
      text: `Nuevo proveedor '${p.business_name}' registrado`,
      time: p.created_at,
      type: 'provider'
    })) || [])
  ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
   .slice(0, 5);

  const stats = [
    { label: 'Proyectos Activos', value: projectsCount || 0, icon: FolderKanban, color: 'text-blue-600 bg-blue-50' },
    { label: 'Proveedores Registrados', value: providersCount || 0, icon: Users, color: 'text-purple-600 bg-purple-50' },
    { label: 'Margen Promedio', value: '34%' /* Placeholder */, icon: TrendingUp, color: 'text-green-600 bg-green-50' },
    { label: 'Alertas Pendientes', value: '3' /* Placeholder */, icon: AlertCircle, color: 'text-orange-600 bg-orange-50' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Resumen Ejecutivo</h1>
          <p className="text-gray-500 font-medium mt-1">Bienvenido de nuevo. Aquí tienes la realidad de tu agencia hoy.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:translate-y-[-4px] transition-all">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 border ${stat.color}`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{stat.label}</p>
            <p className="text-2xl font-black text-gray-900 mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
          <h3 className="text-xl font-black text-gray-900 mb-6">Actividad Reciente</h3>
          <div className="space-y-4">
            {activities.length > 0 ? (
              activities.map((activity, index) => (
                <ActivityItem 
                  key={index} 
                  text={activity.text} 
                  time={formatDistanceToNow(new Date(activity.time), { addSuffix: true, locale: es })} 
                />
              ))
            ) : (
                <p className="text-gray-500 text-sm">No hay actividad reciente.</p>
            )}
          </div>
        </div>

        <div className="bg-blue-600 p-8 rounded-3xl text-white shadow-xl shadow-blue-100 flex flex-col justify-between">
          <div>
            <h3 className="text-2xl font-black mb-2">Asistente IA Fonnet</h3>
            <p className="text-blue-100 font-medium">Tienes 3 facturas pendientes de validación OCR que podrían afectar el flujo de caja de la próxima semana.</p>
          </div>
          <Link
            href="/dashboard/finance"
            className="mt-6 bg-white text-blue-600 px-6 py-3 rounded-xl font-black text-sm inline-block w-fit hover:bg-blue-50 transition-colors"
          >
            Revisar Finanzas
          </Link>
        </div>
      </div>
    </div>
  );
}

function ActivityItem({ text, time }: { text: string, time: string }) {
  return (
    <div className="flex items-center gap-4 py-2 border-b border-gray-50 last:border-0">
      <div className="w-2 h-2 rounded-full bg-blue-500" />
      <div className="flex-1">
        <p className="text-sm font-bold text-gray-800">{text}</p>
        <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">{time}</p>
      </div>
    </div>
  );
}
