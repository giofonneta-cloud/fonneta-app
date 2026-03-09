'use client';

import { useState, useEffect, useCallback } from 'react';
import { tarifarioService } from '@/features/tarifario/services/tarifarioService';
import type { TarifarioItem, TipoProducto, CostCenter } from '@/features/tarifario/types/tarifario.types';
import { TIPO_PRODUCTO_LABELS, TIPO_PRODUCTO_COLORS, COST_CENTERS } from '@/features/tarifario/types/tarifario.types';
import { quoteService } from '../services/quoteService';
import { X, Search, Plus, Minus } from 'lucide-react';

interface Selection {
  item: TarifarioItem;
  cantidad: number;
  precioUnitario: number;
  descuento: number;
}

interface QuoteItemSelectorProps {
  onConfirm: (selections: Selection[]) => void;
  onClose: () => void;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value);

export function QuoteItemSelector({ onConfirm, onClose }: QuoteItemSelectorProps) {
  const [items, setItems] = useState<TarifarioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tipoFilter, setTipoFilter] = useState<TipoProducto | ''>('');
  const [costCenterFilter, setCostCenterFilter] = useState<CostCenter | ''>('');
  const [selections, setSelections] = useState<Record<string, Selection>>({});

  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const data = await tarifarioService.getTarifario({
        activeOnly: true,
        tipo: tipoFilter || undefined,
        cost_center: costCenterFilter || undefined,
        search: search || undefined,
      });
      setItems(data);
    } finally {
      setLoading(false);
    }
  }, [search, tipoFilter, costCenterFilter]);

  useEffect(() => { loadItems(); }, [loadItems]);

  const toggleSelection = (item: TarifarioItem) => {
    setSelections((prev) => {
      if (prev[item.id]) {
        const next = { ...prev };
        delete next[item.id];
        return next;
      }
      return {
        ...prev,
        [item.id]: {
          item,
          cantidad: 1,
          precioUnitario: item.precio_techo,
          descuento: 0,
        },
      };
    });
  };

  const updateSelection = (itemId: string, field: 'cantidad' | 'precioUnitario' | 'descuento', value: number) => {
    setSelections((prev) => {
      if (!prev[itemId]) return prev;
      const sel = prev[itemId];
      const updated = { ...sel, [field]: value };

      // Validate precio against precio_piso
      if (field === 'precioUnitario' && value < sel.item.precio_piso) {
        updated.precioUnitario = sel.item.precio_piso;
      }
      // Validate descuento against descuento_maximo
      if (field === 'descuento' && value > sel.item.descuento_maximo) {
        updated.descuento = sel.item.descuento_maximo;
      }
      return { ...prev, [itemId]: updated };
    });
  };

  const selectedList = Object.values(selections);
  const totalSelections = selectedList.length;
  const grandTotal = selectedList.reduce(
    (sum, s) => sum + quoteService.calcularSubtotal(s.cantidad, s.precioUnitario, s.descuento),
    0
  );

  const handleConfirm = () => {
    if (selectedList.length > 0) {
      onConfirm(selectedList);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Seleccionar productos del tarifario</h3>
            <p className="text-sm text-gray-500 mt-0.5">Selecciona uno o más productos para agregar a la cotización</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-3 px-6 py-3 border-b border-gray-100 bg-gray-50">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={tipoFilter}
            onChange={(e) => setTipoFilter(e.target.value as TipoProducto | '')}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Todos los tipos</option>
            {(Object.entries(TIPO_PRODUCTO_LABELS) as [TipoProducto, string][]).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
          <select
            value={costCenterFilter}
            onChange={(e) => setCostCenterFilter(e.target.value as CostCenter | '')}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Todos los centros</option>
            {COST_CENTERS.map((cc) => (
              <option key={cc} value={cc}>{cc}</option>
            ))}
          </select>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-7 h-7 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>No se encontraron productos activos</p>
            </div>
          ) : (
            <div className="space-y-2">
              {items.map((item) => {
                const isSelected = !!selections[item.id];
                const sel = selections[item.id];
                return (
                  <div
                    key={item.id}
                    className={`rounded-xl border-2 transition-all ${
                      isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex items-start gap-3 p-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelection(item)}
                        className="mt-1 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                      <div className="flex-1 min-w-0" onClick={() => toggleSelection(item)} style={{ cursor: 'pointer' }}>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-gray-900 text-sm">{item.nombre}</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${TIPO_PRODUCTO_COLORS[item.tipo]}`}>
                            {TIPO_PRODUCTO_LABELS[item.tipo]}
                          </span>
                          {item.cost_center && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                              {item.cost_center}
                            </span>
                          )}
                        </div>
                        {item.descripcion && (
                          <p className="text-xs text-gray-500 mt-0.5 truncate">{item.descripcion}</p>
                        )}
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                          <span>Piso: <strong className="text-gray-700">{formatCurrency(item.precio_piso)}</strong></span>
                          <span>Techo: <strong className="text-green-700">{formatCurrency(item.precio_techo)}</strong></span>
                          <span>/{item.unidad}</span>
                          {item.descuento_maximo > 0 && <span>Dto. máx.: {item.descuento_maximo}%</span>}
                        </div>
                      </div>
                    </div>

                    {/* Inline editing when selected */}
                    {isSelected && sel && (
                      <div className="flex items-center gap-4 px-4 pb-3 pt-1 border-t border-blue-200">
                        {/* Cantidad */}
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500 font-medium">Cant.</span>
                          <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                            <button
                              onClick={() => updateSelection(item.id, 'cantidad', Math.max(1, sel.cantidad - 1))}
                              className="px-2 py-1 hover:bg-gray-100 text-gray-600"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <input
                              type="number"
                              value={sel.cantidad}
                              min={1}
                              onChange={(e) => updateSelection(item.id, 'cantidad', Math.max(1, Number(e.target.value)))}
                              className="w-12 text-center text-sm py-1 border-0 focus:ring-0"
                              onClick={(e) => e.stopPropagation()}
                            />
                            <button
                              onClick={() => updateSelection(item.id, 'cantidad', sel.cantidad + 1)}
                              className="px-2 py-1 hover:bg-gray-100 text-gray-600"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        {/* Precio */}
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500 font-medium">Precio unit.</span>
                          <input
                            type="number"
                            value={sel.precioUnitario}
                            min={item.precio_piso}
                            max={item.precio_techo * 2}
                            step={1000}
                            onChange={(e) => updateSelection(item.id, 'precioUnitario', Number(e.target.value))}
                            className={`w-32 text-sm px-2 py-1 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                              sel.precioUnitario < item.precio_piso ? 'border-red-400 bg-red-50' : 'border-gray-300'
                            }`}
                            onClick={(e) => e.stopPropagation()}
                          />
                          {sel.precioUnitario < item.precio_piso && (
                            <span className="text-xs text-red-500">Mín: {formatCurrency(item.precio_piso)}</span>
                          )}
                        </div>

                        {/* Descuento */}
                        {item.descuento_maximo > 0 && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500 font-medium">Dto. %</span>
                            <input
                              type="number"
                              value={sel.descuento}
                              min={0}
                              max={item.descuento_maximo}
                              step={1}
                              onChange={(e) => updateSelection(item.id, 'descuento', Number(e.target.value))}
                              className="w-16 text-sm px-2 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        )}

                        {/* Subtotal */}
                        <div className="ml-auto text-right">
                          <span className="text-xs text-gray-500">Subtotal</span>
                          <p className="text-sm font-semibold text-gray-900">
                            {formatCurrency(quoteService.calcularSubtotal(sel.cantidad, sel.precioUnitario, sel.descuento))}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            {totalSelections > 0 ? (
              <span>
                <strong className="text-gray-900">{totalSelections}</strong> producto(s) seleccionado(s)
                {' · '}
                Total: <strong className="text-green-700">{formatCurrency(grandTotal)}</strong>
              </span>
            ) : (
              <span>Selecciona productos para agregar</span>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              disabled={totalSelections === 0}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Agregar {totalSelections > 0 ? `${totalSelections} producto(s)` : 'productos'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
