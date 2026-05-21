'use client';

import { useState, useRef, useCallback } from 'react';
import type { PurchaseOrder, PurchaseOrderItem } from '../types/purchase-order.types';
import { PO_STATUS_LABELS, PO_STATUS_COLORS } from '../types/purchase-order.types';
import { X, FileDown, Send, Pencil, Loader2, Paperclip, Trash2 } from 'lucide-react';

/**
 * Genera un Blob PDF desde el HTML de la OC usando html2pdf.js (client-side).
 * Retorna el Blob listo para enviar como FormData o descargar.
 */
async function generatePdfBlob(html: string): Promise<Blob> {
  // html2pdf.js mueve su contenedor a coords negativas ANTES de llamar html2canvas
  // → Chrome no pinta esa área → canvas en blanco.
  // Fix: usar onclone de html2canvas para reposicionar el contenedor en el
  // documento clonado (antes del pintado) a position:fixed top:0 left:0,
  // así Chrome lo pinta correctamente y html2pdf puede aplicar sus page-breaks.
  let html2pdf;
  try {
    const module = await import('html2pdf.js');
    html2pdf = module.default;
  } catch (error) {
    const err = error as Error;
    if (err.name === 'ChunkLoadError' || err.message.includes('Failed to load chunk')) {
      throw new Error('La plataforma ha sido actualizada. Por favor, recarga la página (F5 o Ctrl+R) e intenta nuevamente.');
    }
    throw err;
  }

  const container = document.createElement('div');
  container.innerHTML = html;
  document.body.appendChild(container);

  try {
    const blob: Blob = await html2pdf()
      .set({
        margin: [10, 10, 10, 10],
        filename: 'oc.pdf',
        image: { type: 'jpeg', quality: 0.95 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false,
          scrollX: 0,
          scrollY: 0,
          // onclone se ejecuta en el doc clonado, ANTES de que html2canvas pinte.
          // html2pdf habrá movido el container a coords negativas; aquí lo devolvemos
          // al viewport (0,0) para que Chrome lo renderice correctamente.
          onclone: (_clonedDoc: Document, element: HTMLElement) => {
            element.style.position = 'fixed';
            element.style.left = '0';
            element.style.top = '0';
          },
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['css', 'legacy'] },
      })
      .from(container)
      .outputPdf('blob');
    return blob;
  } finally {
    document.body.removeChild(container);
  }
}

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
  const ADMIN_CC = 'administrativo@fonneta.com';

  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [ccAdmin, setCcAdmin] = useState(true);
  const [ccCustom, setCcCustom] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Guard sincrónico contra doble-clic. setState es async y no protege en clicks rápidos consecutivos.
  const sendingRef = useRef(false);

  const items = po.items ?? [];

  const [downloading, setDownloading] = useState(false);

  const handleDownloadPDF = useCallback(async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      const html = buildPrintHTML(po, items);
      const blob = await generatePdfBlob(html);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `OC_${po.po_number}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error descargando PDF:', err);
    } finally {
      setDownloading(false);
    }
  }, [po, items, downloading]);

  const handleAddFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setAttachments((prev) => {
        const existingNames = new Set(prev.map((f) => f.name));
        return [...prev, ...newFiles.filter((f) => !existingNames.has(f.name))];
      });
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveFile = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    // Guard sincrónico: rechaza inmediatamente si ya hay un envío en curso.
    if (sendingRef.current) return;
    sendingRef.current = true;

    if (!po.recipient_email) {
      sendingRef.current = false;
      setSendError('No se ha especificado el email del destinatario');
      return;
    }

    // Validar el tamaño total de los adjuntos (Max 20MB para envíos de correo)
    const MAX_MB = 20;
    const totalSize = attachments.reduce((sum, file) => sum + file.size, 0);
    if (totalSize > MAX_MB * 1024 * 1024) {
      sendingRef.current = false;
      setSendError(`El tamaño total de los adjuntos excede los ${MAX_MB}MB permitidos por los servidores de correo.`);
      return;
    }

    setSending(true);
    setSendError(null);

    try {
      // 1. Generar el PDF en el navegador
      const html = buildPrintHTML(po, items);
      const pdfBlob = await generatePdfBlob(html);
      const pdfFile = new File([pdfBlob], `OC_${po.po_number}.pdf`, {
        type: 'application/pdf',
      });

      // 2. Enviar como FormData (siempre multipart, con PDF incluido)
      const formData = new FormData();
      formData.append('purchaseOrderId', po.id);
      formData.append('pdfFile', pdfFile);
      const finalCc = [ccAdmin ? ADMIN_CC : '', ccCustom.trim()].filter(Boolean).join(',');
      if (finalCc) formData.append('ccEmail', finalCc);
      attachments.forEach((file) => formData.append('attachments', file));

      const res = await fetch('/api/purchase-orders/send', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        if (res.status === 413) {
          throw new Error('Los archivos adjuntos son demasiado pesados para el servidor.');
        }

        let errorMsg = 'Error al enviar la orden de compra';
        try {
          const data = await res.json();
          errorMsg = data.error || errorMsg;
        } catch {
          const text = await res.text();
          if (text) errorMsg = text.substring(0, 100);
        }
        throw new Error(errorMsg);
      }

      onSent();
    } catch (err) {
      setSendError(err instanceof Error ? err.message : 'Error al enviar');
    } finally {
      setSending(false);
      sendingRef.current = false;
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
                <p className="text-xs text-gray-500">Carrera 6 #123A-74, Bogota D.C.</p>
                <p className="text-xs text-gray-500">Cel: 318 254 4377</p>
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
            <div className="col-span-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 mt-1">
              <span className="text-blue-700 font-semibold text-xs uppercase tracking-wider">Condiciones de pago: </span>
              <span className="font-semibold text-blue-900">30 días calendario</span>
              <span className="text-blue-700 text-xs ml-1">desde la radicación exitosa en Fonnetapp</span>
            </div>
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

        {/* Attachments + CC — for draft and enviada */}
        {(po.status === 'borrador' || po.status === 'enviada') && (
          <div className="mx-6 mb-2 space-y-3">
            {/* CC email */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={ccAdmin}
                  onChange={(e) => setCcAdmin(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">
                  Copiar a <span className="font-medium text-blue-700">{ADMIN_CC}</span>
                </span>
              </label>
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">CC adicional:</label>
                <input
                  type="email"
                  value={ccCustom}
                  onChange={(e) => setCcCustom(e.target.value)}
                  placeholder="otro@ejemplo.com (opcional)"
                  className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
                />
              </div>
            </div>

            {/* Attachments */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Paperclip className="w-4 h-4 text-gray-400" />
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Adjuntos adicionales</span>
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
              <p className="text-xs text-green-700 bg-green-50 rounded px-2 py-1 mb-2">
                El PDF de la OC se adjunta automaticamente. Aqui puedes agregar documentos adicionales (contratos, anexos, etc.).
              </p>
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
                <p className="text-xs text-gray-400">Sin documentos adicionales. Puedes agregar contratos, anexos u otros archivos.</p>
              )}
            </div>
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
              disabled={downloading}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
              {downloading ? 'Generando...' : 'Descargar PDF'}
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
      <td style="padding:6px 10px; border-bottom:1px solid #e5e7eb; text-align:center; color:#6b7280; font-size:12px;">${idx + 1}</td>
      <td style="padding:6px 10px; border-bottom:1px solid #e5e7eb; white-space:pre-wrap; font-size:12px;">${item.descripcion}</td>
      <td style="padding:6px 10px; border-bottom:1px solid #e5e7eb; text-align:right; font-family:monospace; font-weight:600; font-size:12px;">${fmt(item.precio)}</td>
    </tr>
  `).join('');

  const cell = (label: string, value: string) =>
    `<div style="display:flex; gap:4px; margin-bottom:3px; font-size:11.5px;">
       <span style="color:#6b7280; white-space:nowrap; min-width:90px;">${label}</span>
       <span style="font-weight:600; color:#111827;">${value}</span>
     </div>`;

  const recipientFields = [
    cell('Nombre:', po.recipient_name),
    po.recipient_nit ? cell('NIT:', po.recipient_nit) : '',
    po.recipient_address ? cell('Dirección:', po.recipient_address) : '',
    po.recipient_city ? cell('Ciudad:', po.recipient_city) : '',
    po.recipient_phone ? cell('Teléfono:', po.recipient_phone) : '',
    cell('Email:', po.recipient_email),
  ].filter(Boolean).join('');

  const detailFields = [
    po.authorized_by ? cell('Autorizado:', po.authorized_by) : '',
    po.cost_center ? cell('C. costo:', po.cost_center) : '',
    po.project_name ? cell('Proyecto:', po.project_name) : '',
    po.transport ? cell('Transporte:', po.transport) : '',
    `<div style="margin-top:4px; padding:4px 6px; background:#eff6ff; border-radius:4px; font-size:11px;">
       <span style="color:#1d4ed8; font-weight:700;">Forma de pago:</span>
       <span style="color:#1e40af; font-weight:600;"> 30 días calendario desde radicación en Fonnetapp</span>
     </div>`,
  ].filter(Boolean).join('');

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Orden de Compra ${po.po_number}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; color: #111827; background: #fff; }
    .page { max-width: 800px; margin: 0 auto; padding: 32px 36px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; padding-bottom: 14px; border-bottom: 3px solid #1d4ed8; }
    .company-name { font-size: 17px; font-weight: 900; color: #1d4ed8; }
    .company-info { font-size: 10px; color: #6b7280; margin-top: 2px; }
    .po-title { font-size: 16px; font-weight: 700; color: #111827; }
    .po-number { font-size: 13px; color: #1d4ed8; font-weight: 600; }
    .section-title { font-size: 9.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.07em; color: #9ca3af; margin-bottom: 5px; padding-bottom: 3px; border-bottom: 1px solid #e5e7eb; }
    table.items { width: 100%; border-collapse: collapse; }
    table.items thead tr { background: #f3f4f6; }
    table.items thead th { padding: 7px 10px; text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; font-weight: 700; }
    table.items thead th:first-child { text-align: center; width: 36px; }
    table.items thead th:last-child { text-align: right; }
    .totals { display: flex; justify-content: flex-end; margin-top: 12px; }
    .totals-box { width: 240px; }
    .totals-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 12px; color: #6b7280; }
    .totals-row.total { border-top: 2px solid #1d4ed8; margin-top: 5px; padding-top: 8px; font-size: 15px; font-weight: 700; color: #111827; }
    .totals-row.total span:last-child { color: #16a34a; }
    .footer { margin-top: 28px; padding-top: 12px; border-top: 1px solid #e5e7eb; text-align: center; color: #9ca3af; font-size: 10px; }
    @media print {
      body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
      .page { padding: 20px; }
    }
  </style>
</head>
<body>
  <div class="page">
    <!-- Header -->
    <div class="header">
      <div style="display:flex; align-items:flex-start; gap:10px;">
        <img src="${FONNETA_LOGO_B64}" alt="Fonneta" style="width:36px; height:auto; margin-top:2px;" />
        <div>
          <div class="company-name">FONNETA COMUNICACIONES S.A.S.</div>
          <div class="company-info">NIT 901.362.051-7</div>
          <div class="company-info">Carrera 6 #123A-74, Bogota D.C. &nbsp;·&nbsp; Cel: 318 254 4377</div>
        </div>
      </div>
      <div style="text-align:right;">
        <div class="po-title">ORDEN DE COMPRA</div>
        <div class="po-number">No. ${po.po_number}</div>
        <div style="font-size:10.5px; color:#6b7280; margin-top:3px;">Fecha: ${date}</div>
      </div>
    </div>

    <!-- Emitido Para + Detalles en dos columnas -->
    <div style="display:flex; gap:20px; margin-bottom:10px;">
      <div style="flex:1; background:#f9fafb; border:1px solid #e5e7eb; border-radius:6px; padding:10px 12px;">
        <div class="section-title">Emitido Para</div>
        ${recipientFields}
      </div>
      <div style="flex:1; background:#f9fafb; border:1px solid #e5e7eb; border-radius:6px; padding:10px 12px;">
        <div class="section-title">Detalles</div>
        ${detailFields}
      </div>
    </div>

    ${po.description ? `
    <div style="margin-bottom:10px; padding:8px 12px; background:#f8faff; border-left:3px solid #1d4ed8; border-radius:0 4px 4px 0;">
      <div style="font-size:9.5px; font-weight:800; text-transform:uppercase; letter-spacing:0.07em; color:#9ca3af; margin-bottom:4px;">Descripción</div>
      <p style="font-size:10.5px; color:#374151; line-height:1.55;">${po.description}</p>
    </div>
    ` : ''}

    <div style="margin-bottom:6px;">
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

  <!-- Página 2: Términos y Condiciones + Instrucciones de Facturación -->
  <div class="page" style="page-break-before: always; font-size:9px; line-height:1.5; color:#111827;">
    <div style="text-align:center; margin-bottom:10px; padding-bottom:8px; border-bottom:2px solid #1d4ed8;">
      <div style="font-size:11px; font-weight:800; color:#1d4ed8; text-transform:uppercase; letter-spacing:0.06em;">Términos y Condiciones Generales — Orden de Compra</div>
      <div style="font-size:9px; color:#6b7280; margin-top:2px;">Fonneta Comunicaciones S.A.S. &middot; NIT 901.362.051-7</div>
    </div>
    <p style="margin-bottom:6px; color:#374151;">Las presentes Condiciones Generales serán aplicables a todas las Órdenes de Compra expedidas por <strong>Fonneta Comunicaciones S.A.S.</strong></p>

    <div style="column-count:2; column-gap:16px; column-rule:1px solid #e5e7eb;">
      <p style="margin:0 0 4px;"><strong style="color:#1d4ed8;">1. Definiciones.</strong> (i) <em>La Compañía:</em> Fonneta Comunicaciones S.A.S., persona jurídica contratante. (ii) <em>Proveedor:</em> persona natural o jurídica identificada como tal en la Orden de Compra. (iii) <em>Bienes:</em> elementos a adquirir según lo descrito en la OC y aceptado por la Compañía. (iv) <em>Servicios:</em> prestación a cargo del Proveedor según lo descrito en la OC y aceptado por la Compañía. (v) <em>Orden de Compra:</em> documento suscrito por representante autorizado de la Compañía, al cual se incorporan estas Condiciones Generales y la oferta del Proveedor.</p>

      <p style="margin:0 0 4px;"><strong style="color:#1d4ed8;">2. Entrega de Bienes o Servicios.</strong> El Proveedor deberá entregar o prestar los Bienes o Servicios en las condiciones y especificaciones técnicas establecidas en la Orden de Compra, siendo de obligatorio cumplimiento al momento de su aceptación.</p>

      <p style="margin:0 0 4px;"><strong style="color:#1d4ed8;">3. Precio y forma de pago.</strong> El valor es el expresamente establecido en la OC. La Compañía aplicará las retenciones o deducciones de ley. El pago está sujeto a la correcta y oportuna presentación de las facturas debidamente aprobadas por el representante de la Compañía.</p>

      <p style="margin:0 0 4px;"><strong style="color:#1d4ed8;">4. Proveedor independiente.</strong> El Proveedor obra como contratista independiente, no como empleado, agente o representante de la Compañía. Actuará con plena autonomía profesional, técnica y administrativa.</p>

      <p style="margin:0 0 4px;"><strong style="color:#1d4ed8;">5. Cesión y subcontratación.</strong> El Proveedor no podrá ceder ni subcontratar total o parcialmente la ejecución de la OC sin autorización previa y escrita de la Compañía.</p>

      <p style="margin:0 0 4px;"><strong style="color:#1d4ed8;">6. Propiedad intelectual.</strong> Todos los derechos patrimoniales de autor, imagen o conexos derivados de obras, fonogramas, videogramas o transmisiones elaboradas en cumplimiento de esta OC (EL MATERIAL) son transferidos a la Compañía desde su creación. La Compañía tendrá derechos exclusivos de reproducción, distribución, transformación, comunicación pública, licenciamiento e importación/exportación a nivel mundial y por toda la vigencia de la protección. El Proveedor garantiza que posee todas las autorizaciones necesarias sobre obras preexistentes o propiedad industrial que incorpore, manteniendo a la Compañía indemne frente a cualquier reclamación de terceros.</p>

      <p style="margin:0 0 4px;"><strong style="color:#1d4ed8;">7. Terminación.</strong> La OC termina por vencimiento del término o cumplimiento de su objeto. La Compañía podrá terminarla unilateralmente con 15 días de preaviso escrito, o de manera inmediata si el Proveedor: (a) suministra datos falsos; (b) es objeto de condena o investigación penal; (c) incurre en insolvencia; (d) incumple las obligaciones de la OC o la ley; (e) realiza actos ilícitos que afecten el buen nombre de la Compañía.</p>

      <p style="margin:0 0 4px;"><strong style="color:#1d4ed8;">8. Indemnidad.</strong> Los daños causados por el Proveedor, su personal o subcontratistas a terceros o a la Compañía serán reconocidos y pagados por el Proveedor. Este se obliga a resarcir, defender y amparar a la Compañía de cualquier responsabilidad derivada de la OC, autorizando la retención de pagos pendientes para cubrir dichos valores.</p>

      <p style="margin:0 0 4px;"><strong style="color:#1d4ed8;">9. Obligaciones del Proveedor.</strong> El Proveedor se compromete a: (a) Cumplir oportuna y eficientemente el objeto contratado. (b) Garantizar el cumplimiento de la normativa vigente. (c) Responder por fallas, faltantes y daños derivados de la prestación del servicio. (d) Asumir la defensa legal y costas en procesos judiciales originados en la ejecución de la OC. (e) Habeas data: autoriza a Fonneta Comunicaciones S.A.S. para consultar y reportar información en bases de datos de riesgo financiero, crediticio, LAFT y tratamiento de datos personales conforme a la política de la Compañía. (f) Declara bajo la gravedad de juramento que los recursos vinculados a esta OC son de origen lícito y no están relacionados con lavado de activos.</p>

      <p style="margin:0 0 4px;"><strong style="color:#1d4ed8;">10. Confidencialidad.</strong> Toda información técnica, jurídica, financiera, comercial o estratégica de la Compañía y sus clientes que el Proveedor conozca en virtud de esta OC es confidencial. No podrá ser revelada a terceros ni usada para fines distintos a la ejecución de la OC, salvo orden de autoridad competente.</p>

      <p style="margin:0 0 4px;"><strong style="color:#1d4ed8;">11. Actividad lícita y anticorrupción.</strong> El Proveedor declara que ni él ni sus socios, representantes o vinculados tienen relación con actividades prohibidas o delictivas. Conoce y adhiere al programa de transparencia y ética empresarial (PTEE) de la Compañía y a la política para la gestión del riesgo de corrupción, soborno, fraude y extorsión.</p>

      <p style="margin:0 0 4px;"><strong style="color:#1d4ed8;">12. Territorio.</strong> El único territorio y jurisdicción aplicable a esta OC es la ciudad de Bogotá D.C., Colombia. El Proveedor renuncia a cualquier otro fuero determinado por factor de territorio.</p>

      <p style="margin:0 0 4px;"><strong style="color:#1d4ed8;">13. Notificaciones.</strong> (a) Línea ética y denuncias: <strong>administrativo@fonneta.com</strong> (canal con garantía de reserva). (b) Asuntos legales: <strong>administrativo@fonneta.com</strong>.</p>

      <p style="margin:0 0 4px;"><strong style="color:#1d4ed8;">14. Legalidad de herramientas, licencias y software.</strong> El Proveedor declara bajo la gravedad de juramento, en los términos del artículo 95 del Código de Procedimiento Civil y las Leyes 23 de 1982, 44 de 1993 y 603 de 2000, que la totalidad de herramientas, aplicaciones, plataformas, licencias y software utilizados para la prestación de los servicios objeto de la presente Orden de Compra han sido adquiridos, instalados y utilizados en estricto cumplimiento de la legislación colombiana vigente y de la Decisión Andina 351 de 1993. En consecuencia, el Proveedor se obliga a: (a) Acreditar, cuando La Compañía lo solicite y en el plazo que esta señale, los certificados de licenciamiento, contratos de uso o cualquier documentación que soporte la legalidad de las herramientas empleadas. (b) Responder de manera exclusiva y directa por cualquier reclamación, sanción, multa, proceso penal o perjuicio derivado del uso de software sin licencia, herramientas pirateadas o cuya utilización infrinja derechos de propiedad intelectual o industrial de terceros, incluyendo el pago de costas judiciales y honorarios de abogados. (c) Mantener indemne a La Compañía frente a toda acción judicial, administrativa o extrajudicial originada en el incumplimiento de esta obligación. El incumplimiento comprobado de la presente cláusula faculta a La Compañía para terminar de manera inmediata la Orden de Compra, sin perjuicio de las acciones civiles y penales a que haya lugar conforme al Código Penal colombiano (Ley 599 de 2000, art. 271 y ss.) y demás normas concordantes.</p>
    </div>

    <div style="margin-top:10px; padding-top:8px; border-top:2px solid #1d4ed8;">
      <div style="font-size:10px; font-weight:800; color:#1d4ed8; text-transform:uppercase; letter-spacing:0.05em; margin-bottom:6px;">Instrucciones de Facturación y Radicación</div>
      <div style="column-count:2; column-gap:16px;">
        <div>
          <p style="margin:0 0 3px;"><strong>Datos de facturación:</strong> Todo documento debe ser emitido a nombre de <strong>FONNETA COMUNICACIONES SAS</strong>, NIT <strong>901.362.051-7</strong>.</p>
          <p style="margin:0 0 3px;"><strong>Requisitos del documento (Factura o Cuenta de Cobro):</strong> Debe incluir número de OC, descripción del servicio, valor total en números y letras, información bancaria completa y firma del emisor.</p>
          <p style="margin:0;"><strong>Documentación soporte:</strong> Certificado de aportes a seguridad social del mes del servicio. Release firmado si fue solicitado.</p>
        </div>
        <div>
          <p style="margin:0 0 3px;"><strong>Canal único de radicación:</strong> Exclusivamente a través de <strong>Fonnettapp</strong>. No se aceptan documentos por otros medios ni con información incompleta.</p>
          <p style="margin:0 0 3px;"><strong>Condiciones de pago:</strong> 30 días calendario desde la radicación exitosa en la plataforma.</p>
          <p style="margin:0;"><strong>Contacto:</strong> <span style="color:#1d4ed8;">administrativo@fonneta.com</span></p>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
}
