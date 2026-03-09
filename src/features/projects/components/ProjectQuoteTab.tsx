'use client';

import { useState } from 'react';
import { useProjectQuote } from '../hooks/useProjectQuote';
import { QuoteItemSelector } from './QuoteItemSelector';
import type { Project } from '../types/project.types';
import type { CotizacionItem } from '../types/quote.types';
import { Trash2, Pencil, Check, X, FileText, PlusCircle, FileDown } from 'lucide-react';
import type { TarifarioItem } from '@/features/tarifario/types/tarifario.types';
import { TIPO_PRODUCTO_COLORS, TIPO_PRODUCTO_LABELS } from '@/features/tarifario/types/tarifario.types';
import type { TipoProducto } from '@/features/tarifario/types/tarifario.types';

interface ProjectQuoteTabProps {
  project: Project;
  onConvertToSale?: (totals: { subtotal: number; iva: number; total: number }) => void;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value);

interface EditState {
  cantidad: number;
  precioUnitario: number;
  descuentoPorcentaje: number;
}

export function ProjectQuoteTab({ project, onConvertToSale }: ProjectQuoteTabProps) {
  const { items, totals, loading, error, addItemsFromTarifario, updateItem, removeItem } = useProjectQuote(project.id);
  const [showSelector, setShowSelector] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editState, setEditState] = useState<EditState | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSelectorConfirm = async (selections: Array<{ item: TarifarioItem; cantidad: number; precioUnitario: number; descuento: number }>) => {
    setShowSelector(false);
    setSaving(true);
    try {
      await addItemsFromTarifario(selections);
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (item: CotizacionItem) => {
    setEditingId(item.id);
    setEditState({
      cantidad: item.cantidad,
      precioUnitario: item.precio_unitario,
      descuentoPorcentaje: item.descuento_porcentaje,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditState(null);
  };

  const saveEdit = async (item: CotizacionItem) => {
    if (!editState) return;
    setSaving(true);
    try {
      await updateItem(item.id, {
        cantidad: editState.cantidad,
        precio_unitario: editState.precioUnitario,
        descuento_porcentaje: editState.descuentoPorcentaje,
      });
      setEditingId(null);
      setEditState(null);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setSaving(true);
    try {
      await removeItem(id);
      setDeleteConfirm(null);
    } finally {
      setSaving(false);
    }
  };

  const handleGeneratePDF = () => {
    const printContent = buildPrintHTML(project, items, totals);
    const win = window.open('', '_blank', 'width=900,height=700');
    if (!win) return;
    win.document.write(printContent);
    win.document.close();
    win.onload = () => {
      win.focus();
      win.print();
    };
  };

  const calcSubtotal = (cantidad: number, precio: number, descuento: number) =>
    Math.round(cantidad * precio * (1 - descuento / 100));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-900">Cotización</h3>
          <p className="text-sm text-gray-500 mt-0.5">
            {items.length === 0
              ? 'Agrega productos del tarifario para construir la cotización'
              : `${items.length} producto(s) · El presupuesto del proyecto se actualiza automáticamente`}
          </p>
        </div>
        <button
          onClick={() => setShowSelector(true)}
          className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          <PlusCircle className="w-4 h-4" />
          Agregar productos
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>
      )}

      {/* Items table */}
      {items.length > 0 ? (
        <>
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Producto</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tipo</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-16">Cant.</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Precio unit.</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-16">Dto. %</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Subtotal</th>
                  <th className="px-4 py-3 w-24" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((item) => {
                  const isEditing = editingId === item.id;
                  const previewSubtotal = editState
                    ? calcSubtotal(editState.cantidad, editState.precioUnitario, editState.descuentoPorcentaje)
                    : item.subtotal;

                  return (
                    <tr key={item.id} className={`hover:bg-gray-50 transition-colors ${isEditing ? 'bg-blue-50' : ''}`}>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{item.nombre}</div>
                        {item.descripcion && (
                          <div className="text-xs text-gray-400 truncate max-w-[200px]">{item.descripcion}</div>
                        )}
                        <div className="text-xs text-gray-400">{item.unidad}</div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {item.tipo && (
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${TIPO_PRODUCTO_COLORS[item.tipo as TipoProducto] || 'bg-gray-100 text-gray-600'}`}>
                            {TIPO_PRODUCTO_LABELS[item.tipo as TipoProducto] || item.tipo}
                          </span>
                        )}
                      </td>

                      {/* Cantidad */}
                      <td className="px-4 py-3 text-center">
                        {isEditing && editState ? (
                          <input
                            type="number"
                            value={editState.cantidad}
                            min={1}
                            onChange={(e) => setEditState({ ...editState, cantidad: Math.max(1, Number(e.target.value)) })}
                            className="w-14 text-center text-sm px-2 py-1 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        ) : (
                          <span className="text-gray-900">{item.cantidad}</span>
                        )}
                      </td>

                      {/* Precio */}
                      <td className="px-4 py-3 text-right">
                        {isEditing && editState ? (
                          <div>
                            <input
                              type="number"
                              value={editState.precioUnitario}
                              min={item.precio_piso ?? 0}
                              step={1000}
                              onChange={(e) => setEditState({ ...editState, precioUnitario: Number(e.target.value) })}
                              className={`w-28 text-right text-sm px-2 py-1 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                                item.precio_piso && editState.precioUnitario < item.precio_piso
                                  ? 'border-red-400 bg-red-50'
                                  : 'border-blue-300'
                              }`}
                            />
                            {item.precio_piso && editState.precioUnitario < item.precio_piso && (
                              <p className="text-xs text-red-500 mt-0.5">Mín: {formatCurrency(item.precio_piso)}</p>
                            )}
                          </div>
                        ) : (
                          <span className="font-mono text-gray-900">{formatCurrency(item.precio_unitario)}</span>
                        )}
                      </td>

                      {/* Descuento */}
                      <td className="px-4 py-3 text-center">
                        {isEditing && editState ? (
                          <input
                            type="number"
                            value={editState.descuentoPorcentaje}
                            min={0}
                            max={100}
                            step={1}
                            onChange={(e) => setEditState({ ...editState, descuentoPorcentaje: Number(e.target.value) })}
                            className="w-14 text-center text-sm px-2 py-1 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        ) : (
                          <span className="text-gray-600">{item.descuento_porcentaje > 0 ? `${item.descuento_porcentaje}%` : '—'}</span>
                        )}
                      </td>

                      {/* Subtotal */}
                      <td className="px-4 py-3 text-right font-semibold font-mono text-gray-900">
                        {formatCurrency(isEditing ? previewSubtotal : item.subtotal)}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          {isEditing ? (
                            <>
                              <button
                                onClick={() => saveEdit(item)}
                                disabled={saving}
                                className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                title="Guardar"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={cancelEdit}
                                className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors"
                                title="Cancelar"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => startEdit(item)}
                                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Editar"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              {deleteConfirm === item.id ? (
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => handleDelete(item.id)}
                                    className="px-2 py-1 text-xs text-white bg-red-600 rounded hover:bg-red-700"
                                  >
                                    Sí
                                  </button>
                                  <button
                                    onClick={() => setDeleteConfirm(null)}
                                    className="px-2 py-1 text-xs text-gray-600 border rounded hover:bg-gray-50"
                                  >
                                    No
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setDeleteConfirm(item.id)}
                                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Eliminar"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="bg-white border border-gray-200 rounded-xl p-5 w-72 space-y-3">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Subtotal (sin IVA)</span>
                <span className="font-mono">{formatCurrency(totals.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>IVA (19%)</span>
                <span className="font-mono">{formatCurrency(totals.iva)}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-gray-900 pt-2 border-t border-gray-200">
                <span>Total</span>
                <span className="font-mono text-green-700">{formatCurrency(totals.total)}</span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 justify-end">
            <button
              onClick={handleGeneratePDF}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <FileDown className="w-4 h-4" />
              Generar PDF
            </button>
            {onConvertToSale && (
              <button
                onClick={() => onConvertToSale(totals)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors"
              >
                <FileText className="w-4 h-4" />
                Convertir a Venta
              </button>
            )}
          </div>
        </>
      ) : (
        <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-xl">
          <div className="text-4xl mb-3">📋</div>
          <p className="font-medium text-gray-700">Sin productos cotizados</p>
          <p className="text-sm text-gray-500 mt-1 mb-5">Agrega productos del tarifario para construir tu cotización</p>
          <button
            onClick={() => setShowSelector(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors mx-auto"
          >
            <PlusCircle className="w-4 h-4" />
            Agregar productos
          </button>
        </div>
      )}

      {/* Selector Modal */}
      {showSelector && (
        <QuoteItemSelector
          onConfirm={handleSelectorConfirm}
          onClose={() => setShowSelector(false)}
        />
      )}
    </div>
  );
}

// ─── PDF Print HTML Builder ───────────────────────────────────────────────────

function buildPrintHTML(
  project: Project,
  items: CotizacionItem[],
  totals: { subtotal: number; iva: number; total: number }
): string {
  const today = new Date().toLocaleDateString('es-CO', { dateStyle: 'long' });
  const validity = new Date();
  validity.setDate(validity.getDate() + 30);
  const validityStr = validity.toLocaleDateString('es-CO', { dateStyle: 'long' });

  const fmt = (n: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);

  const rows = items.map((item) => `
    <tr>
      <td style="padding:8px 12px; border-bottom:1px solid #e5e7eb;">
        <strong>${item.nombre}</strong>
        ${item.descripcion ? `<br/><span style="color:#6b7280;font-size:11px;">${item.descripcion}</span>` : ''}
      </td>
      <td style="padding:8px 12px; border-bottom:1px solid #e5e7eb; text-align:center; color:#6b7280;">${item.unidad}</td>
      <td style="padding:8px 12px; border-bottom:1px solid #e5e7eb; text-align:center;">${item.cantidad}</td>
      <td style="padding:8px 12px; border-bottom:1px solid #e5e7eb; text-align:right; font-family:monospace;">${fmt(item.precio_unitario)}</td>
      <td style="padding:8px 12px; border-bottom:1px solid #e5e7eb; text-align:center; color:#6b7280;">${item.descuento_porcentaje > 0 ? `${item.descuento_porcentaje}%` : '—'}</td>
      <td style="padding:8px 12px; border-bottom:1px solid #e5e7eb; text-align:right; font-family:monospace; font-weight:600;">${fmt(item.subtotal)}</td>
    </tr>
  `).join('');

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Cotización — ${project.name}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 13px; color: #111827; background: #fff; }
    .page { max-width: 900px; margin: 0 auto; padding: 40px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; padding-bottom: 24px; border-bottom: 2px solid #1d4ed8; }
    .company-name { font-size: 24px; font-weight: 900; color: #1d4ed8; letter-spacing: -0.5px; }
    .quote-meta { text-align: right; }
    .quote-title { font-size: 20px; font-weight: 700; color: #111827; margin-bottom: 4px; }
    .quote-date { font-size: 12px; color: #6b7280; }
    .section { margin-bottom: 24px; }
    .section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; margin-bottom: 8px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; background: #f9fafb; padding: 16px; border-radius: 8px; }
    .info-item label { font-size: 11px; color: #9ca3af; display: block; margin-bottom: 2px; }
    .info-item span { font-weight: 600; color: #111827; }
    table { width: 100%; border-collapse: collapse; }
    thead tr { background: #f3f4f6; }
    thead th { padding: 10px 12px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; font-weight: 600; }
    thead th:last-child, thead th:nth-child(4), thead th:nth-child(6) { text-align: right; }
    thead th:nth-child(2), thead th:nth-child(3), thead th:nth-child(5) { text-align: center; }
    .totals { display: flex; justify-content: flex-end; margin-top: 20px; }
    .totals-box { width: 280px; }
    .totals-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; color: #6b7280; }
    .totals-row.total { border-top: 2px solid #e5e7eb; margin-top: 4px; padding-top: 10px; font-size: 16px; font-weight: 700; color: #111827; }
    .totals-row.total span:last-child { color: #16a34a; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; display: flex; justify-content: space-between; color: #9ca3af; font-size: 11px; }
    @media print {
      body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
      .page { padding: 20px; }
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <div>
        <div class="company-name">Fonnettapp</div>
        <div style="color:#6b7280; font-size:12px; margin-top:4px;">Fonneta S.A.S.</div>
      </div>
      <div class="quote-meta">
        <div class="quote-title">COTIZACIÓN</div>
        ${project.quotation_number ? `<div style="font-size:13px; color:#1d4ed8; font-weight:600;">No. ${project.quotation_number}</div>` : ''}
        <div class="quote-date">Fecha: ${today}</div>
        <div class="quote-date">Válida hasta: ${validityStr}</div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Información del Proyecto</div>
      <div class="info-grid">
        <div class="info-item"><label>Proyecto</label><span>${project.name}</span></div>
        <div class="info-item"><label>Cliente</label><span>${project.client}</span></div>
        ${project.line_of_business ? `<div class="info-item"><label>Línea de Negocio</label><span>${project.line_of_business}</span></div>` : ''}
        ${project.cost_center ? `<div class="info-item"><label>Centro de Costo</label><span>${project.cost_center}</span></div>` : ''}
      </div>
    </div>

    <div class="section">
      <div class="section-title">Detalle de la Cotización</div>
      <table>
        <thead>
          <tr>
            <th>Producto / Servicio</th>
            <th style="text-align:center">Unidad</th>
            <th style="text-align:center">Cant.</th>
            <th style="text-align:right">Precio Unit.</th>
            <th style="text-align:center">Dto.</th>
            <th style="text-align:right">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>

      <div class="totals">
        <div class="totals-box">
          <div class="totals-row">
            <span>Subtotal (sin IVA)</span>
            <span style="font-family:monospace">${fmt(totals.subtotal)}</span>
          </div>
          <div class="totals-row">
            <span>IVA (19%)</span>
            <span style="font-family:monospace">${fmt(totals.iva)}</span>
          </div>
          <div class="totals-row total">
            <span>TOTAL</span>
            <span style="font-family:monospace">${fmt(totals.total)}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="footer">
      <span>Esta cotización es válida por 30 días a partir de la fecha de emisión.</span>
      <span>Generado por Fonnettapp · ${today}</span>
    </div>
  </div>
</body>
</html>`;
}
