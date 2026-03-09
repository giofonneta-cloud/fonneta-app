'use client';

import { useState, useEffect } from 'react';
import { tarifarioService } from '../services/tarifarioService';
import type { TarifarioItem, CreateTarifarioInput, TipoProducto, CostCenter } from '../types/tarifario.types';
import { TIPO_PRODUCTO_LABELS, COST_CENTERS } from '../types/tarifario.types';

interface TarifarioFormProps {
  item?: TarifarioItem | null;
  onSuccess: () => void;
  onCancel: () => void;
}

const UNIDADES = ['unidad', 'página', 'spot', 'post', 'día', 'hora', 'evento', 'paquete', 'edición'];

export function TarifarioForm({ item, onSuccess, onCancel }: TarifarioFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<CreateTarifarioInput>({
    nombre: '',
    descripcion: '',
    tipo: 'editorial',
    cost_center: undefined,
    unidad: 'unidad',
    precio_piso: 0,
    precio_techo: 0,
    descuento_maximo: 0,
    is_active: true,
  });

  useEffect(() => {
    if (item) {
      setForm({
        nombre: item.nombre,
        descripcion: item.descripcion || '',
        tipo: item.tipo,
        cost_center: item.cost_center,
        unidad: item.unidad,
        precio_piso: item.precio_piso,
        precio_techo: item.precio_techo,
        descuento_maximo: item.descuento_maximo,
        is_active: item.is_active,
      });
    }
  }, [item]);

  const validate = (): string | null => {
    if (!form.nombre.trim()) return 'El nombre es requerido';
    if (form.precio_piso < 0) return 'El precio piso no puede ser negativo';
    if (form.precio_techo < 0) return 'El precio techo no puede ser negativo';
    if (form.precio_techo < form.precio_piso) return 'El precio techo debe ser mayor o igual al precio piso';
    if (form.descuento_maximo < 0 || form.descuento_maximo > 100) return 'El descuento máximo debe estar entre 0 y 100';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      if (item) {
        await tarifarioService.updateTarifarioItem(item.id, form);
      } else {
        await tarifarioService.createTarifarioItem(form);
      }
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">
        {item ? 'Editar Producto' : 'Nuevo Producto en Tarifario'}
      </h3>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {/* Nombre */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre del producto <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Ej: Página completa editorial"
            required
          />
        </div>

        {/* Descripción */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
          <textarea
            value={form.descripcion}
            onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={2}
            placeholder="Detalle del producto o servicio..."
          />
        </div>

        {/* Tipo + Centro de Costo */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo <span className="text-red-500">*</span>
            </label>
            <select
              value={form.tipo}
              onChange={(e) => setForm({ ...form, tipo: e.target.value as TipoProducto })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {(Object.entries(TIPO_PRODUCTO_LABELS) as [TipoProducto, string][]).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Centro de Costo</label>
            <select
              value={form.cost_center || ''}
              onChange={(e) => setForm({ ...form, cost_center: (e.target.value as CostCenter) || undefined })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Sin asignar</option>
              {COST_CENTERS.map((cc) => (
                <option key={cc} value={cc}>{cc}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Unidad */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Unidad de Medida</label>
          <select
            value={form.unidad}
            onChange={(e) => setForm({ ...form, unidad: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {UNIDADES.map((u) => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
        </div>

        {/* Precios */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Precio Piso (mín.) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={form.precio_piso}
              onChange={(e) => setForm({ ...form, precio_piso: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min={0}
              step={1000}
            />
            {form.precio_piso > 0 && (
              <p className="text-xs text-gray-400 mt-1">{formatCurrency(form.precio_piso)}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Precio Techo (base) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={form.precio_techo}
              onChange={(e) => setForm({ ...form, precio_techo: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min={0}
              step={1000}
            />
            {form.precio_techo > 0 && (
              <p className="text-xs text-gray-400 mt-1">{formatCurrency(form.precio_techo)}</p>
            )}
          </div>
        </div>

        {form.precio_techo < form.precio_piso && form.precio_techo > 0 && (
          <p className="text-xs text-red-500">El precio techo debe ser mayor o igual al precio piso</p>
        )}

        {/* Descuento máximo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Descuento Máximo que puede aplicar el vendedor (%)
          </label>
          <input
            type="number"
            value={form.descuento_maximo}
            onChange={(e) => setForm({ ...form, descuento_maximo: Number(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            min={0}
            max={100}
            step={1}
          />
          <p className="text-xs text-gray-400 mt-1">
            0% = sin descuento permitido. El precio mínimo permitido es siempre el precio piso.
          </p>
        </div>

        {/* Activo */}
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="is_active"
            checked={form.is_active}
            onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
            Producto activo (disponible para cotizar)
          </label>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'Guardando...' : item ? 'Guardar cambios' : 'Crear producto'}
          </button>
        </div>
      </form>
    </div>
  );
}
