'use client';

import { useState, useRef } from 'react';
import type { PurchaseOrder, PurchaseOrderItem } from '../types/purchase-order.types';
import { PO_STATUS_LABELS, PO_STATUS_COLORS } from '../types/purchase-order.types';
import { X, FileDown, Send, Pencil, Loader2, Paperclip, Trash2 } from 'lucide-react';

interface PurchaseOrderPreviewProps {
  po: PurchaseOrder;
  onClose: () => void;
  onEdit: () => void;
  onSent: () => void;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value);

const formatDate = (dateStr: string) => {
  const [datePart] = dateStr.split('T');
  const [y, m, d] = datePart.split('-');
  return `${d}/${m}/${y}`;
};

export function PurchaseOrderPreview({ po, onClose, onEdit, onSent }: PurchaseOrderPreviewProps) {
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const items = po.items ?? [];

  const handleDownloadPDF = () => {
    const html = buildPrintHTML(po, items);
    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.onload = () => printWindow.print();
    }
  };

  const handleAddFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveFile = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    if (!po.recipient_email) {
      setSendError('No se ha especificado el email del destinatario');
      return;
    }

    setSending(true);
    setSendError(null);

    try {
      let res: Response;

      if (attachments.length > 0) {
        const formData = new FormData();
        formData.append('purchaseOrderId', po.id);
        attachments.forEach((file) => formData.append('attachments', file));
        res = await fetch('/api/purchase-orders/send', {
          method: 'POST',
          body: formData,
        });
      } else {
        res = await fetch('/api/purchase-orders/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ purchaseOrderId: po.id }),
        });
      }

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al enviar la orden de compra');
      }

      onSent();
    } catch (err) {
      setSendError(err instanceof Error ? err.message : 'Error al enviar');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Orden de Compra {po.po_number}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${PO_STATUS_COLORS[po.status]}`}>
                {PO_STATUS_LABELS[po.status]}
              </span>
              <span className="text-sm text-gray-500">
                {formatDate(po.created_at)}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content — scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Company header */}
          <div className="flex justify-between items-start pb-4 border-b-2 border-blue-600">
            <div className="flex items-start gap-3">
              <img src="/logo.png" alt="Fonneta" className="w-10 h-auto mt-0.5" />
              <div>
                <h2 className="text-xl font-black text-blue-700">FONNETA COMUNICACIONES S.A.S.</h2>
                <p className="text-xs text-gray-500 mt-1">NIT 901.362.051-7</p>
                <p className="text-xs text-gray-500">Calle 93 No. 14-17 Of. 501, Bogota D.C.</p>
                <p className="text-xs text-gray-500">Tel: (601) 744 7677</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-gray-900">ORDEN DE COMPRA</p>
              <p className="text-blue-700 font-semibold">No. {po.po_number}</p>
              <p className="text-xs text-gray-500 mt-1">Fecha: {formatDate(po.created_at)}</p>
            </div>
          </div>

          {/* Recipient info */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-2">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Emitido para</p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-500">Nombre: </span>
                <span className="font-medium text-gray-900">{po.recipient_name}</span>
              </div>
              {po.recipient_nit && (
                <div>
                  <span className="text-gray-500">NIT: </span>
                  <span className="font-medium text-gray-900">{po.recipient_nit}</span>
                </div>
              )}
              {po.recipient_address && (
                <div>
                  <span className="text-gray-500">Direccion: </span>
                  <span className="font-medium text-gray-900">{po.recipient_address}</span>
                </div>
              )}
              {po.recipient_city && (
                <div>
                  <span className="text-gray-500">Ciudad: </span>
                  <span className="font-medium text-gray-900">{po.recipient_city}</span>
                </div>
              )}
              {po.recipient_phone && (
                <div>
                  <span className="text-gray-500">Telefono: </span>
                  <span className="font-medium text-gray-900">{po.recipient_phone}</span>
                </div>
              )}
              <div>
                <span className="text-gray-500">Email: </span>
                <span className="font-medium text-gray-900">{po.recipient_email}</span>
              </div>
            </div>
          </div>

          {/* OC details */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            {po.authorized_by && (
              <div>
                <span className="text-gray-500">Autorizado por: </span>
                <span className="font-medium">{po.authorized_by}</span>
              </div>
            )}
            {po.cost_center && (
              <div>
                <span className="text-gray-500">Centro de costo: </span>
                <span className="font-medium">{po.cost_center}</span>
              </div>
            )}
            {po.project_name && (
              <div>
                <span className="text-gray-500">Proyecto: </span>
                <span className="font-medium">{po.project_name}</span>
              </div>
            )}
            {po.transport && (
              <div>
                <span className="text-gray-500">Transporte: </span>
                <span className="font-medium">{po.transport}</span>
              </div>
            )}
          </div>

          {po.description && (
            <div className="text-sm">
              <span className="text-gray-500">Descripcion: </span>
              <span className="text-gray-900">{po.description}</span>
            </div>
          )}

          {/* Items table */}
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="text-left px-4 py-2.5 text-xs font-bold text-gray-500 uppercase tracking-wider w-10">#</th>
                  <th className="text-left px-4 py-2.5 text-xs font-bold text-gray-500 uppercase tracking-wider">Descripcion</th>
                  <th className="text-right px-4 py-2.5 text-xs font-bold text-gray-500 uppercase tracking-wider w-36">Precio</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-500">{idx + 1}</td>
                    <td className="px-4 py-3 text-gray-900 whitespace-pre-wrap">{item.descripcion}</td>
                    <td className="px-4 py-3 text-right font-mono font-medium text-gray-900">{formatCurrency(item.precio)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-72 space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Subtotal</span>
                <span className="font-mono">{formatCurrency(po.subtotal)}</span>
              </div>
              {po.iva_porcentaje > 0 && (
                <div className="flex justify-between text-sm text-gray-600">
                  <span>IVA ({po.iva_porcentaje}%)</span>
                  <span className="font-mono">{formatCurrency(po.iva_valor)}</span>
                </div>
              )}
              {po.otros_impuestos > 0 && (
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Otros impuestos</span>
                  <span className="font-mono">{formatCurrency(po.otros_impuestos)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold text-gray-900 pt-2 border-t-2 border-gray-300">
                <span>TOTAL</span>
                <span className="font-mono text-green-700">{formatCurrency(po.total)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Attachments — for draft and enviada */}
        {(po.status === 'borrador' || po.status === 'enviada') && (
          <div className="mx-6 mb-2">
            <div className="flex items-center gap-2 mb-2">
              <Paperclip className="w-4 h-4 text-gray-400" />
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Adjuntos</span>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="ml-auto text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                + Agregar archivo
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleAddFiles}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
              />
            </div>
            {attachments.length > 0 ? (
              <div className="space-y-1">
                {attachments.map((file, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-1.5 text-xs">
                    <span className="text-gray-700 truncate max-w-[300px]">{file.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">{(file.size / 1024).toFixed(0)} KB</span>
                      <button
                        onClick={() => handleRemoveFile(idx)}
                        className="p-0.5 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400">Sin archivos adjuntos. Puedes agregar PDFs, documentos o imagenes.</p>
            )}
          </div>
        )}

        {/* Error */}
        {sendError && (
          <div className="mx-6 mb-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-2 text-sm">
            {sendError}
          </div>
        )}

        {/* Footer actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Cerrar
          </button>
          <div className="flex gap-3">
            {(po.status === 'borrador' || po.status === 'enviada') && (
              <button
                onClick={onEdit}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Pencil className="w-4 h-4" />
                Editar
              </button>
            )}
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <FileDown className="w-4 h-4" />
              Descargar PDF
            </button>
            {(po.status === 'borrador' || po.status === 'enviada') && (
              <button
                onClick={handleSend}
                disabled={sending}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {sending ? 'Enviando...' : po.status === 'enviada' ? 'Reenviar al proveedor' : 'Enviar al proveedor'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── PDF Print HTML Builder ───────────────────────────────────────────────────

const FONNETA_LOGO_B64 = 'data:image/png;base64,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';

function buildPrintHTML(po: PurchaseOrder, items: PurchaseOrderItem[]): string {
  const date = formatDate(po.created_at);
  const fmt = (n: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);

  const rows = items.map((item, idx) => `
    <tr>
      <td style="padding:8px 12px; border-bottom:1px solid #e5e7eb; text-align:center; color:#6b7280;">${idx + 1}</td>
      <td style="padding:8px 12px; border-bottom:1px solid #e5e7eb; white-space:pre-wrap;">${item.descripcion}</td>
      <td style="padding:8px 12px; border-bottom:1px solid #e5e7eb; text-align:right; font-family:monospace; font-weight:600;">${fmt(item.precio)}</td>
    </tr>
  `).join('');

  const recipientRows = [
    `<tr><td style="padding:4px 0; color:#6b7280; width:120px;">Nombre:</td><td style="padding:4px 0; font-weight:600;">${po.recipient_name}</td></tr>`,
    po.recipient_nit ? `<tr><td style="padding:4px 0; color:#6b7280;">NIT:</td><td style="padding:4px 0;">${po.recipient_nit}</td></tr>` : '',
    po.recipient_address ? `<tr><td style="padding:4px 0; color:#6b7280;">Direccion:</td><td style="padding:4px 0;">${po.recipient_address}</td></tr>` : '',
    po.recipient_city ? `<tr><td style="padding:4px 0; color:#6b7280;">Ciudad:</td><td style="padding:4px 0;">${po.recipient_city}</td></tr>` : '',
    po.recipient_phone ? `<tr><td style="padding:4px 0; color:#6b7280;">Telefono:</td><td style="padding:4px 0;">${po.recipient_phone}</td></tr>` : '',
    `<tr><td style="padding:4px 0; color:#6b7280;">Email:</td><td style="padding:4px 0;">${po.recipient_email}</td></tr>`,
  ].filter(Boolean).join('');

  const detailRows = [
    po.authorized_by ? `<tr><td style="padding:4px 0; color:#6b7280; width:140px;">Autorizado por:</td><td style="padding:4px 0;">${po.authorized_by}</td></tr>` : '',
    po.cost_center ? `<tr><td style="padding:4px 0; color:#6b7280;">Centro de costo:</td><td style="padding:4px 0;">${po.cost_center}</td></tr>` : '',
    po.project_name ? `<tr><td style="padding:4px 0; color:#6b7280;">Proyecto:</td><td style="padding:4px 0;">${po.project_name}</td></tr>` : '',
    po.transport ? `<tr><td style="padding:4px 0; color:#6b7280;">Transporte:</td><td style="padding:4px 0;">${po.transport}</td></tr>` : '',
  ].filter(Boolean).join('');

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Orden de Compra ${po.po_number}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 13px; color: #111827; background: #fff; }
    .page { max-width: 800px; margin: 0 auto; padding: 40px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; padding-bottom: 20px; border-bottom: 3px solid #1d4ed8; }
    .company-name { font-size: 20px; font-weight: 900; color: #1d4ed8; }
    .company-info { font-size: 11px; color: #6b7280; margin-top: 4px; }
    .po-title { font-size: 18px; font-weight: 700; color: #111827; }
    .po-number { font-size: 14px; color: #1d4ed8; font-weight: 600; }
    .section { margin-bottom: 20px; }
    .section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; margin-bottom: 8px; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; }
    table.items { width: 100%; border-collapse: collapse; }
    table.items thead tr { background: #f3f4f6; }
    table.items thead th { padding: 10px 12px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; font-weight: 600; }
    table.items thead th:first-child { text-align: center; width: 40px; }
    table.items thead th:last-child { text-align: right; }
    .totals { display: flex; justify-content: flex-end; margin-top: 16px; }
    .totals-box { width: 260px; }
    .totals-row { display: flex; justify-content: space-between; padding: 5px 0; font-size: 13px; color: #6b7280; }
    .totals-row.total { border-top: 2px solid #1d4ed8; margin-top: 6px; padding-top: 10px; font-size: 16px; font-weight: 700; color: #111827; }
    .totals-row.total span:last-child { color: #16a34a; }
    .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e5e7eb; text-align: center; color: #9ca3af; font-size: 11px; }
    @media print {
      body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
      .page { padding: 20px; }
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <div style="display:flex; align-items:flex-start; gap:12px;">
        <img src="${FONNETA_LOGO_B64}" alt="Fonneta" style="width:40px; height:auto; margin-top:2px;" />
        <div>
          <div class="company-name">FONNETA COMUNICACIONES S.A.S.</div>
          <div class="company-info">NIT 901.362.051-7</div>
          <div class="company-info">Calle 93 No. 14-17 Of. 501, Bogota D.C.</div>
          <div class="company-info">Tel: (601) 744 7677</div>
        </div>
      </div>
      <div style="text-align:right;">
        <div class="po-title">ORDEN DE COMPRA</div>
        <div class="po-number">No. ${po.po_number}</div>
        <div style="font-size:12px; color:#6b7280; margin-top:4px;">Fecha: ${date}</div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Emitido Para</div>
      <table style="font-size:13px;"><tbody>${recipientRows}</tbody></table>
    </div>

    ${detailRows ? `
    <div class="section">
      <div class="section-title">Detalles</div>
      <table style="font-size:13px;"><tbody>${detailRows}</tbody></table>
    </div>
    ` : ''}

    ${po.description ? `
    <div class="section">
      <div class="section-title">Descripcion</div>
      <p style="font-size:13px; color:#374151;">${po.description}</p>
    </div>
    ` : ''}

    <div class="section">
      <div class="section-title">Items</div>
      <table class="items">
        <thead>
          <tr>
            <th style="text-align:center">#</th>
            <th>Descripcion</th>
            <th style="text-align:right">Precio</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>

      <div class="totals">
        <div class="totals-box">
          <div class="totals-row">
            <span>Subtotal</span>
            <span style="font-family:monospace">${fmt(po.subtotal)}</span>
          </div>
          ${po.iva_porcentaje > 0 ? `
          <div class="totals-row">
            <span>IVA (${po.iva_porcentaje}%)</span>
            <span style="font-family:monospace">${fmt(po.iva_valor)}</span>
          </div>
          ` : ''}
          ${po.otros_impuestos > 0 ? `
          <div class="totals-row">
            <span>Otros impuestos</span>
            <span style="font-family:monospace">${fmt(po.otros_impuestos)}</span>
          </div>
          ` : ''}
          <div class="totals-row total">
            <span>TOTAL</span>
            <span style="font-family:monospace">${fmt(po.total)}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="footer">
      Fonneta Comunicaciones S.A.S. &middot; Orden de Compra ${po.po_number} &middot; ${date}
    </div>
  </div>
</body>
</html>`;
}
