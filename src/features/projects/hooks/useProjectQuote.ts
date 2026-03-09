'use client';

import { useState, useEffect, useCallback } from 'react';
import { quoteService } from '../services/quoteService';
import { projectService } from '../services/projectService';
import type { CotizacionItem, CotizacionTotals, CreateCotizacionItemInput, UpdateCotizacionItemInput } from '../types/quote.types';
import type { TarifarioItem } from '@/features/tarifario/types/tarifario.types';

interface UseProjectQuoteReturn {
  items: CotizacionItem[];
  totals: CotizacionTotals;
  loading: boolean;
  error: string | null;
  addItemsFromTarifario: (selections: Array<{ item: TarifarioItem; cantidad: number; precioUnitario: number; descuento: number }>) => Promise<void>;
  updateItem: (id: string, updates: UpdateCotizacionItemInput) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useProjectQuote(projectId: string | null): UseProjectQuoteReturn {
  const [items, setItems] = useState<CotizacionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadItems = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await quoteService.getCotizacionByProject(projectId);
      setItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar cotización');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { loadItems(); }, [loadItems]);

  const syncBudgetIncome = useCallback(async (updatedItems: CotizacionItem[]) => {
    if (!projectId) return;
    try {
      const totals = quoteService.calcularTotales(updatedItems);
      if (totals.total > 0) {
        await projectService.updateProject(projectId, { budget_income: totals.total });
      }
    } catch {
      // Non-blocking: budget sync failure doesn't break the UX
    }
  }, [projectId]);

  const addItemsFromTarifario = useCallback(async (
    selections: Array<{ item: TarifarioItem; cantidad: number; precioUnitario: number; descuento: number }>
  ) => {
    if (!projectId) return;
    setError(null);
    try {
      const promises = selections.map(({ item, cantidad, precioUnitario, descuento }) => {
        const input: CreateCotizacionItemInput = {
          project_id: projectId,
          tarifario_id: item.id,
          nombre: item.nombre,
          descripcion: item.descripcion,
          tipo: item.tipo,
          cost_center: item.cost_center,
          unidad: item.unidad,
          cantidad,
          precio_unitario: precioUnitario,
          precio_piso: item.precio_piso,
          precio_techo: item.precio_techo,
          descuento_porcentaje: descuento,
          subtotal: quoteService.calcularSubtotal(cantidad, precioUnitario, descuento),
        };
        return quoteService.addCotizacionItem(input);
      });

      const newItems = await Promise.all(promises);
      const updatedItems = [...items, ...newItems];
      setItems(updatedItems);
      await syncBudgetIncome(updatedItems);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al agregar productos');
    }
  }, [projectId, items, syncBudgetIncome]);

  const updateItem = useCallback(async (id: string, updates: UpdateCotizacionItemInput) => {
    setError(null);
    try {
      const updated = await quoteService.updateCotizacionItem(id, updates);
      const updatedItems = items.map((i) => (i.id === id ? updated : i));
      setItems(updatedItems);
      await syncBudgetIncome(updatedItems);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar ítem');
    }
  }, [items, syncBudgetIncome]);

  const removeItem = useCallback(async (id: string) => {
    setError(null);
    try {
      await quoteService.deleteCotizacionItem(id);
      const updatedItems = items.filter((i) => i.id !== id);
      setItems(updatedItems);
      await syncBudgetIncome(updatedItems);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar ítem');
    }
  }, [items, syncBudgetIncome]);

  const totals = quoteService.calcularTotales(items);

  return { items, totals, loading, error, addItemsFromTarifario, updateItem, removeItem, refresh: loadItems };
}
