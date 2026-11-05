'use client';

import { useCallback, useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import { useAuthStore } from '@/features/auth/store/authStore';
import { generatePdfBlob } from '@/shared/lib/pdf/generatePdfBlob';
import { legalizacionesService } from '../services/legalizacionesService';
import type { Legalizacion } from '../types/legalizacion.types';
import {
  BENEFICIARIO_TIPO_LABELS,
  LEGALIZACION_STATUS_COLORS,
  LEGALIZACION_STATUS_LABELS,
} from '../types/legalizacion.types';
import { buildLegalizacionHTML } from './legalizacionPdf';
import { LegalizacionItemsTable } from './LegalizacionItemsTable';
import { errorMessage, formatCOP, formatDate, INPUT_CLASS, LABEL_CLASS, todayISO } from './legalizacionFormat';

type Panel = 'revisar' | 'cerrar' | 'eliminar' | null;

const BTN_PRIMARY = 'px-4 py-2 text-sm font-semibold text-white bg-gray-900 rounded-lg hover:bg-black transition-colors disabled:opacity-50';
const BTN_SECONDARY = 'px-4 py-2 text-sm font-semibold text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50';
const BTN_DANGER = 'px-4 py-2 text-sm font-semibold text-red-700 border border-red-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50';

function Dato({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-bold text-slate-400">{label}</dt>
      <dd className="text-sm text-slate-800 mt-0.5 break-words">{value || '—'}</dd>
    </div>
  );
}

interface Props {
  id: string;
  onEdit: (legalizacion: Legalizacion) => void;
  onDeleted: () => void;
}

export function LegalizacionDetail({ id, onEdit, onDeleted }: Props) {
  const profile = useAuthStore((state) => state.profile);
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const [leg, setLeg] = useState<Legalizacion | null>(null);
  const [panel, setPanel] = useState<Panel>(null);
  const [motivo, setMotivo] = useState('');
  const [observaciones, setObservaciones] = useState<Record<string, string>>({});
  const [aprobadas, setAprobadas] = useState<Record<string, boolean>>({});
  const [fecha, setFecha] = useState(todayISO());
  const [nota, setNota] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLeg(await legalizacionesService.getById(id));
    } catch (err) {
      setError(errorMessage(err, 'No se pudo cargar la legalización.'));
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const act = async (action: () => Promise<void>, afterwards?: () => void) => {
    setBusy(true);
    setError(null);
    try {
      await action();
      setPanel(null);
      if (afterwards) afterwards();
      else await load();
    } catch (err) {
      setError(errorMessage(err, 'No se pudo completar la acción.'));
    } finally {
      setBusy(false);
    }
  };

  const toggleObservation = (itemId: string) => {
    setAprobadas((prev) => ({ ...prev, [itemId]: false }));
    setObservaciones((prev) => {
      const next = { ...prev };
      if (itemId in next) delete next[itemId];
      else next[itemId] = '';
      return next;
    });
  };

  const toggleApproval = (itemId: string) => {
    setObservaciones((prev) => {
      const next = { ...prev };
      delete next[itemId];
      return next;
    });
    setAprobadas((prev) => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  const downloadPdf = async () => {
    if (!leg) return;
    setBusy(true);
    setError(null);
    try {
      const blob = await generatePdfBlob(buildLegalizacionHTML(leg), { pageNumbers: true });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Legalizacion_${leg.numero}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(errorMessage(err, 'No se pudo generar el PDF.'));
    } finally {
      setBusy(false);
    }
  };

  if (!leg) {
    return error
      ? <p className="px-4 py-2.5 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</p>
      : <p className="py-12 text-center text-sm text-slate-400">Cargando...</p>;
  }

  const isOwner = leg.user_id === profile?.id;
  const editable = isOwner && (leg.status === 'borrador' || leg.status === 'rechazada');
  const canApprove = hasPermission('legalizaciones.approve');
  const canDecide = canApprove && leg.status === 'enviada' && (!isOwner || profile?.role === 'admin');
  const canClose = canApprove && leg.status === 'aprobada';
  const cierreLabel = Number(leg.saldo_empresa) > 0 ? 'Registrar devolución' : 'Registrar pago';
  const items = leg.items ?? [];
  const porRevisar = items.filter((item) => item.revision_estado !== 'aprobada');
  const aprobadasIds = porRevisar.filter((item) => aprobadas[item.id]).map((item) => item.id);
  const lineasObservadas = Object.entries(observaciones);
  const sinRevisar = porRevisar.length - aprobadasIds.length - lineasObservadas.length;
  const apruebaTodo = lineasObservadas.length === 0 && sinRevisar === 0;
  const observacionesIncompletas = lineasObservadas.some(([, text]) => !text.trim());
  const confirmarDisabled =
    busy || observacionesIncompletas || (!apruebaTodo && lineasObservadas.length === 0 && !motivo.trim());
  const sinDecisiones = aprobadasIds.length === 0 && lineasObservadas.length === 0;

  return (
    <div className="space-y-5">
      <section className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-slate-900">{leg.numero}</h2>
            <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-semibold ${LEGALIZACION_STATUS_COLORS[leg.status]}`}>
              {LEGALIZACION_STATUS_LABELS[leg.status]}
            </span>
          </div>
          <button onClick={downloadPdf} disabled={busy} className={`${BTN_SECONDARY} inline-flex items-center gap-2 self-start`}>
            <Download className="w-4 h-4" />
            Descargar PDF
          </button>
        </div>

        {leg.status === 'rechazada' && leg.motivo_rechazo && (
          <p className="px-4 py-2.5 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            <strong>Devuelta para ajustes:</strong> {leg.motivo_rechazo}
          </p>
        )}

        <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Dato label={BENEFICIARIO_TIPO_LABELS[leg.beneficiario_tipo]} value={leg.beneficiario_nombre} />
          <Dato label="Identificación" value={leg.beneficiario_documento ?? ''} />
          <Dato label="Área / Departamento" value={leg.beneficiario_area ?? ''} />
          <Dato label="Centro de costo" value={leg.cost_center ?? ''} />
          <Dato label="Fecha del reporte" value={formatDate(leg.fecha_reporte)} />
          <Dato label="Período" value={`${formatDate(leg.periodo_desde)} al ${formatDate(leg.periodo_hasta)}`} />
          <Dato label="Motivo" value={leg.motivo ?? ''} />
          {leg.aprobado_por_nombre && <Dato label="Aprobado por" value={`${leg.aprobado_por_nombre} · ${formatDate(leg.aprobado_at)}`} />}
          {leg.cierre_nota && <Dato label="Nota de cierre" value={leg.cierre_nota} />}
        </dl>
      </section>

      <section className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-800">Relación de gastos</h3>
        <LegalizacionItemsTable
          items={items}
          reviewing={canDecide}
          aprobadas={aprobadas}
          observaciones={observaciones}
          onToggleApproval={toggleApproval}
          onToggleObservation={toggleObservation}
          onObservationChange={(itemId, text) => setObservaciones((prev) => ({ ...prev, [itemId]: text }))}
          showSavedReview={leg.status === 'rechazada' || leg.status === 'enviada'}
        />
        <dl className="ml-auto max-w-sm text-sm space-y-1.5 pt-2 border-t border-slate-100">
          <div className="flex justify-between"><dt className="text-slate-500">Total gastos</dt><dd className="font-semibold">{formatCOP(leg.total_gastos)}</dd></div>
          <div className="flex justify-between"><dt className="text-slate-500">Anticipo recibido</dt><dd className="font-semibold">{formatCOP(leg.anticipo_recibido)}</dd></div>
          <div className="flex justify-between"><dt className="text-slate-500">Saldo a favor del beneficiario</dt><dd className="font-bold">{formatCOP(leg.saldo_empleado)}</dd></div>
          <div className="flex justify-between"><dt className="text-slate-500">Saldo a favor de la empresa</dt><dd className="font-bold">{formatCOP(leg.saldo_empresa)}</dd></div>
        </dl>
      </section>

      {error && <p className="px-4 py-2.5 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</p>}

      {panel === 'revisar' && (
        <section className="p-5 bg-white rounded-2xl border border-slate-200 space-y-3">
          <p className="text-sm text-slate-700">
            {apruebaTodo
              ? `Se aprobarán todas las líneas y se crearán los gastos en Finanzas por ${formatCOP(leg.total_gastos)}. Esta acción no se puede deshacer.`
              : `Se devolverá la legalización: ${aprobadasIds.length} aprobada(s), ${lineasObservadas.length} con observación${sinRevisar > 0 ? `, ${sinRevisar} sin revisar` : ''}. Las líneas aprobadas quedan bloqueadas.`}
          </p>
          {observacionesIncompletas && <p className="text-xs font-semibold text-red-600">Escribe la observación de cada línea marcada.</p>}
          {!apruebaTodo && (
            <>
              <label className={LABEL_CLASS}>Motivo general {lineasObservadas.length > 0 ? '(opcional)' : ''}</label>
              <textarea value={motivo} onChange={(e) => setMotivo(e.target.value)} rows={2} className={INPUT_CLASS} />
            </>
          )}
          <div className="flex gap-3">
            <button
              onClick={() => act(async () => {
                await legalizacionesService.revisar(
                  leg.id,
                  aprobadasIds,
                  lineasObservadas.map(([item_id, observacion]) => ({ item_id, observacion })),
                  motivo
                );
                setObservaciones({});
                setAprobadas({});
                setMotivo('');
              })}
              disabled={confirmarDisabled}
              className={BTN_PRIMARY}
            >
              {apruebaTodo ? 'Confirmar aprobación' : 'Devolver con observaciones'}
            </button>
            <button onClick={() => setPanel(null)} disabled={busy} className={BTN_SECONDARY}>Cancelar</button>
          </div>
        </section>
      )}

      {panel === 'cerrar' && (
        <section className="p-5 bg-white rounded-2xl border border-slate-200 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={LABEL_CLASS}>Fecha</label>
              <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className={INPUT_CLASS} />
            </div>
            <div>
              <label className={LABEL_CLASS}>Nota (opcional)</label>
              <input type="text" value={nota} onChange={(e) => setNota(e.target.value)} className={INPUT_CLASS} />
            </div>
          </div>
          <p className="text-xs text-slate-400">Los gastos pendientes de esta legalización quedarán pagados en Finanzas con esta fecha.</p>
          <div className="flex gap-3">
            <button onClick={() => act(() => legalizacionesService.cerrar(leg.id, fecha, nota))} disabled={busy || !fecha} className={BTN_PRIMARY}>{cierreLabel}</button>
            <button onClick={() => setPanel(null)} disabled={busy} className={BTN_SECONDARY}>Cancelar</button>
          </div>
        </section>
      )}

      {panel === 'eliminar' && (
        <section className="p-5 bg-white rounded-2xl border border-red-200 space-y-3">
          <p className="text-sm text-slate-700">¿Eliminar esta legalización? Esta acción no se puede deshacer.</p>
          <div className="flex gap-3">
            <button onClick={() => act(() => legalizacionesService.remove(leg.id), onDeleted)} disabled={busy} className={BTN_DANGER}>Sí, eliminar</button>
            <button onClick={() => setPanel(null)} disabled={busy} className={BTN_SECONDARY}>Cancelar</button>
          </div>
        </section>
      )}

      {panel === null && (
        <div className="flex flex-wrap justify-end gap-3">
          {editable && <button onClick={() => setPanel('eliminar')} disabled={busy} className={BTN_DANGER}>Eliminar</button>}
          {editable && <button onClick={() => onEdit(leg)} disabled={busy} className={BTN_SECONDARY}>Editar</button>}
          {editable && <button onClick={() => act(() => legalizacionesService.enviar(leg.id))} disabled={busy} className={BTN_PRIMARY}>Enviar a aprobación</button>}
          {canDecide && (
            <button
              onClick={() => {
                setObservaciones({});
                setAprobadas(Object.fromEntries(porRevisar.map((item) => [item.id, true])));
              }}
              disabled={busy}
              className={BTN_SECONDARY}
            >
              Aprobar todas las líneas
            </button>
          )}
          {canDecide && (
            <button
              onClick={() => setPanel('revisar')}
              disabled={busy || sinDecisiones}
              title={sinDecisiones ? 'Aprueba u observa al menos una línea' : undefined}
              className={BTN_PRIMARY}
            >
              Finalizar revisión
            </button>
          )}
          {canClose && <button onClick={() => setPanel('cerrar')} disabled={busy} className={BTN_PRIMARY}>{cierreLabel}</button>}
        </div>
      )}
    </div>
  );
}
