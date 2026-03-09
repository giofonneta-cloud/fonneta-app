'use client';

import { useState, useEffect, useCallback } from 'react';
import { tarifarioService } from '../services/tarifarioService';
import { TarifarioForm } from './TarifarioForm';
import type { TarifarioItem, TarifarioFilters, TipoProducto, CostCenter } from '../types/tarifario.types';
import { TIPO_PRODUCTO_LABELS, TIPO_PRODUCTO_COLORS, COST_CENTERS } from '../types/tarifario.types';
import { PlusCircle, Pencil, Trash2, ToggleLeft, ToggleRight, Search } from 'lucide-react';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value);

export function TarifarioList() {
  const [items, setItems] = useState<TarifarioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<TarifarioItem | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [filters, setFilters] = useState<TarifarioFilters>({ activeOnly: false });

  const loadItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await tarifarioService.getTarifario(filters);
      setItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar tarifario');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { loadItems(); }, [loadItems]);

  const handleDelete = async (id: string) => {
    try {
      await tarifarioService.deleteTarifarioItem(id);
      setDeleteConfirm(null);
      loadItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar');
    }
  };

  const handleToggleActive = async (item: TarifarioItem) => {
    try {
      await tarifarioService.toggleActive(item.id, !item.is_active);
      loadItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar estado');
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingItem(null);
    loadItems();
  };

  const handleEdit = (item: TarifarioItem) => {
    setEditingItem(item);
    setShowForm(true);
  };

  const handleNewItem = () => {
    setEditingItem(null);
    setShowForm(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-800">Tarifario de Productos</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Catálogo global de productos y servicios con precios para cotizaciones
          </p>
        </div>
        <button
          onClick={handleNewItem}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm"
        >
          <PlusCircle className="w-4 h-4" />
          Nuevo producto
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <TarifarioForm
          item={editingItem}
          onSuccess={handleFormSuccess}
          onCancel={() => { setShowForm(false); setEditingItem(null); }}
        />
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar producto..."
            value={filters.search || ''}
            onChange={(e) => setFilters({ ...filters, search: e.target.value || undefined })}
            className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-colors placeholder:text-slate-300"
          />
        </div>
        <select
          value={filters.tipo || ''}
          onChange={(e) => setFilters({ ...filters, tipo: (e.target.value as TipoProducto) || undefined })}
          className="px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-colors text-slate-700 min-w-[150px]"
        >
          <option value="">Todos los tipos</option>
          {(Object.entries(TIPO_PRODUCTO_LABELS) as [TipoProducto, string][]).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        <select
          value={filters.cost_center || ''}
          onChange={(e) => setFilters({ ...filters, cost_center: (e.target.value as CostCenter) || undefined })}
          className="px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-colors text-slate-700 min-w-[150px]"
        >
          <option value="">Todos los centros</option>
          {COST_CENTERS.map((cc) => (
            <option key={cc} value={cc}>{cc}</option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer bg-white px-3 py-2 border border-slate-200 rounded-lg min-w-[150px]">
          <input
            type="checkbox"
            checked={filters.activeOnly === false}
            onChange={(e) => setFilters({ ...filters, activeOnly: e.target.checked ? false : true })}
            className="rounded border-gray-300 text-blue-600"
          />
          Mostrar inactivos
        </label>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-[10px] text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-4 py-3 font-bold tracking-wider">Producto</th>
              <th className="px-4 py-3 font-bold tracking-wider">Tipo</th>
              <th className="px-4 py-3 font-bold tracking-wider">Centro Costo</th>
              <th className="px-4 py-3 font-bold tracking-wider">Unidad</th>
              <th className="px-4 py-3 font-bold tracking-wider text-right">Precio Piso</th>
              <th className="px-4 py-3 font-bold tracking-wider text-right">Precio Techo</th>
              <th className="px-4 py-3 font-bold tracking-wider text-center">Dto. Máx.</th>
              <th className="px-4 py-3 font-bold tracking-wider text-center">Estado</th>
              <th className="px-4 py-3 font-bold tracking-wider text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 9 }).map((__, j) => (
                    <td key={j} className="px-4 py-4">
                      <div className="h-3 bg-slate-100 rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-16 text-center">
                  <div className="text-4xl mb-3">📋</div>
                  <p className="text-sm font-bold text-slate-400">No hay productos en el tarifario.</p>
                  <p className="text-xs text-slate-300 mt-1">Crea el primer producto para empezar a cotizar.</p>
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className={`hover:bg-gray-50 transition-colors ${!item.is_active ? 'opacity-50' : ''}`}>
                  <td className="px-4 py-3.5">
                    <div className="text-xs font-bold text-slate-700">{item.nombre}</div>
                    {item.descripcion && (
                      <div className="text-[10px] text-slate-400 truncate max-w-[200px] mt-0.5" title={item.descripcion}>{item.descripcion}</div>
                    )}
                  </td>
                  <td className="px-4 py-3.5 border-none">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${TIPO_PRODUCTO_COLORS[item.tipo]}`}>
                      {TIPO_PRODUCTO_LABELS[item.tipo]}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-slate-500">{item.cost_center || '—'}</td>
                  <td className="px-4 py-3.5 text-xs text-slate-500">{item.unidad}</td>
                  <td className="px-4 py-3.5 text-right font-mono text-xs font-semibold text-slate-700 whitespace-nowrap">{formatCurrency(item.precio_piso)}</td>
                  <td className="px-4 py-3.5 text-right font-mono text-xs font-bold text-emerald-600 whitespace-nowrap">{formatCurrency(item.precio_techo)}</td>
                  <td className="px-4 py-3.5 text-center text-xs text-slate-500">{item.descuento_maximo}%</td>
                  <td className="px-4 py-3.5 text-center">
                    <button
                      onClick={() => handleToggleActive(item)}
                      className="text-gray-400 hover:text-blue-600 transition-colors"
                      title={item.is_active ? 'Desactivar' : 'Activar'}
                    >
                      {item.is_active
                        ? <ToggleRight className="w-5 h-5 text-green-500" />
                        : <ToggleLeft className="w-5 h-5 text-gray-400" />
                      }
                    </button>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1.5 justify-center">
                      <button
                        onClick={() => handleEdit(item)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                        title="Editar"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      {deleteConfirm === item.id ? (
                        <div className="flex items-center gap-2 justify-center">
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="px-2.5 py-1 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
                          >
                            Confirmar
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            className="px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-md transition-colors"
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirm(item.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {!loading && items.length > 0 && (
        <div className="flex items-center justify-between pt-1 text-xs text-slate-400">
          <span>{items.length} producto(s) encontrado(s)</span>
        </div>
      )}
    </div>
  );
}
