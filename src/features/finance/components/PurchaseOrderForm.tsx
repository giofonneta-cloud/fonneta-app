'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/shared/lib/supabase';
import { purchaseOrderService } from '../services/purchaseOrderService';
import type { PurchaseOrder, CreatePOInput, CreatePOItemInput } from '../types/purchase-order.types';
import { QuoteItemSelector } from '@/features/projects/components/QuoteItemSelector';
import type { TarifarioItem } from '@/features/tarifario/types/tarifario.types';
import { Trash2, Plus, ArrowUp, ArrowDown, Package, Building2, FileText, ShoppingCart, Calculator, ChevronDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Separator } from '@/shared/components/ui/separator';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const COST_CENTERS = ['FUSCIA', 'SOHO', 'MONICA J', 'FONNETA', 'CLUB INDOMITAS'] as const;

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

// ---------------------------------------------------------------------------
// Local types
// ---------------------------------------------------------------------------

interface ProviderOption {
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
  precio: number;
  order_index: number;
}

// ---------------------------------------------------------------------------
// Form state shape
// ---------------------------------------------------------------------------

interface FormState {
  // Destinatario
  provider_id: string;
  unregistered_provider: boolean;
  recipient_name: string;
  recipient_nit: string;
  recipient_address: string;
  recipient_city: string;
  recipient_phone: string;
  recipient_email: string;
  // Datos OC
  authorized_by: string;
  cost_center: string;
  project_id: string;
  transport: string;
  description: string;
  // Totales
  iva_porcentaje: number;
  otros_impuestos: number;
}

const EMPTY_FORM: FormState = {
  provider_id: '',
  unregistered_provider: false,
  recipient_name: '',
  recipient_nit: '',
  recipient_address: '',
  recipient_city: '',
  recipient_phone: '',
  recipient_email: '',
  authorized_by: '',
  cost_center: '',
  project_id: '',
  transport: '',
  description: '',
  iva_porcentaje: 0,
  otros_impuestos: 0,
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface PurchaseOrderFormProps {
  initialData?: PurchaseOrder;
  onSuccess: (po: PurchaseOrder) => void;
  onCancel: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PurchaseOrderForm({ initialData, onSuccess, onCancel }: PurchaseOrderFormProps) {
  const isEditing = !!initialData;

  // Remote data
  const [providers, setProviders] = useState<ProviderOption[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [loadingProviders, setLoadingProviders] = useState(true);

  // Form state
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [items, setItems] = useState<LocalItem[]>([]);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  // UI state
  const [showTarifario, setShowTarifario] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ---------------------------------------------------------------------------
  // Load remote data
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const loadData = async () => {
      try {
        const [{ data: prov }, { data: proj }] = await Promise.all([
          supabase
            .from('providers')
            .select('id, business_name, document_number, address, city, contact_phone, contact_email, billing_email')
            .order('business_name'),
          supabase.from('projects').select('id, name').order('name'),
        ]);
        setProviders((prov ?? []) as ProviderOption[]);
        setProjects((proj ?? []) as ProjectOption[]);
      } catch (err) {
        console.error('Error cargando datos:', err);
      } finally {
        setLoadingProviders(false);
      }
    };

    loadData();
  }, []);

  // ---------------------------------------------------------------------------
  // Populate form when editing
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!initialData) return;

    setForm({
      provider_id: initialData.provider_id ?? '',
      unregistered_provider: !initialData.provider_id,
      recipient_name: initialData.recipient_name,
      recipient_nit: initialData.recipient_nit ?? '',
      recipient_address: initialData.recipient_address ?? '',
      recipient_city: initialData.recipient_city ?? '',
      recipient_phone: initialData.recipient_phone ?? '',
      recipient_email: initialData.recipient_email,
      authorized_by: initialData.authorized_by ?? '',
      cost_center: initialData.cost_center ?? '',
      project_id: initialData.project_id ?? '',
      transport: initialData.transport ?? '',
      description: initialData.description ?? '',
      iva_porcentaje: initialData.iva_porcentaje,
      otros_impuestos: initialData.otros_impuestos,
    });

    if (initialData.items && initialData.items.length > 0) {
      setItems(
        initialData.items.map((item) => ({
          id: item.id,
          tarifario_id: item.tarifario_id,
          descripcion: item.descripcion,
          precio: item.precio,
          order_index: item.order_index,
        }))
      );
    }
  }, [initialData]);

  // ---------------------------------------------------------------------------
  // Field helpers
  // ---------------------------------------------------------------------------

  const setField = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  // ---------------------------------------------------------------------------
  // Provider selection → auto-fill
  // ---------------------------------------------------------------------------

  const handleProviderSelect = useCallback(
    (providerId: string) => {
      setField('provider_id', providerId);
      const provider = providers.find((p) => p.id === providerId);
      if (!provider) return;

      setForm((prev) => ({
        ...prev,
        provider_id: providerId,
        recipient_name: provider.business_name,
        recipient_nit: provider.document_number ?? '',
        recipient_address: provider.address ?? '',
        recipient_city: provider.city ?? '',
        recipient_phone: provider.contact_phone ?? '',
        recipient_email: provider.billing_email ?? provider.contact_email ?? '',
      }));
    },
    [providers, setField]
  );

  // ---------------------------------------------------------------------------
  // Items management
  // ---------------------------------------------------------------------------

  const addEmptyItem = () => {
    const newItem: LocalItem = {
      id: crypto.randomUUID(),
      tarifario_id: null,
      descripcion: '',
      precio: 0,
      order_index: items.length,
    };
    setItems((prev) => [...prev, newItem]);
  };

  const removeItem = (id: string) => {
    setItems((prev) =>
      prev
        .filter((item) => item.id !== id)
        .map((item, index) => ({ ...item, order_index: index }))
    );
  };

  const updateItemField = (id: string, field: 'descripcion' | 'precio', value: string | number) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
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
      return next.map((item, i) => ({ ...item, order_index: i }));
    });
  };

  // ---------------------------------------------------------------------------
  // Tarifario selector
  // ---------------------------------------------------------------------------

  const handleTarifarioConfirm = (
    selections: Array<{
      item: TarifarioItem;
      cantidad: number;
      precioUnitario: number;
      descuento: number;
    }>
  ) => {
    const newItems: LocalItem[] = selections.map((sel, i) => ({
      id: crypto.randomUUID(),
      tarifario_id: sel.item.id,
      descripcion: `${sel.item.nombre}${sel.item.descripcion ? ` - ${sel.item.descripcion}` : ''}`,
      precio: sel.cantidad * sel.precioUnitario * (1 - sel.descuento / 100),
      order_index: items.length + i,
    }));

    setItems((prev) => [...prev, ...newItems]);
    setShowTarifario(false);
  };

  // ---------------------------------------------------------------------------
  // Totals (derived)
  // ---------------------------------------------------------------------------

  const subtotal = items.reduce((sum, item) => sum + Number(item.precio), 0);
  const ivaValor = subtotal * (form.iva_porcentaje / 100);
  const total = subtotal + ivaValor + Number(form.otros_impuestos);

  // ---------------------------------------------------------------------------
  // Validation
  // ---------------------------------------------------------------------------

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof FormState, string>> = {};

    if (!form.recipient_name.trim()) newErrors.recipient_name = 'El nombre del destinatario es obligatorio';
    if (!form.recipient_email.trim()) newErrors.recipient_email = 'El correo del destinatario es obligatorio';
    if (!form.cost_center) newErrors.cost_center = 'Selecciona un centro de costo';
    if (!form.authorized_by.trim()) newErrors.authorized_by = 'El campo "Autorizado por" es obligatorio';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ---------------------------------------------------------------------------
  // Submit
  // ---------------------------------------------------------------------------

  const handleSubmit = async () => {
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      // Keep current status when editing; default to 'borrador' for new OC
      const currentStatus = isEditing && initialData ? initialData.status : 'borrador';

      const header: CreatePOInput = {
        provider_id: form.provider_id || null,
        project_id: form.project_id || null,
        recipient_name: form.recipient_name.trim(),
        recipient_nit: form.recipient_nit.trim() || undefined,
        recipient_address: form.recipient_address.trim() || undefined,
        recipient_city: form.recipient_city.trim() || undefined,
        recipient_phone: form.recipient_phone.trim() || undefined,
        recipient_email: form.recipient_email.trim(),
        authorized_by: form.authorized_by.trim() || undefined,
        cost_center: form.cost_center || undefined,
        transport: form.transport.trim() || undefined,
        description: form.description.trim() || undefined,
        subtotal,
        iva_porcentaje: form.iva_porcentaje,
        iva_valor: ivaValor,
        otros_impuestos: Number(form.otros_impuestos),
        total,
        status: currentStatus,
      };

      const poItems: CreatePOItemInput[] = items.map((item, index) => ({
        tarifario_id: item.tarifario_id ?? null,
        descripcion: item.descripcion,
        precio: Number(item.precio),
        order_index: index,
      }));

      let result: PurchaseOrder;

      if (isEditing && initialData) {
        result = await purchaseOrderService.updatePurchaseOrder(initialData.id, header, poItems);
      } else {
        result = await purchaseOrderService.createPurchaseOrder(header, poItems);
      }

      onSuccess(result);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      console.error('Error guardando OC:', err);
      alert(`Error al guardar: ${message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Render helpers
  // ---------------------------------------------------------------------------

  const inputClass = (hasError?: boolean) =>
    `w-full px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
      hasError ? 'border-red-400 focus:ring-red-400' : 'border-gray-300'
    }`;

  const labelClass = 'block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1';

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <>
      <Card className="max-w-4xl mx-auto shadow-2xl border-slate-200 overflow-hidden">
        {/* Header */}
        <CardHeader className="bg-slate-900 border-b p-6 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-800 rounded-lg">
              <ShoppingCart className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold">
                {isEditing ? 'Editar Orden de Compra' : 'Nueva Orden de Compra'}
                {isEditing && initialData?.po_number && (
                  <span className="ml-2 text-sm font-mono font-normal text-slate-400">
                    #{initialData.po_number}
                  </span>
                )}
              </CardTitle>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                {isEditing
                  ? 'Modifica los datos de esta orden de compra'
                  : 'Emite una orden de compra formal para un proveedor'}
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-8 space-y-10">

          {/* ----------------------------------------------------------------
              SECTION 1: Destinatario
          ---------------------------------------------------------------- */}
          <section className="space-y-5">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-500" />
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
                Destinatario
              </h3>
            </div>

            {/* Toggle proveedor no registrado */}
            <div className="flex items-center gap-2.5">
              <input
                id="unregistered-toggle"
                type="checkbox"
                checked={form.unregistered_provider}
                onChange={(e) => {
                  setField('unregistered_provider', e.target.checked);
                  if (e.target.checked) {
                    setField('provider_id', '');
                  }
                }}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <label
                htmlFor="unregistered-toggle"
                className="text-sm text-slate-600 cursor-pointer select-none"
              >
                Proveedor no registrado (ingreso manual)
              </label>
            </div>

            <div className="p-5 bg-slate-50/60 rounded-xl border border-slate-100 space-y-4">
              {/* Provider dropdown OR manual name */}
              {!form.unregistered_provider ? (
                <div>
                  <label className={labelClass}>Proveedor registrado</label>
                  <div className="relative">
                    <select
                      value={form.provider_id}
                      onChange={(e) => handleProviderSelect(e.target.value)}
                      disabled={loadingProviders}
                      className={`${inputClass()} appearance-none pr-8`}
                    >
                      <option value="">
                        {loadingProviders ? 'Cargando proveedores...' : 'Selecciona un proveedor'}
                      </option>
                      {providers.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.business_name}
                          {p.document_number ? ` — NIT ${p.document_number}` : ''}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Al seleccionar, los campos del destinatario se llenarán automáticamente.
                  </p>
                </div>
              ) : (
                <div>
                  <label className={labelClass}>
                    Nombre / Razón social <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.recipient_name}
                    onChange={(e) => setField('recipient_name', e.target.value)}
                    placeholder="Ej: Impresos Horizonte S.A.S."
                    className={inputClass(!!errors.recipient_name)}
                  />
                  {errors.recipient_name && (
                    <p className="text-xs text-red-500 mt-1">{errors.recipient_name}</p>
                  )}
                </div>
              )}

              {/* Auto-filled fields grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Name (auto-filled, read-only when provider selected) */}
                {!form.unregistered_provider && (
                  <div>
                    <label className={labelClass}>
                      Nombre / Razón social <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.recipient_name}
                      onChange={(e) => setField('recipient_name', e.target.value)}
                      placeholder="Auto-completado desde proveedor"
                      className={inputClass(!!errors.recipient_name)}
                    />
                    {errors.recipient_name && (
                      <p className="text-xs text-red-500 mt-1">{errors.recipient_name}</p>
                    )}
                  </div>
                )}

                <div>
                  <label className={labelClass}>NIT / Documento</label>
                  <input
                    type="text"
                    value={form.recipient_nit}
                    onChange={(e) => setField('recipient_nit', e.target.value)}
                    placeholder="Ej: 900.123.456-1"
                    className={inputClass()}
                  />
                </div>

                <div>
                  <label className={labelClass}>Dirección</label>
                  <input
                    type="text"
                    value={form.recipient_address}
                    onChange={(e) => setField('recipient_address', e.target.value)}
                    placeholder="Ej: Cra. 15 #93-47"
                    className={inputClass()}
                  />
                </div>

                <div>
                  <label className={labelClass}>Ciudad</label>
                  <input
                    type="text"
                    value={form.recipient_city}
                    onChange={(e) => setField('recipient_city', e.target.value)}
                    placeholder="Ej: Bogotá"
                    className={inputClass()}
                  />
                </div>

                <div>
                  <label className={labelClass}>Teléfono</label>
                  <input
                    type="text"
                    value={form.recipient_phone}
                    onChange={(e) => setField('recipient_phone', e.target.value)}
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
                    value={form.recipient_email}
                    onChange={(e) => setField('recipient_email', e.target.value)}
                    placeholder="correo@proveedor.com"
                    className={inputClass(!!errors.recipient_email)}
                  />
                  {errors.recipient_email && (
                    <p className="text-xs text-red-500 mt-1">{errors.recipient_email}</p>
                  )}
                  <p className="text-[10px] text-slate-400 mt-1">
                    Este correo recibirá la OC. Edita si el de facturación es diferente.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <Separator className="bg-slate-100" />

          {/* ----------------------------------------------------------------
              SECTION 2: Datos de la OC
          ---------------------------------------------------------------- */}
          <section className="space-y-5">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-purple-500" />
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
                Datos de la OC
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-5 bg-purple-50/20 rounded-xl border border-purple-100/50">
              {/* Autorizado por */}
              <div>
                <label className={labelClass}>
                  Autorizado por <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.authorized_by}
                  onChange={(e) => setField('authorized_by', e.target.value)}
                  placeholder="Nombre de quien autoriza"
                  className={inputClass(!!errors.authorized_by)}
                />
                {errors.authorized_by && (
                  <p className="text-xs text-red-500 mt-1">{errors.authorized_by}</p>
                )}
              </div>

              {/* Centro de costo */}
              <div>
                <label className={labelClass}>
                  Centro de costo <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={form.cost_center}
                    onChange={(e) => setField('cost_center', e.target.value)}
                    className={`${inputClass(!!errors.cost_center)} appearance-none pr-8`}
                  >
                    <option value="">Selecciona centro de costo</option>
                    {COST_CENTERS.map((cc) => (
                      <option key={cc} value={cc}>
                        {cc}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
                {errors.cost_center && (
                  <p className="text-xs text-red-500 mt-1">{errors.cost_center}</p>
                )}
              </div>

              {/* Proyecto (optional) */}
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

              {/* Transporte (optional) */}
              <div>
                <label className={labelClass}>Transporte (opcional)</label>
                <input
                  type="text"
                  value={form.transport}
                  onChange={(e) => setField('transport', e.target.value)}
                  placeholder="Ej: Domicilio incluido"
                  className={inputClass()}
                />
              </div>

              {/* Descripción (optional) */}
              <div className="md:col-span-2">
                <label className={labelClass}>Descripción general (opcional)</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setField('description', e.target.value)}
                  placeholder="Describe el objeto de esta orden de compra..."
                  rows={3}
                  className={`${inputClass()} resize-none`}
                />
              </div>
            </div>
          </section>

          <Separator className="bg-slate-100" />

          {/* ----------------------------------------------------------------
              SECTION 3: Items
          ---------------------------------------------------------------- */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-emerald-500" />
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
                  Items
                </h3>
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
                  Agregar linea libre
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide w-8">
                      #
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">
                      Descripcion
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide w-40">
                      Precio
                    </th>
                    <th className="px-4 py-3 w-24" aria-label="Acciones" />
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-12 text-center text-slate-400">
                        <Package className="w-8 h-8 opacity-20 mx-auto mb-2" />
                        <p className="text-xs font-medium uppercase tracking-widest">
                          No hay items. Agrega desde el tarifario o una linea libre.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    items.map((item, index) => (
                      <tr
                        key={item.id}
                        className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors"
                      >
                        <td className="px-4 py-3 text-xs text-slate-400 font-medium">
                          {index + 1}
                        </td>
                        <td className="px-4 py-3">
                          <textarea
                            value={item.descripcion}
                            onChange={(e) => updateItemField(item.id, 'descripcion', e.target.value)}
                            placeholder="Descripcion del item..."
                            rows={2}
                            className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none transition-colors"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            value={item.precio}
                            min={0}
                            step={1000}
                            onChange={(e) => updateItemField(item.id, 'precio', Number(e.target.value))}
                            className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm text-right bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                          />
                          <p className="text-[10px] text-slate-400 text-right mt-0.5">
                            {formatCurrency(Number(item.precio))}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => moveItem(item.id, 'up')}
                              disabled={index === 0}
                              aria-label="Subir item"
                              className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => moveItem(item.id, 'down')}
                              disabled={index === items.length - 1}
                              aria-label="Bajar item"
                              className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => removeItem(item.id)}
                              aria-label="Eliminar item"
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

          {/* ----------------------------------------------------------------
              SECTION 4: Totales
          ---------------------------------------------------------------- */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Calculator className="w-4 h-4 text-orange-500" />
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
                Totales
              </h3>
            </div>

            <div className="flex justify-end">
              <div className="w-full max-w-sm space-y-2">
                {/* Subtotal */}
                <div className="flex items-center justify-between py-2 px-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-sm text-slate-600 font-medium">Subtotal</span>
                  <span className="text-sm font-semibold text-slate-800">{formatCurrency(subtotal)}</span>
                </div>

                {/* IVA */}
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
                  <span className="text-sm font-semibold text-slate-800 whitespace-nowrap">
                    {formatCurrency(ivaValor)}
                  </span>
                </div>

                {/* Otros impuestos */}
                <div className="flex items-center justify-between gap-3 py-2 px-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-sm text-slate-600 font-medium whitespace-nowrap">
                    Otros impuestos
                  </span>
                  <input
                    type="number"
                    value={form.otros_impuestos}
                    min={0}
                    step={1000}
                    onChange={(e) => setField('otros_impuestos', Number(e.target.value))}
                    className="w-36 px-2 py-1 border border-gray-300 rounded-md text-sm text-right bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                </div>

                {/* Total */}
                <div className="flex items-center justify-between py-3 px-4 bg-slate-900 rounded-xl">
                  <span className="text-base font-bold text-white">TOTAL</span>
                  <span className="text-xl font-black text-white tracking-tight">
                    {formatCurrency(total)}
                  </span>
                </div>
              </div>
            </div>
          </section>

          <Separator className="bg-slate-100" />

          {/* ----------------------------------------------------------------
              SECTION 5: Actions
          ---------------------------------------------------------------- */}
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
              className="px-8 py-2.5 text-sm font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-all active:scale-95"
            >
              {isSubmitting
                ? 'Guardando...'
                : isEditing
                ? 'Guardar cambios'
                : 'Guardar borrador'}
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Tarifario modal */}
      {showTarifario && (
        <QuoteItemSelector
          onConfirm={handleTarifarioConfirm}
          onClose={() => setShowTarifario(false)}
        />
      )}
    </>
  );
}
