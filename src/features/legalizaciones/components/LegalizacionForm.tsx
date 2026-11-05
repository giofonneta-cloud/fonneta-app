'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/features/auth/store/authStore';
import { useParametros } from '@/features/admin/hooks/useParametros';
import { projectService } from '@/features/projects/services/projectService';
import type { Project } from '@/features/projects/types/project.types';
import { anticiposService, legalizacionesService } from '../services/legalizacionesService';
import type {
  Anticipo,
  BeneficiarioTipo,
  Legalizacion,
  LegalizacionHeaderInput,
} from '../types/legalizacion.types';
import { BENEFICIARIO_TIPO_LABELS } from '../types/legalizacion.types';
import { errorMessage, formatCOP, formatDate, INPUT_CLASS, LABEL_CLASS, todayISO } from './legalizacionFormat';
import { emptyItem, LegalizacionItemsEditor, type ItemDraft } from './LegalizacionItemsEditor';

type HeaderDraft = Omit<LegalizacionHeaderInput, 'total_gastos' | 'anticipo_recibido' | 'saldo_empleado' | 'saldo_empresa'>;

function headerFrom(initial?: Legalizacion): HeaderDraft {
  return {
    beneficiario_tipo: initial?.beneficiario_tipo ?? 'empleado',
    beneficiario_nombre: initial?.beneficiario_nombre ?? '',
    beneficiario_documento: initial?.beneficiario_documento ?? '',
    beneficiario_area: initial?.beneficiario_area ?? '',
    motivo: initial?.motivo ?? '',
    cost_center: initial?.cost_center ?? '',
    project_id: initial?.project_id ?? null,
    fecha_reporte: initial?.fecha_reporte ?? todayISO(),
    periodo_desde: initial?.periodo_desde ?? null,
    periodo_hasta: initial?.periodo_hasta ?? null,
    anticipo_id: initial?.anticipo_id ?? null,
  };
}

function itemsFrom(initial?: Legalizacion): ItemDraft[] {
  if (!initial?.items?.length) return [emptyItem()];
  return initial.items.map((item) => ({
    ...emptyItem(),
    id: item.id,
    revision_estado: item.revision_estado,
    order_index: item.order_index,
    fecha: item.fecha,
    categoria: item.categoria,
    categoria_etiqueta: item.categoria_etiqueta,
    establecimiento: item.establecimiento,
    establecimiento_nit: item.establecimiento_nit,
    numero_soporte: item.numero_soporte,
    descripcion: item.descripcion,
    comentario: item.comentario,
    observacion_revisor: item.observacion_revisor,
    valor: Number(item.valor) || 0,
    soporte_url: item.soporte_url,
    soporte_nombre: item.soporte_nombre,
  }));
}

interface Props {
  initialData?: Legalizacion;
  onDone: (id: string) => void;
  onCancel: () => void;
}

export function LegalizacionForm({ initialData, onDone, onCancel }: Props) {
  const profile = useAuthStore((state) => state.profile);
  const { opciones: categorias } = useParametros('categorias_legalizacion');
  const { opciones: centrosCosto } = useParametros('centros_costo');

  // Una vez guardado, reintentar "enviar" actualiza este registro en lugar de crear otro.
  const [savedId, setSavedId] = useState<string | null>(initialData?.id ?? null);
  const [header, setHeader] = useState<HeaderDraft>(() => headerFrom(initialData));
  const [items, setItems] = useState<ItemDraft[]>(() => itemsFrom(initialData));
  const [anticipos, setAnticipos] = useState<Anticipo[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [uploadsInProgress, setUploadsInProgress] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const profileId = profile?.id;
  const profileRole = profile?.role;
  const profileName = profile?.full_name ?? null;
  const profileEmail = profile?.email ?? '';

  useEffect(() => {
    if (!profileId || !profileRole) return;

    anticiposService.getDisponibles(profileId, initialData?.id ?? null).then(setAnticipos).catch(console.error);
    projectService.getProjects().then(setProjects).catch(console.error);

    if (initialData) return;
    legalizacionesService
      .getBeneficiarioDefaults({ id: profileId, role: profileRole, full_name: profileName, email: profileEmail })
      .then((defaults) =>
        // Solo rellena lo vacío: la carga puede terminar después de que el usuario empezó a escribir.
        setHeader((prev) => ({
          ...prev,
          beneficiario_tipo: defaults.tipo,
          beneficiario_nombre: prev.beneficiario_nombre || defaults.nombre,
          beneficiario_documento: prev.beneficiario_documento || defaults.documento,
          beneficiario_area: prev.beneficiario_area || defaults.area,
        }))
      )
      .catch(console.error);
  }, [profileId, profileRole, profileName, profileEmail, initialData]);

  const setField = <K extends keyof HeaderDraft>(field: K, value: HeaderDraft[K]) =>
    setHeader((prev) => ({ ...prev, [field]: value }));

  const total = items.reduce((sum, item) => sum + item.valor, 0);
  const anticipoMonto = Number(anticipos.find((a) => a.id === header.anticipo_id)?.monto ?? 0);
  const saldoEmpleado = Math.max(total - anticipoMonto, 0);
  const saldoEmpresa = Math.max(anticipoMonto - total, 0);
  const busy = saving || uploadsInProgress > 0;

  const persist = async (): Promise<string> => {
    if (!header.beneficiario_nombre.trim()) throw new Error('Indica el nombre del beneficiario.');
    const id = await legalizacionesService.save(
      savedId,
      // El servidor recalcula estos totales al enviar; aquí solo sirven para mostrar el borrador.
      { ...header, total_gastos: total, anticipo_recibido: anticipoMonto, saldo_empleado: saldoEmpleado, saldo_empresa: saldoEmpresa },
      items.map(({ key: _key, ...item }, index) => ({ ...item, order_index: index }))
    );
    setSavedId(id);
    // Las líneas ya tienen id en la base: si "enviar" falla y se reintenta, se actualizan en vez de duplicarse.
    setItems(itemsFrom(await legalizacionesService.getById(id)));
    return id;
  };

  const run = async (submit: boolean) => {
    setSaving(true);
    setError(null);
    try {
      const id = await persist();
      if (submit) await legalizacionesService.enviar(id);
      onDone(id);
    } catch (err) {
      setError(errorMessage(err, 'No se pudo guardar la legalización.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <section className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-800">Datos de la legalización</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div>
            <label className={LABEL_CLASS}>Tipo de beneficiario</label>
            <select
              value={header.beneficiario_tipo}
              onChange={(e) => setField('beneficiario_tipo', e.target.value as BeneficiarioTipo)}
              className={INPUT_CLASS}
            >
              {(Object.keys(BENEFICIARIO_TIPO_LABELS) as BeneficiarioTipo[]).map((tipo) => (
                <option key={tipo} value={tipo}>{BENEFICIARIO_TIPO_LABELS[tipo]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={LABEL_CLASS}>Nombre</label>
            <input type="text" value={header.beneficiario_nombre} onChange={(e) => setField('beneficiario_nombre', e.target.value)} className={INPUT_CLASS} />
          </div>
          <div>
            <label className={LABEL_CLASS}>Identificación (C.C. / NIT)</label>
            <input type="text" value={header.beneficiario_documento ?? ''} onChange={(e) => setField('beneficiario_documento', e.target.value)} className={INPUT_CLASS} />
          </div>
          <div>
            <label className={LABEL_CLASS}>Área / Departamento</label>
            <input type="text" value={header.beneficiario_area ?? ''} onChange={(e) => setField('beneficiario_area', e.target.value)} className={INPUT_CLASS} />
          </div>
          <div>
            <label className={LABEL_CLASS}>Centro de costo</label>
            <select value={header.cost_center ?? ''} onChange={(e) => setField('cost_center', e.target.value)} className={INPUT_CLASS}>
              <option value="">Selecciona...</option>
              {centrosCosto.map((c) => <option key={c.id} value={c.etiqueta}>{c.etiqueta}</option>)}
            </select>
          </div>
          {projects.length > 0 && (
            <div>
              <label className={LABEL_CLASS}>Proyecto (opcional)</label>
              <select value={header.project_id ?? ''} onChange={(e) => setField('project_id', e.target.value || null)} className={INPUT_CLASS}>
                <option value="">Sin proyecto</option>
                {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className={LABEL_CLASS}>Fecha del reporte</label>
            <input type="date" value={header.fecha_reporte} onChange={(e) => setField('fecha_reporte', e.target.value || todayISO())} className={INPUT_CLASS} />
          </div>
          <div>
            <label className={LABEL_CLASS}>Período: desde</label>
            <input type="date" value={header.periodo_desde ?? ''} onChange={(e) => setField('periodo_desde', e.target.value || null)} className={INPUT_CLASS} />
          </div>
          <div>
            <label className={LABEL_CLASS}>Período: hasta</label>
            <input type="date" value={header.periodo_hasta ?? ''} onChange={(e) => setField('periodo_hasta', e.target.value || null)} className={INPUT_CLASS} />
          </div>
          <div className="sm:col-span-2 lg:col-span-3">
            <label className={LABEL_CLASS}>Motivo del gasto</label>
            <input type="text" value={header.motivo ?? ''} onChange={(e) => setField('motivo', e.target.value)} className={INPUT_CLASS} />
          </div>
        </div>
      </section>

      <LegalizacionItemsEditor
        items={items}
        categorias={categorias}
        onItemsChange={setItems}
        onUploadingChange={(delta) => setUploadsInProgress((count) => count + delta)}
      />

      <section className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-800">Liquidación</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div>
            <label className={LABEL_CLASS}>Anticipo a legalizar (opcional)</label>
            <select value={header.anticipo_id ?? ''} onChange={(e) => setField('anticipo_id', e.target.value || null)} className={INPUT_CLASS}>
              <option value="">Sin anticipo (reintegro)</option>
              {anticipos.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.numero} · {formatCOP(a.monto)} · pagado {formatDate(a.fecha_pago)}
                </option>
              ))}
            </select>
          </div>
          <dl className="text-sm space-y-1.5">
            <div className="flex justify-between"><dt className="text-slate-500">Total gastos</dt><dd className="font-semibold">{formatCOP(total)}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Anticipo recibido</dt><dd className="font-semibold">{formatCOP(anticipoMonto)}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Saldo a favor del beneficiario</dt><dd className="font-bold">{formatCOP(saldoEmpleado)}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Saldo a favor de la empresa</dt><dd className="font-bold">{formatCOP(saldoEmpresa)}</dd></div>
          </dl>
        </div>
      </section>

      {error && <p className="px-4 py-2.5 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</p>}

      <div className="flex flex-col sm:flex-row justify-end gap-3">
        <button type="button" onClick={onCancel} disabled={saving} className="px-4 py-2 text-sm font-semibold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50">
          Cancelar
        </button>
        <button type="button" onClick={() => run(false)} disabled={busy} className="px-4 py-2 text-sm font-semibold text-slate-800 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50">
          Guardar borrador
        </button>
        <button type="button" onClick={() => run(true)} disabled={busy} className="px-4 py-2 text-sm font-semibold text-white bg-gray-900 rounded-lg hover:bg-black transition-colors disabled:opacity-50">
          {saving ? 'Guardando...' : uploadsInProgress > 0 ? 'Subiendo soportes...' : 'Enviar a aprobación'}
        </button>
      </div>
    </div>
  );
}
