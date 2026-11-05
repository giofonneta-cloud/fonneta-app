import { supabase } from '@/shared/lib/supabase';
import type {
  Anticipo,
  AnticipoInput,
  AnticipoStatus,
  BeneficiarioDefaults,
  ItemSaveInput,
  Legalizacion,
  LegalizacionHeaderInput,
  LegalizacionItem,
  LegalizacionItemInput,
  RevisionEstado,
} from '../types/legalizacion.types';

export interface LineaObservada {
  item_id: string;
  observacion: string;
}

// Solo las columnas de contenido: el estado de revisión lo manejan las funciones del flujo.
function itemColumns(item: ItemSaveInput): LegalizacionItemInput {
  return {
    fecha: item.fecha,
    categoria: item.categoria,
    categoria_etiqueta: item.categoria_etiqueta,
    establecimiento: item.establecimiento,
    establecimiento_nit: item.establecimiento_nit,
    numero_soporte: item.numero_soporte,
    descripcion: item.descripcion,
    comentario: item.comentario,
    valor: item.valor,
    soporte_url: item.soporte_url,
    soporte_nombre: item.soporte_nombre,
    order_index: item.order_index,
  };
}

interface ProfileRef {
  id: string;
  role: string;
  full_name: string | null;
  email: string;
}

export const legalizacionesService = {
  // La visibilidad (propias vs. todas) la aplica RLS según los permisos del usuario.
  async getAll(): Promise<Legalizacion[]> {
    const { data, error } = await supabase
      .from('legalizaciones')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as Legalizacion[];
  },

  async getById(id: string): Promise<Legalizacion> {
    const { data, error } = await supabase
      .from('legalizaciones')
      .select('*, legalizacion_items(*)')
      .eq('id', id)
      .single();
    if (error) throw error;

    const { legalizacion_items, ...header } = data as Legalizacion & { legalizacion_items: LegalizacionItem[] };
    return {
      ...header,
      items: [...(legalizacion_items ?? [])].sort((a, b) => a.order_index - b.order_index),
    };
  },

  // Las líneas se actualizan en el sitio (no se borran y reinsertan) para conservar su
  // estado de revisión; las ya aprobadas no se tocan.
  async save(
    id: string | null,
    header: LegalizacionHeaderInput,
    items: ItemSaveInput[]
  ): Promise<string> {
    let legalizacionId = id;
    let existing: Array<{ id: string; revision_estado: RevisionEstado }> = [];

    if (legalizacionId) {
      // .select() detecta el update silencioso de 0 filas que RLS produce si ya no es editable.
      const { data, error } = await supabase
        .from('legalizaciones')
        .update(header)
        .eq('id', legalizacionId)
        .select('id');
      if (error) throw error;
      if (!data?.length) throw new Error('Esta legalización ya no se puede editar.');

      const { data: rows, error: existingError } = await supabase
        .from('legalizacion_items')
        .select('id, revision_estado')
        .eq('legalizacion_id', legalizacionId);
      if (existingError) throw existingError;
      existing = (rows ?? []) as typeof existing;
    } else {
      const { data, error } = await supabase.from('legalizaciones').insert(header).select('id').single();
      if (error) throw error;
      legalizacionId = data.id as string;
    }

    const editable = items.filter((item) => item.revision_estado !== 'aprobada');

    const nuevas = editable.filter((item) => !item.id).map((item) => ({ ...itemColumns(item), legalizacion_id: legalizacionId }));
    if (nuevas.length > 0) {
      const { error } = await supabase.from('legalizacion_items').insert(nuevas);
      if (error) throw error;
    }

    const results = await Promise.all(
      editable
        .filter((item) => item.id)
        .map((item) => supabase.from('legalizacion_items').update(itemColumns(item)).eq('id', item.id as string))
    );
    const failed = results.find((result) => result.error);
    if (failed?.error) throw failed.error;

    const kept = new Set(items.map((item) => item.id).filter(Boolean));
    const removed = existing.filter((row) => !kept.has(row.id) && row.revision_estado !== 'aprobada').map((row) => row.id);
    if (removed.length > 0) {
      const { error } = await supabase.from('legalizacion_items').delete().in('id', removed);
      if (error) throw error;
    }

    return legalizacionId as string;
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('legalizaciones').delete().eq('id', id);
    if (error) throw error;
  },

  async enviar(id: string): Promise<void> {
    const { error } = await supabase.rpc('legalizacion_enviar', { p_id: id });
    if (error) throw error;
  },

  // Con todas las líneas aprobadas aprueba la legalización; si no, la devuelve.
  async revisar(
    id: string,
    aprobadas: string[],
    observaciones: LineaObservada[],
    motivo: string
  ): Promise<void> {
    const { error } = await supabase.rpc('legalizacion_revisar', {
      p_id: id,
      p_aprobadas: aprobadas,
      p_observaciones: observaciones,
      p_motivo: motivo,
    });
    if (error) throw error;
  },

  async cerrar(id: string, fecha: string, nota: string): Promise<void> {
    const { error } = await supabase.rpc('legalizacion_cerrar', { p_id: id, p_fecha: fecha, p_nota: nota });
    if (error) throw error;
  },

  async uploadSoporte(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/upload/legalizacion-soporte', { method: 'POST', body: formData });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'No se pudo subir el soporte');
    return data.fileUrl as string;
  },

  // Prellena el formulario: un contratista toma sus datos de proveedor; un empleado
  // reutiliza identificación y área de su última legalización (profiles no las guarda).
  async getBeneficiarioDefaults(profile: ProfileRef): Promise<BeneficiarioDefaults> {
    const [{ data: provider }, { data: last }] = await Promise.all([
      supabase
        .from('providers')
        .select('business_name, document_number')
        .eq('user_id', profile.id)
        .limit(1)
        .maybeSingle(),
      supabase
        .from('legalizaciones')
        .select('beneficiario_documento, beneficiario_area')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    const esContratista = profile.role === 'proveedor' && !!provider;
    return {
      tipo: esContratista ? 'contratista' : 'empleado',
      nombre: esContratista ? provider.business_name : profile.full_name || '',
      documento: (esContratista ? provider.document_number : last?.beneficiario_documento) || '',
      area: last?.beneficiario_area || '',
    };
  },
};

export const anticiposService = {
  async getAll(): Promise<Anticipo[]> {
    const { data, error } = await supabase
      .from('anticipos')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as Anticipo[];
  },

  // Anticipos propios ya pagados que aún no están en otra legalización.
  async getDisponibles(userId: string, legalizacionId: string | null): Promise<Anticipo[]> {
    const pagado: AnticipoStatus = 'pagado';
    const [{ data: anticipos, error }, { data: usados, error: usadosError }] = await Promise.all([
      supabase.from('anticipos').select('*').eq('user_id', userId).eq('status', pagado),
      supabase.from('legalizaciones').select('id, anticipo_id').eq('user_id', userId).not('anticipo_id', 'is', null),
    ]);
    if (error) throw error;
    if (usadosError) throw usadosError;

    const ocupados = new Set((usados ?? []).filter((l) => l.id !== legalizacionId).map((l) => l.anticipo_id));
    return ((anticipos ?? []) as Anticipo[]).filter((a) => !ocupados.has(a.id));
  },

  async create(input: AnticipoInput): Promise<void> {
    const { error } = await supabase.from('anticipos').insert(input);
    if (error) throw error;
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('anticipos').delete().eq('id', id);
    if (error) throw error;
  },

  async decidir(id: string, aprobar: boolean, motivo: string | null): Promise<void> {
    const { error } = await supabase.rpc('anticipo_decidir', { p_id: id, p_aprobar: aprobar, p_motivo: motivo });
    if (error) throw error;
  },

  async marcarPagado(id: string, fecha: string): Promise<void> {
    const { error } = await supabase.rpc('anticipo_marcar_pagado', { p_id: id, p_fecha: fecha });
    if (error) throw error;
  },
};
