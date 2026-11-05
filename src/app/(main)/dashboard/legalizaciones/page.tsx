'use client';

import { useState } from 'react';
import { ArrowLeft, ShieldAlert } from 'lucide-react';
import { useAuthStore } from '@/features/auth/store/authStore';
import { AnticiposPanel } from '@/features/legalizaciones/components/AnticiposPanel';
import { LegalizacionDetail } from '@/features/legalizaciones/components/LegalizacionDetail';
import { LegalizacionForm } from '@/features/legalizaciones/components/LegalizacionForm';
import { LegalizacionesList } from '@/features/legalizaciones/components/LegalizacionesList';
import type { Legalizacion } from '@/features/legalizaciones/types/legalizacion.types';

type View =
  | { name: 'list' }
  | { name: 'form'; editing?: Legalizacion }
  | { name: 'detail'; id: string };

type Tab = 'legalizaciones' | 'anticipos';

const TABS: Array<{ key: Tab; label: string }> = [
  { key: 'legalizaciones', label: 'Legalizaciones' },
  { key: 'anticipos', label: 'Anticipos' },
];

export default function LegalizacionesPage() {
  const profile = useAuthStore((state) => state.profile);
  const isLoading = useAuthStore((state) => state.isLoading);
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const [view, setView] = useState<View>({ name: 'list' });
  const [tab, setTab] = useState<Tab>('legalizaciones');

  // Solo la carga inicial oculta la página: un refresco en segundo plano no debe
  // desmontar el formulario y hacer perder lo digitado.
  if (isLoading && !profile) return null;

  if (!hasPermission('legalizaciones.view')) {
    return (
      <div className="max-w-lg mx-auto mt-16 text-center space-y-3">
        <ShieldAlert className="w-10 h-10 text-slate-300 mx-auto" />
        <h1 className="text-lg font-bold text-slate-800">No tienes acceso a Legalizaciones</h1>
        <p className="text-sm text-slate-500">
          Solicita al administrador que te habilite el permiso para registrar legalizaciones.
        </p>
      </div>
    );
  }

  const goToList = () => setView({ name: 'list' });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {view.name !== 'list' && (
        <button
          onClick={goToList}
          className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Volver a Legalizaciones
        </button>
      )}

      {view.name === 'list' && (
        <>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Viáticos, reintegros y anticipos</h1>
            <p className="text-sm text-slate-500 mt-0.5">Registra tus gastos con soportes y genera el formato de legalización</p>
          </div>
          <div className="flex gap-1 border-b border-slate-200">
            {TABS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-px transition-colors ${tab === key ? 'border-gray-900 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-700'}`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm">
            {tab === 'legalizaciones' ? (
              <LegalizacionesList
                canApprove={hasPermission('legalizaciones.approve')}
                onNew={() => setView({ name: 'form' })}
                onOpen={(id) => setView({ name: 'detail', id })}
              />
            ) : (
              <AnticiposPanel />
            )}
          </div>
        </>
      )}

      {view.name === 'form' && (
        <LegalizacionForm
          key={view.editing?.id ?? 'new'}
          initialData={view.editing}
          onDone={(id) => setView({ name: 'detail', id })}
          onCancel={goToList}
        />
      )}

      {view.name === 'detail' && (
        <LegalizacionDetail
          key={view.id}
          id={view.id}
          onEdit={(editing) => setView({ name: 'form', editing })}
          onDeleted={goToList}
        />
      )}
    </div>
  );
}
