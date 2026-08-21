'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/shared/lib/supabase';
import { quotesService } from '../services/quotesService';
import type { Quote, CreateQuoteInput, CreateQuoteItemInput } from '../types/quote.types';
import { QuoteItemSelector } from '@/features/projects/components/QuoteItemSelector';
import type { TarifarioItem } from '@/features/tarifario/types/tarifario.types';
import { Trash2, Plus, ArrowUp, ArrowDown, Package, Building2, FileText, FileSignature, Calculator, ChevronDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Separator } from '@/shared/components/ui/separator';
import { useParametros } from '@/features/admin/hooks/useParametros';
import { useAuthStore } from '@/features/auth/store/authStore';
import { quoteAccessService } from '../services/quoteAccessService';

const IVA_OPTIONS = [
  { label: '0%', value: 0 },
  { label: '5%', value: 5 },
  { label: '19%', value: 19 },
];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value);

interface ClientOption {
  id: string;
  business_name: string;
  document_number: string | null;
  address: string | null;
  city: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  billing_email: string | null;
}

interface ProjectOption {
  id: string;
  name: string;
}

interface LocalItem {
  id: string;
  tarifario_id?: string | null;
  descripcion: string;
  cantidad: number;
  precio_unitario: number;
  descuento_porcentaje: number;
}

interface FormState {
  client_id: string;
  unregistered_client: boolean;
  client_name: string;
  client_contact_name: string;
  client_nit: string;
  client_address: string;
  client_city: string;
  client_phone: string;
  client_email: string;
  project_id: string;
  cost_center: string;
  valid_until: string;
  intro_text: string;
  closing_text: string;
  iva_porcentaje: number;
}

const DEFAULT_INTRO =
  'De acuerdo con su interés, nos permitimos presentar la siguiente cotización de los servicios descritos a continuación:';

const DEFAULT_CLOSING =
  'Quedamos atentos a sus comentarios para avanzar con la reserva del servicio y la ejecución del proyecto.';

const EMPTY_FORM: FormState = {
  client_id: '',
  unregistered_client: false,
  client_name: '',
  client_contact_name: '',
  client_nit: '',
  client_address: '',
  client_city: '',
  client_phone: '',
  client_email: '',
  project_id: '',
  cost_center: '',
  valid_until: '',
  intro_text: DEFAULT_INTRO,
  closing_text: DEFAULT_CLOSING,
  iva_porcentaje: 19,
};

interface QuoteFormProps {
  initialData?: Quote;
  onSuccess: (quote: Quote) => void;
  onCancel: () => void;
}

export function QuoteForm({ initialData, onSuccess, onCancel }: QuoteFormProps) {
  const isEditing = !!initialData;
  const { opciones: centrosCostoTodos } = useParametros('centros_costo');
  const { profile, hasPermission } = useAuthStore();
  const canSeeAllCostCenters = hasPermission('quotes.view_all');

  const [clients, setClients] = useState<ClientOption[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [allowedCostCenters, setAllowedCostCenters] = useState<string[]>([]);

  const centrosCosto = canSeeAllCostCenters
    ? centrosCostoTodos
    : centrosCostoTodos.filter((o) => allowedCostCenters.includes(o.etiqueta));

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [items, setItems] = useState<LocalItem[]>([]);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  const [showTarifario, setShowTarifario] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [{ data: prov }, { data: proj }] = await Promise.all([
          supabase
            .from('providers')
            .select('id, business_name, document_number, address, city, contact_phone, contact_email, billing_email')
            .eq('is_client', true)
            .order('business_name'),
          supabase.from('projects').select('id, name').order('name'),
        ]);
        setClients((prov ?? []) as ClientOption[]);
        setProjects((proj ?? []) as ProjectOption[]);
      } catch (err) {
        console.error('Error cargando datos:', err);
      } finally {
        setLoadingClients(false);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    if (canSeeAllCostCenters || !profile?.id) return;
    quoteAccessService.getMyCostCenters(profile.id).then(setAllowedCostCenters).catch(console.error);
  }, [canSeeAllCostCenters, profile?.id]);

  useEffect(() => {
    if (!initialData) return;

    setForm({
      client_id: initialData.client_id ?? '',
      unregistered_client: !initialData.client_id,
      client_name: initialData.client_name,
      client_contact_name: initialData.client_contact_name ?? '',
      client_nit: initialData.client_nit ?? '',
      client_address: initialData.client_address ?? '',
      client_city: initialData.client_city ?? '',
      client_phone: initialData.client_phone ?? '',
      client_email: initialData.client_email,
      project_id: initialData.project_id ?? '',
      cost_center: initialData.cost_center ?? '',
      valid_until: initialData.valid_until ?? '',
      intro_text: initialData.intro_text ?? DEFAULT_INTRO,
      closing_text: initialData.closing_text ?? DEFAULT_CLOSING,
      iva_porcentaje: initialData.iva_porcentaje,
    });

    if (initialData.items && initialData.items.length > 0) {
      setItems(
        initialData.items.map((item) => ({
          id: item.id,
          tarifario_id: item.tarifario_id,
          descripcion: item.descripcion,
          cantidad: item.cantidad,
          precio_unitario: item.precio_unitario,
          descuento_porcentaje: item.descuento_porcentaje,
        }))
      );
    }
  }, [initialData]);

  const setField = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const handleClientSelect = useCallback(
    (clientId: string) => {
      setField('client_id', clientId);
      const client = clients.find((c) => c.id === clientId);
      if (!client) return;

      setForm((prev) => ({
        ...prev,
        client_id: clientId,
        client_name: client.business_name,
        client_nit: client.document_number ?? '',
        client_address: client.address ?? '',
        client_city: client.city ?? '',
        client_phone: client.contact_phone ?? '',
        client_email: client.billing_email ?? client.contact_email ?? '',
      }));
    },
    [clients, setField]
  );

  const addEmptyItem = () => {
    const newItem: LocalItem = {
      id: crypto.randomUUID(),
      tarifario_id: null,
      descripcion: '',
      cantidad: 1,
      precio_unitario: 0,
      descuento_porcentaje: 0,
    };
    setItems((prev) => [...prev, newItem]);
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const updateItemField = (
    id: string,
    field: 'descripcion' | 'cantidad' | 'precio_unitario' | 'descuento_porcentaje',
    value: string | number
  ) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  };

  const moveItem = (id: string, direction: 'up' | 'down') => {
    setItems((prev) => {
      const index = prev.findIndex((item) => item.id === id);
      if (index === -1) return prev;
      if (direction === 'up' && index === 0) return prev;
      if (direction === 'down' && index === prev.length - 1) return prev;

      const next = [...prev];
      const swapIndex = direction === 'up' ? index - 1 : index + 1;
      [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
      return next;
    });
  };

  const handleTarifarioConfirm = (
    selections: Array<{ item: TarifarioItem; cantidad: number; precioUnitario: number; descuento: number }>
  ) => {
    const newItems: LocalItem[] = selections.map((sel) => ({
      id: crypto.randomUUID(),
      tarifario_id: sel.item.id,
      descripcion: `${sel.item.nombre}${sel.item.descripcion ? ` - ${sel.item.descripcion}` : ''}`,
      cantidad: sel.cantidad,
      precio_unitario: sel.precioUnitario,
      descuento_porcentaje: sel.descuento,
    }));

    setItems((prev) => [...prev, ...newItems]);
    setShowTarifario(false);
  };

  const itemSubtotal = (item: LocalItem) => {
    const factor = 1 - (Number(item.descuento_porcentaje) || 0) / 100;
    return Math.round((Number(item.cantidad) || 0) * (Number(item.precio_unitario) || 0) * factor);
  };

  const subtotal = items.reduce((sum, item) => sum + itemSubtotal(item), 0);
  const ivaValor = subtotal * (form.iva_porcentaje / 100);
  const total = subtotal + ivaValor;

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof FormState, string>> = {};

    if (!form.client_name.trim()) newErrors.client_name = 'El nombre del cliente es obligatorio';
    if (!form.client_email.trim()) newErrors.client_email = 'El correo del cliente es obligatorio';
    if (!form.cost_center) newErrors.cost_center = 'Selecciona un centro de costo';

    setErrors(newErrors);
    if (items.length === 0) {
      alert('Agrega al menos un ítem a la cotización');
      return false;
    }
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const currentStatus = isEditing && initialData ? initialData.status : 'borrador';

      const header: CreateQuoteInput = {
        client_id: form.client_id || null,
        client_name: form.client_name.trim(),
        client_contact_name: form.client_contact_name.trim() || undefined,
        client_nit: form.client_nit.trim() || undefined,
        client_address: form.client_address.trim() || undefined,
        client_city: form.client_city.trim() || undefined,
        client_phone: form.client_phone.trim() || undefined,
        client_email: form.client_email.trim(),
        project_id: form.project_id || null,
        cost_center: form.cost_center || undefined,
        valid_until: form.valid_until || undefined,
        intro_text: form.intro_text.trim() || undefined,
        closing_text: form.closing_text.trim() || undefined,
        subtotal,
        iva_porcentaje: form.iva_porcentaje,
        iva_valor: ivaValor,
        total,
        status: currentStatus,
      };

      const quoteItems: CreateQuoteItemInput[] = items.map((item, index) => ({
        tarifario_id: item.tarifario_id ?? null,
        descripcion: item.descripcion,
        cantidad: Number(item.cantidad),
        precio_unitario: Number(item.precio_unitario),
        descuento_porcentaje: Number(item.descuento_porcentaje),
        order_index: index,
      }));

      let result: Quote;

      if (isEditing && initialData) {
        result = await quotesService.updateQuote(initialData.id, header, quoteItems);
      } else {
        result = await quotesService.createQuote(header, quoteItems);
      }

      onSuccess(result);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      console.error('Error guardando cotización:', err);
      alert(`Error al guardar: ${message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = (hasError?: boolean) =>
    `w-full px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
      hasError ? 'border-red-400 focus:ring-red-400' : 'border-gray-300'
    }`;

  const labelClass = 'block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1';

  return (
    <>
      <Card className="max-w-4xl mx-auto shadow-2xl border-slate-200 overflow-hidden">
        <CardHeader className="bg-slate-900 border-b p-6 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-800 rounded-lg">
              <FileSignature className="w-5 h-5 text-gray-300" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold">
                {isEditing ? 'Editar Cotización' : 'Nueva Cotización'}
                {isEditing && initialData?.quote_number && (
                  <span className="ml-2 text-sm font-mono font-normal text-slate-400">
                    #{initialData.quote_number}
                  </span>
                )}
              </CardTitle>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                {isEditing
                  ? 'Modifica los datos de esta cotización'
                  : 'Estructura una propuesta comercial para un cliente o prospecto'}
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-8 space-y-10">
          {/* SECTION 1: Cliente */}
          <section className="space-y-5">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-500" />
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Cliente</h3>
            </div>

            <div className="flex items-center gap-2.5">
              <input
                id="unregistered-client-toggle"
                type="checkbox"
                checked={form.unregistered_client}
                onChange={(e) => {
                  setField('unregistered_client', e.target.checked);
                  if (e.target.checked) setField('client_id', '');
                }}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <label htmlFor="unregistered-client-toggle" className="text-sm text-slate-600 cursor-pointer select-none">
                Cliente / prospecto no registrado (ingreso manual)
              </label>
            </div>

            <div className="p-5 bg-slate-50/60 rounded-xl border border-slate-100 space-y-4">
              {!form.unregistered_client ? (
                <div>
                  <label className={labelClass}>Cliente registrado</label>
                  <div className="relative">
                    <select
                      value={form.client_id}
                      onChange={(e) => handleClientSelect(e.target.value)}
                      disabled={loadingClients}
                      className={`${inputClass()} appearance-none pr-8`}
                    >
                      <option value="">
                        {loadingClients ? 'Cargando clientes...' : 'Selecciona un cliente'}
                      </option>
                      {clients.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.business_name}
                          {c.document_number ? ` — NIT ${c.document_number}` : ''}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Al seleccionar, los campos del cliente se llenarán automáticamente.
                  </p>
                </div>
              ) : (
                <div>
                  <label className={labelClass}>
                    Nombre / Razón social <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.client_name}
                    onChange={(e) => setField('client_name', e.target.value)}
                    placeholder="Ej: Senado de la República de Colombia"
                    className={inputClass(!!errors.client_name)}
                  />
                  {errors.client_name && <p className="text-xs text-red-500 mt-1">{errors.client_name}</p>}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {!form.unregistered_client && (
                  <div>
                    <label className={labelClass}>
                      Nombre / Razón social <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.client_name}
                      onChange={(e) => setField('client_name', e.target.value)}
                      placeholder="Auto-completado desde cliente"
                      className={inputClass(!!errors.client_name)}
                    />
                    {errors.client_name && <p className="text-xs text-red-500 mt-1">{errors.client_name}</p>}
                  </div>
                )}

                <div>
                  <label className={labelClass}>Persona de contacto</label>
                  <input
                    type="text"
                    value={form.client_contact_name}
                    onChange={(e) => setField('client_contact_name', e.target.value)}
                    placeholder="Ej: Dr. Andrés Mora"
                    className={inputClass()}
                  />
                </div>

                <div>
                  <label className={labelClass}>NIT / Documento</label>
                  <input
                    type="text"
                    value={form.client_nit}
                    onChange={(e) => setField('client_nit', e.target.value)}
                    placeholder="Ej: 900.123.456-1"
                    className={inputClass()}
                  />
                </div>

                <div>
                  <label className={labelClass}>Dirección</label>
                  <input
                    type="text"
                    value={form.client_address}
                    onChange={(e) => setField('client_address', e.target.value)}
                    placeholder="Ej: Cra. 15 #93-47"
                    className={inputClass()}
                  />
                </div>

                <div>
                  <label className={labelClass}>Ciudad</label>
                  <input
                    type="text"
                    value={form.client_city}
                    onChange={(e) => setField('client_city', e.target.value)}
                    placeholder="Ej: Bogotá"
                    className={inputClass()}
                  />
                </div>

                <div>
                  <label className={labelClass}>Teléfono</label>
                  <input
                    type="text"
                    value={form.client_phone}
                    onChange={(e) => setField('client_phone', e.target.value)}
                    placeholder="Ej: 601 234 5678"
                    className={inputClass()}
                  />
                </div>

                <div>
                  <label className={labelClass}>
                    Correo electrónico <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={form.client_email}
                    onChange={(e) => setField('client_email', e.target.value)}
                    placeholder="correo@cliente.com"
                    className={inputClass(!!errors.client_email)}
                  />
                  {errors.client_email && <p className="text-xs text-red-500 mt-1">{errors.client_email}</p>}
                  <p className="text-[10px] text-slate-400 mt-1">Este correo recibirá la cotización.</p>
                </div>
              </div>
            </div>
          </section>

          <Separator className="bg-slate-100" />

          {/* SECTION 2: Datos de la cotización */}
          <section className="space-y-5">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-purple-500" />
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Datos de la Cotización</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-5 bg-purple-50/20 rounded-xl border border-purple-100/50">
              <div>
                <label className={labelClass}>
                  Centro de costo / Línea <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={form.cost_center}
                    onChange={(e) => setField('cost_center', e.target.value)}
                    className={`${inputClass(!!errors.cost_center)} appearance-none pr-8`}
                  >
                    <option value="">Selecciona centro de costo</option>
                    {centrosCosto.map((o) => (
                      <option key={o.valor} value={o.etiqueta}>
                        {o.etiqueta}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
                {errors.cost_center && <p className="text-xs text-red-500 mt-1">{errors.cost_center}</p>}
                {!canSeeAllCostCenters && allowedCostCenters.length === 0 && (
                  <p className="text-xs text-amber-600 mt-1">
                    Aún no tienes ningún centro de costo habilitado. Pide al administrador que te dé acceso.
                  </p>
                )}
              </div>

              <div>
                <label className={labelClass}>Proyecto (opcional)</label>
                <div className="relative">
                  <select
                    value={form.project_id}
                    onChange={(e) => setField('project_id', e.target.value)}
                    className={`${inputClass()} appearance-none pr-8`}
                  >
                    <option value="">Sin proyecto asociado</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className={labelClass}>Válida hasta (opcional)</label>
                <input
                  type="date"
                  value={form.valid_until}
                  onChange={(e) => setField('valid_until', e.target.value)}
                  className={inputClass()}
                />
              </div>

              <div className="md:col-span-2">
                <label className={labelClass}>Párrafo introductorio</label>
                <textarea
                  value={form.intro_text}
                  onChange={(e) => setField('intro_text', e.target.value)}
                  rows={2}
                  className={`${inputClass()} resize-none`}
                />
              </div>

              <div className="md:col-span-2">
                <label className={labelClass}>Párrafo de cierre</label>
                <textarea
                  value={form.closing_text}
                  onChange={(e) => setField('closing_text', e.target.value)}
                  rows={2}
                  className={`${inputClass()} resize-none`}
                />
              </div>
            </div>
          </section>

          <Separator className="bg-slate-100" />

          {/* SECTION 3: Items */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-emerald-500" />
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Ítems</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowTarifario(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <Package className="w-3.5 h-3.5" />
                  Agregar desde tarifario
                </button>
                <button
                  type="button"
                  onClick={addEmptyItem}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 border border-slate-200 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Agregar línea libre
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left px-3 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide w-8">#</th>
                    <th className="text-left px-3 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Descripción</th>
                    <th className="text-right px-3 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide w-20">Cant.</th>
                    <th className="text-right px-3 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide w-32">Precio unit.</th>
                    <th className="text-right px-3 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide w-20">Dto. %</th>
                    <th className="text-right px-3 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide w-32">Subtotal</th>
                    <th className="px-3 py-3 w-24" aria-label="Acciones" />
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        <Package className="w-8 h-8 opacity-20 mx-auto mb-2" />
                        <p className="text-xs font-medium uppercase tracking-widest">
                          No hay ítems. Agrega desde el tarifario o una línea libre.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    items.map((item, index) => (
                      <tr key={item.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors">
                        <td className="px-3 py-3 text-xs text-slate-400 font-medium">{index + 1}</td>
                        <td className="px-3 py-3">
                          <textarea
                            value={item.descripcion}
                            onChange={(e) => updateItemField(item.id, 'descripcion', e.target.value)}
                            placeholder="Descripción del ítem..."
                            rows={2}
                            className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none transition-colors"
                          />
                        </td>
                        <td className="px-3 py-3">
                          <input
                            type="number"
                            value={item.cantidad}
                            min={0}
                            step={1}
                            onChange={(e) => updateItemField(item.id, 'cantidad', Number(e.target.value))}
                            className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm text-right bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                          />
                        </td>
                        <td className="px-3 py-3">
                          <input
                            type="number"
                            value={item.precio_unitario}
                            min={0}
                            step={1000}
                            onChange={(e) => updateItemField(item.id, 'precio_unitario', Number(e.target.value))}
                            className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm text-right bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                          />
                        </td>
                        <td className="px-3 py-3">
                          <input
                            type="number"
                            value={item.descuento_porcentaje}
                            min={0}
                            max={100}
                            step={1}
                            onChange={(e) => updateItemField(item.id, 'descuento_porcentaje', Number(e.target.value))}
                            className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm text-right bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                          />
                        </td>
                        <td className="px-3 py-3 text-right font-mono text-xs font-semibold text-slate-700 whitespace-nowrap">
                          {formatCurrency(itemSubtotal(item))}
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => moveItem(item.id, 'up')}
                              disabled={index === 0}
                              aria-label="Subir ítem"
                              className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => moveItem(item.id, 'down')}
                              disabled={index === items.length - 1}
                              aria-label="Bajar ítem"
                              className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => removeItem(item.id)}
                              aria-label="Eliminar ítem"
                              className="p-1 rounded text-rose-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <Separator className="bg-slate-100" />

          {/* SECTION 4: Totales */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Calculator className="w-4 h-4 text-gray-500" />
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Totales</h3>
            </div>

            <div className="flex justify-end">
              <div className="w-full max-w-sm space-y-2">
                <div className="flex items-center justify-between py-2 px-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-sm text-slate-600 font-medium">Subtotal</span>
                  <span className="text-sm font-semibold text-slate-800">{formatCurrency(subtotal)}</span>
                </div>

                <div className="flex items-center justify-between gap-3 py-2 px-3 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="flex items-center gap-2 flex-1">
                    <span className="text-sm text-slate-600 font-medium whitespace-nowrap">IVA %</span>
                    <div className="relative flex-1">
                      <select
                        value={form.iva_porcentaje}
                        onChange={(e) => setField('iva_porcentaje', Number(e.target.value))}
                        className="w-full pl-2 pr-6 py-1 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                      >
                        {IVA_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-slate-800 whitespace-nowrap">{formatCurrency(ivaValor)}</span>
                </div>

                <div className="flex items-center justify-between py-3 px-4 bg-slate-900 rounded-xl">
                  <span className="text-base font-bold text-white">TOTAL</span>
                  <span className="text-xl font-black text-white tracking-tight">{formatCurrency(total)}</span>
                </div>
              </div>
            </div>
          </section>

          <Separator className="bg-slate-100" />

          {/* SECTION 5: Actions */}
          <div className="flex items-center justify-end gap-4 pt-2">
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="px-6 py-2.5 text-sm font-semibold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => handleSubmit()}
              disabled={isSubmitting}
              className="px-8 py-2.5 text-sm font-bold text-white bg-gray-900 rounded-lg hover:bg-black disabled:opacity-50 transition-all active:scale-95"
            >
              {isSubmitting ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Guardar borrador'}
            </button>
          </div>
        </CardContent>
      </Card>

      {showTarifario && <QuoteItemSelector onConfirm={handleTarifarioConfirm} onClose={() => setShowTarifario(false)} />}
    </>
  );
}
