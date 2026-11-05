'use client';

import { useCallback, useEffect, useState } from 'react';
import { Plus, Wallet } from 'lucide-react';
import { useAuthStore } from '@/features/auth/store/authStore';
import { useParametros } from '@/features/admin/hooks/useParametros';
import { anticiposService, legalizacionesService } from '../services/legalizacionesService';
import type { Anticipo, BeneficiarioTipo } from '../types/legalizacion.types';
import { ANTICIPO_STATUS_COLORS, ANTICIPO_STATUS_LABELS } from '../types/legalizacion.types';
import { errorMessage, formatCOP, formatDate, INPUT_CLASS, LABEL_CLASS, todayISO } from './legalizacionFormat';

const LINK_BTN = 'text-xs font-semibold text-blue-600 hover:underline disabled:opacity-50';
const LINK_BTN_DANGER = 'text-xs font-semibold text-red-600 hover:underline disabled:opacity-50';

type RowAction = { id: string; kind: 'rechazar' | 'pagar' } | null;

interface FormProps {
  onCreated: () => void;
  onCancel: () => void;
}

function AnticipoForm({ onCreated, onCancel }: FormProps) {
  const profile = useAuthStore((state) => state.profile);
  const { opciones: centrosCosto } = useParametros('centros_costo');
  const [tipo, setTipo] = useState<BeneficiarioTipo>('empleado');
  const [nombre, setNombre] = useState('');
  const [documento, setDocumento] = useState('');
  const [monto, setMonto] = useState('');
  const [motivo, setMotivo] = useState('');
  const [costCenter, setCostCenter] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const profileId = profile?.id;
  const profileRole = profile?.role;
  const profileName = profile?.full_name ?? null;
  const profileEmail = profile?.email ?? '';

  useEffect(() => {
    if (!profileId || !profileRole) return;
    legalizacionesService
      .getBeneficiarioDefaults({ id: profileId, role: profileRole, full_name: profileName, email: profileEmail })
      .then((defaults) => {
        setTipo(defaults.tipo);
        setNombre((prev) => prev || defaults.nombre);
        setDocumento((prev) => prev || defaults.documento);
      })
      .catch(console.error);
  }, [profileId, profileRole, profileName, profileEmail]);

  const submit = async () => {
    const valor = Number(monto);
    if (!nombre.trim() || !motivo.trim() || !(valor > 0)) {
      setError('Indica nombre, motivo y un monto mayor a cero.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await anticiposService.create({
        beneficiario_tipo: tipo,
        beneficiario_nombre: nombre.trim(),
        beneficiario_documento: documento.trim() || null,
        monto: valor,
        motivo: motivo.trim(),
        cost_center: costCenter || null,
        project_id: null,
      });
      onCreated();
    } catch (err) {
      setError(errorMessage(err, 'No se pudo solicitar el anticipo.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 border border-slate-200 rounded-xl space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <div>
          <label className={LABEL_CLASS}>Nombre</label>
          <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} className={INPUT_CLASS} />
        </div>
        <div>
          <label className={LABEL_CLASS}>Identificación</label>
          <input type="text" value={documento} onChange={(e) => setDocumento(e.target.value)} className={INPUT_CLASS} />
        </div>
        <div>
          <label className={LABEL_CLASS}>Monto solicitado</label>
          <input type="number" min="0" step="any" value={monto} onChange={(e) => setMonto(e.target.value)} className={INPUT_CLASS} />
        </div>
        <div>
          <label className={LABEL_CLASS}>Centro de costo</label>
          <select value={costCenter} onChange={(e) => setCostCenter(e.target.value)} className={INPUT_CLASS}>
            <option value="">Selecciona...</option>
            {centrosCosto.map((c) => <option key={c.id} value={c.etiqueta}>{c.etiqueta}</option>)}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className={LABEL_CLASS}>Motivo</label>
          <input type="text" value={motivo} onChange={(e) => setMotivo(e.target.value)} className={INPUT_CLASS} />
        </div>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex justify-end gap-3">
        <button onClick={onCancel} disabled={saving} className="px-4 py-2 text-sm font-semibold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50">Cancelar</button>
        <button onClick={submit} disabled={saving} className="px-4 py-2 text-sm font-semibold text-white bg-gray-900 rounded-lg hover:bg-black disabled:opacity-50">
          {saving ? 'Enviando...' : 'Solicitar anticipo'}
        </button>
      </div>
    </div>
  );
}

export function AnticiposPanel() {
  const profile = useAuthStore((state) => state.profile);
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const [anticipos, setAnticipos] = useState<Anticipo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [rowAction, setRowAction] = useState<RowAction>(null);
  const [motivo, setMotivo] = useState('');
  const [fecha, setFecha] = useState(todayISO());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setAnticipos(await anticiposService.getAll());
    } catch (err) {
      setError(errorMessage(err, 'No se pudieron cargar los anticipos.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const act = async (action: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await action();
      setRowAction(null);
      setMotivo('');
      await load();
    } catch (err) {
      setError(errorMessage(err, 'No se pudo completar la acción.'));
    } finally {
      setBusy(false);
    }
  };

  const canApprove = hasPermission('legalizaciones.approve');
  const isAdmin = profile?.role === 'admin';

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-800">Anticipos</h3>
          <p className="text-xs text-slate-400 mt-0.5">Solo si necesitas el dinero antes del gasto. Al pagarse, se legaliza con sus soportes.</p>
        </div>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-black text-white text-sm font-semibold rounded-lg transition-colors shadow-sm">
            <Plus className="w-4 h-4" />
            Solicitar anticipo
          </button>
        )}
      </div>

      {showForm && (
        <AnticipoForm
          onCancel={() => setShowForm(false)}
          onCreated={() => {
            setShowForm(false);
            load();
          }}
        />
      )}

      {error && <p className="px-4 py-2.5 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</p>}

      <div className="overflow-x-auto border border-slate-100 rounded-xl">
        <table className="w-full min-w-[820px] text-sm">
          <thead className="bg-slate-50">
            <tr className="text-left text-xs font-bold text-slate-500">
              <th className="px-4 py-3">Número</th>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Beneficiario</th>
              <th className="px-4 py-3">Motivo</th>
              <th className="px-4 py-3 text-right">Monto</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && <tr><td colSpan={7} className="py-12 text-center text-sm text-slate-400">Cargando...</td></tr>}
            {!loading && anticipos.length === 0 && (
              <tr>
                <td colSpan={7} className="py-14 text-center">
                  <Wallet className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                  <p className="text-sm font-bold text-slate-400">No hay anticipos registrados.</p>
                </td>
              </tr>
            )}
            {!loading && anticipos.map((a) => {
              const isOwner = a.user_id === profile?.id;
              const canDecide = canApprove && a.status === 'solicitado' && (!isOwner || isAdmin);
              const canPay = canApprove && a.status === 'aprobado';
              const canDelete = isOwner && (a.status === 'solicitado' || a.status === 'rechazado');
              const active = rowAction?.id === a.id ? rowAction.kind : null;

              return (
                <tr key={a.id} className="align-top">
                  <td className="px-4 py-3 font-bold text-slate-800 whitespace-nowrap">{a.numero}</td>
                  <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{formatDate(a.created_at)}</td>
                  <td className="px-4 py-3 text-slate-700">{a.beneficiario_nombre}</td>
                  <td className="px-4 py-3 text-slate-500">
                    {a.motivo}
                    {a.status === 'rechazado' && a.motivo_rechazo && <span className="block text-xs text-red-600 mt-0.5">Rechazado: {a.motivo_rechazo}</span>}
                    {a.fecha_pago && <span className="block text-xs text-slate-400 mt-0.5">Pagado el {formatDate(a.fecha_pago)}</span>}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-slate-800 whitespace-nowrap">{formatCOP(a.monto)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${ANTICIPO_STATUS_COLORS[a.status]}`}>
                      {ANTICIPO_STATUS_LABELS[a.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {active === 'rechazar' && (
                      <div className="space-y-2 min-w-[190px]">
                        <input type="text" value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Motivo del rechazo" aria-label="Motivo del rechazo" className={INPUT_CLASS} />
                        <div className="flex gap-3">
                          <button onClick={() => act(() => anticiposService.decidir(a.id, false, motivo))} disabled={busy || !motivo.trim()} className={LINK_BTN_DANGER}>Rechazar</button>
                          <button onClick={() => setRowAction(null)} disabled={busy} className={LINK_BTN}>Cancelar</button>
                        </div>
                      </div>
                    )}
                    {active === 'pagar' && (
                      <div className="space-y-2 min-w-[190px]">
                        <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} aria-label="Fecha de pago" className={INPUT_CLASS} />
                        <div className="flex gap-3">
                          <button onClick={() => act(() => anticiposService.marcarPagado(a.id, fecha))} disabled={busy || !fecha} className={LINK_BTN}>Confirmar pago</button>
                          <button onClick={() => setRowAction(null)} disabled={busy} className={LINK_BTN}>Cancelar</button>
                        </div>
                      </div>
                    )}
                    {!active && (
                      <div className="flex flex-wrap gap-3">
                        {canDecide && <button onClick={() => act(() => anticiposService.decidir(a.id, true, null))} disabled={busy} className={LINK_BTN}>Aprobar</button>}
                        {canDecide && <button onClick={() => setRowAction({ id: a.id, kind: 'rechazar' })} disabled={busy} className={LINK_BTN_DANGER}>Rechazar</button>}
                        {canPay && <button onClick={() => setRowAction({ id: a.id, kind: 'pagar' })} disabled={busy} className={LINK_BTN}>Marcar pagado</button>}
                        {canDelete && <button onClick={() => act(() => anticiposService.remove(a.id))} disabled={busy} className={LINK_BTN_DANGER}>Eliminar</button>}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
