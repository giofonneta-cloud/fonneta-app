'use client';

import { useState, useRef, useCallback } from 'react';
import type { Quote, QuoteItem } from '../types/quote.types';
import { QUOTE_STATUS_LABELS, QUOTE_STATUS_COLORS, DOCUMENT_TYPE_SHORT_LABELS } from '../types/quote.types';
import { X, FileDown, Send, Pencil, Loader2, Paperclip, Trash2 } from 'lucide-react';
import { generatePdfBlob } from '@/shared/lib/pdf/generatePdfBlob';
import { FONNETA_LOGO_B64 } from '@/shared/lib/pdf/fonnetaLogoBase64';

interface QuotePreviewProps {
  quote: Quote;
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

export function QuotePreview({ quote, onClose, onEdit, onSent }: QuotePreviewProps) {
  const ADMIN_CC = 'administrativo@fonneta.com';

  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [ccAdmin, setCcAdmin] = useState(true);
  const [ccCustom, setCcCustom] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sendingRef = useRef(false);

  const items = quote.items ?? [];
  const hasDiscount = items.some((item) => item.descuento_porcentaje > 0);
  const isOrdenProduccion = quote.document_type === 'orden_produccion';
  const docLabel = DOCUMENT_TYPE_SHORT_LABELS[quote.document_type];
  const fileBaseName = isOrdenProduccion ? 'OrdenProduccion' : 'Cotizacion';
  const [downloading, setDownloading] = useState(false);

  const handleDownloadPDF = useCallback(async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      const html = buildQuotePrintHTML(quote, items);
      const blob = await generatePdfBlob(html);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${fileBaseName}_${quote.quote_number}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error descargando PDF:', err);
    } finally {
      setDownloading(false);
    }
  }, [quote, items, downloading]);

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
    if (sendingRef.current) return;
    sendingRef.current = true;

    if (!quote.client_email) {
      sendingRef.current = false;
      setSendError('No se ha especificado el email del cliente');
      return;
    }

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
      const html = buildQuotePrintHTML(quote, items);
      const pdfBlob = await generatePdfBlob(html);
      const pdfFile = new File([pdfBlob], `${fileBaseName}_${quote.quote_number}.pdf`, { type: 'application/pdf' });

      const formData = new FormData();
      formData.append('quoteId', quote.id);
      formData.append('pdfFile', pdfFile);
      const finalCc = [ccAdmin ? ADMIN_CC : '', ccCustom.trim()].filter(Boolean).join(',');
      if (finalCc) formData.append('ccEmail', finalCc);
      attachments.forEach((file) => formData.append('attachments', file));

      const res = await fetch('/api/quotes/send', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        if (res.status === 413) {
          throw new Error('Los archivos adjuntos son demasiado pesados para el servidor.');
        }
        if (res.status === 403) {
          throw new Error('No tienes permiso para enviar cotizaciones.');
        }

        let errorMsg = 'Error al enviar la cotización';
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
            <h3 className="text-lg font-semibold text-gray-900">{docLabel} {quote.quote_number}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${QUOTE_STATUS_COLORS[quote.status]}`}>
                {QUOTE_STATUS_LABELS[quote.status]}
              </span>
              {isOrdenProduccion && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-700">
                  Compromiso de Compra
                </span>
              )}
              <span className="text-sm text-gray-500">{formatDate(quote.created_at)}</span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          <div className="flex justify-between items-start pb-4 border-b-2 border-black">
            <div className="flex items-start gap-3">
              <img src="/logo.png" alt="Fonneta" className="w-10 h-auto mt-0.5" />
              <div>
                <h2 className="text-xl font-black text-gray-900">FONNETA COMUNICACIONES S.A.S.</h2>
                <p className="text-xs text-gray-500 mt-1">NIT 901.362.051-7</p>
                <p className="text-xs text-gray-500">Carrera 6 #123A-74, Bogota D.C.</p>
                <p className="text-xs text-gray-500">Cel: +57 311 2487439</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-gray-900">{isOrdenProduccion ? 'ORDEN DE PRODUCCIÓN' : 'PROPUESTA COMERCIAL'}</p>
              <p className="text-gray-900 font-semibold">No. {quote.quote_number}</p>
              <p className="text-xs text-gray-500 mt-1">Fecha: {formatDate(quote.created_at)}</p>
              {quote.valid_until && <p className="text-xs text-gray-500">Válida hasta: {formatDate(quote.valid_until)}</p>}
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 space-y-2">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Dirigido a</p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {quote.client_contact_name && (
                <div>
                  <span className="text-gray-500">Contacto: </span>
                  <span className="font-medium text-gray-900">{quote.client_contact_name}</span>
                </div>
              )}
              <div>
                <span className="text-gray-500">Nombre: </span>
                <span className="font-medium text-gray-900">{quote.client_name}</span>
              </div>
              {quote.client_nit && (
                <div>
                  <span className="text-gray-500">NIT: </span>
                  <span className="font-medium text-gray-900">{quote.client_nit}</span>
                </div>
              )}
              {quote.client_city && (
                <div>
                  <span className="text-gray-500">Ciudad: </span>
                  <span className="font-medium text-gray-900">{quote.client_city}</span>
                </div>
              )}
              <div>
                <span className="text-gray-500">Email: </span>
                <span className="font-medium text-gray-900">{quote.client_email}</span>
              </div>
            </div>
          </div>

          {quote.intro_text && <p className="text-sm text-gray-700">{quote.intro_text}</p>}

          {/* Items table */}
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-900">
                  <th className="text-left px-3 py-2.5 text-xs font-bold text-white uppercase tracking-wider w-8">#</th>
                  <th className="text-left px-3 py-2.5 text-xs font-bold text-white uppercase tracking-wider">Descripción</th>
                  <th className="text-right px-3 py-2.5 text-xs font-bold text-white uppercase tracking-wider w-16">Cant.</th>
                  <th className="text-right px-3 py-2.5 text-xs font-bold text-white uppercase tracking-wider w-28">Precio Unit.</th>
                  {hasDiscount && <th className="text-right px-3 py-2.5 text-xs font-bold text-white uppercase tracking-wider w-16">Dto%</th>}
                  <th className="text-right px-3 py-2.5 text-xs font-bold text-white uppercase tracking-wider w-28">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-3 py-3 text-gray-500">{idx + 1}</td>
                    <td className="px-3 py-3 text-gray-900 whitespace-pre-wrap">{item.descripcion}</td>
                    <td className="px-3 py-3 text-right font-mono text-gray-700">{item.cantidad}</td>
                    <td className="px-3 py-3 text-right font-mono text-gray-700">{formatCurrency(item.precio_unitario)}</td>
                    {hasDiscount && <td className="px-3 py-3 text-right font-mono text-gray-700">{item.descuento_porcentaje > 0 ? `${item.descuento_porcentaje}%` : '—'}</td>}
                    <td className="px-3 py-3 text-right font-mono font-medium text-gray-900">{formatCurrency(item.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-72 space-y-2 bg-gray-100 rounded-lg p-3.5">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Subtotal</span>
                <span className="font-mono">{formatCurrency(quote.subtotal)}</span>
              </div>
              {quote.iva_porcentaje > 0 && (
                <div className="flex justify-between text-sm text-gray-600">
                  <span>IVA ({quote.iva_porcentaje}%)</span>
                  <span className="font-mono">{formatCurrency(quote.iva_valor)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold text-gray-900 pt-2 border-t-2 border-black">
                <span>TOTAL</span>
                <span className="font-mono text-gray-900">{formatCurrency(quote.total)}</span>
              </div>
            </div>
          </div>

          {quote.closing_text && <p className="text-sm text-gray-700">{quote.closing_text}</p>}

          {isOrdenProduccion && (
            <div className="border-2 border-orange-200 bg-orange-50 rounded-xl p-4 space-y-4">
              <div>
                <p className="text-xs font-bold text-orange-700 uppercase tracking-wider mb-1">Compromiso de Compra</p>
                <p className="text-sm text-orange-900">
                  Este documento formaliza un compromiso de compra entre las partes, previo a la generación de la factura o cuenta de cobro correspondiente. Al confirmar por escrito la aceptación de este documento, el cliente autoriza a Fonneta Comunicaciones S.A.S. a dar inicio al proceso de producción y ejecución de los servicios aquí descritos, bajo los términos, cantidades y valores establecidos.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-6 pt-3 border-t border-orange-200 text-sm text-orange-900">
                <div>
                  <p className="font-semibold">Aceptación del cliente</p>
                  <p className="mt-4 border-t border-orange-300 pt-1 text-xs text-orange-500">Nombre y firma</p>
                </div>
                <div>
                  <p className="font-semibold">Fecha</p>
                  <p className="mt-4 border-t border-orange-300 pt-1 text-xs text-orange-500">DD/MM/AAAA</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Attachments + CC */}
        {(quote.status === 'borrador' || quote.status === 'enviada') && (
          <div className="mx-6 mb-2 space-y-3">
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={ccAdmin}
                  onChange={(e) => setCcAdmin(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-500"
                />
                <span className="text-sm text-gray-700">
                  Copiar a <span className="font-medium text-gray-900">{ADMIN_CC}</span>
                </span>
              </label>
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">CC adicional:</label>
                <input
                  type="email"
                  value={ccCustom}
                  onChange={(e) => setCcCustom(e.target.value)}
                  placeholder="otro@ejemplo.com (opcional)"
                  className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent placeholder-gray-400"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <Paperclip className="w-4 h-4 text-gray-400" />
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Adjuntos adicionales</span>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="ml-auto text-xs text-gray-700 hover:text-gray-900 font-medium"
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
                El PDF de la cotización se adjunta automáticamente. Aquí puedes agregar anexos (brochures, mockups, etc.).
              </p>
              {attachments.length > 0 ? (
                <div className="space-y-1">
                  {attachments.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-1.5 text-xs">
                      <span className="text-gray-700 truncate max-w-[300px]">{file.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">{(file.size / 1024).toFixed(0)} KB</span>
                        <button onClick={() => handleRemoveFile(idx)} className="p-0.5 text-gray-400 hover:text-red-500 transition-colors">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400">Sin documentos adicionales.</p>
              )}
            </div>
          </div>
        )}

        {sendError && (
          <div className="mx-6 mb-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-2 text-sm">{sendError}</div>
        )}

        {/* Footer actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors">
            Cerrar
          </button>
          <div className="flex gap-3">
            {(quote.status === 'borrador' || quote.status === 'enviada') && (
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
            {(quote.status === 'borrador' || quote.status === 'enviada') && (
              <button
                onClick={handleSend}
                disabled={sending}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-black transition-colors disabled:opacity-50"
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {sending ? 'Enviando...' : quote.status === 'enviada' ? 'Reenviar al cliente' : 'Enviar al cliente'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── PDF Print HTML Builder ───────────────────────────────────────────────────

function buildQuotePrintHTML(quote: Quote, items: QuoteItem[]): string {
  const date = formatDate(quote.created_at);
  const fmt = (n: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);
  const hasDiscount = items.some((item) => item.descuento_porcentaje > 0);
  const discountCell = (item: QuoteItem) =>
    hasDiscount
      ? `<td style="padding:6px 8px; border-bottom:1px solid #e5e7eb; text-align:right; font-size:11px;">${item.descuento_porcentaje > 0 ? `${item.descuento_porcentaje}%` : '—'}</td>`
      : '';

  const rows = items.map((item, idx) => `
    <tr>
      <td style="padding:6px 8px; border-bottom:1px solid #e5e7eb; text-align:center; color:#6b7280; font-size:11px;">${idx + 1}</td>
      <td style="padding:6px 8px; border-bottom:1px solid #e5e7eb; white-space:pre-wrap; font-size:11px;">${item.descripcion}</td>
      <td style="padding:6px 8px; border-bottom:1px solid #e5e7eb; text-align:right; font-size:11px;">${item.cantidad}</td>
      <td style="padding:6px 8px; border-bottom:1px solid #e5e7eb; text-align:right; font-family:monospace; font-size:11px;">${fmt(item.precio_unitario)}</td>
      ${discountCell(item)}
      <td style="padding:6px 8px; border-bottom:1px solid #e5e7eb; text-align:right; font-family:monospace; font-weight:600; font-size:11px;">${fmt(item.subtotal)}</td>
    </tr>
  `).join('');

  const contactLine = quote.client_contact_name ? `${quote.client_contact_name}<br>` : '';
  const cityLine = quote.client_city ? `, ${quote.client_city}` : '';
  const isOrdenProduccion = quote.document_type === 'orden_produccion';
  const docTitle = isOrdenProduccion ? 'ORDEN DE PRODUCCIÓN' : 'PROPUESTA COMERCIAL';

  const commitmentBlock = isOrdenProduccion ? `
    <div class="commitment-box">
      <div class="section-title" style="color:#c2410c;">Compromiso de Compra</div>
      <p style="font-size:11px; color:#7c2d12; line-height:1.6;">
        Este documento formaliza un compromiso de compra entre las partes, previo a la generación de la factura o cuenta de cobro correspondiente. Al confirmar por escrito la aceptación de este documento, el cliente autoriza a Fonneta Comunicaciones S.A.S. a dar inicio al proceso de producción y ejecución de los servicios aquí descritos, bajo los términos, cantidades y valores establecidos.
      </p>
      <div style="display:flex; gap:32px; margin-top:16px; padding-top:10px; border-top:1px solid #fed7aa;">
        <div style="flex:1;">
          <div style="font-size:10.5px; font-weight:700; color:#7c2d12;">Aceptación del cliente</div>
          <div style="margin-top:20px; border-top:1px solid #fdba74; padding-top:3px; font-size:9px; color:#c2703f;">Nombre y firma</div>
        </div>
        <div style="flex:1;">
          <div style="font-size:10.5px; font-weight:700; color:#7c2d12;">Fecha</div>
          <div style="margin-top:20px; border-top:1px solid #fdba74; padding-top:3px; font-size:9px; color:#c2703f;">DD/MM/AAAA</div>
        </div>
      </div>
    </div>
  ` : '';

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>${docTitle} ${quote.quote_number}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; color: #111827; background: #fff; }
    .page { max-width: 800px; margin: 0 auto; padding: 32px 36px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; padding-bottom: 14px; border-bottom: 3px solid #000; }
    .company-name { font-size: 17px; font-weight: 900; color: #000; }
    .company-info { font-size: 10px; color: #4b5563; margin-top: 2px; }
    .quote-title { font-size: 16px; font-weight: 700; color: #111827; }
    .quote-number { font-size: 13px; color: #111827; font-weight: 600; }
    .section-title { font-size: 9.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.07em; color: #6b7280; margin-bottom: 5px; }
    table.items { width: 100%; border-collapse: collapse; }
    table.items thead tr { background: #111827; }
    table.items thead th { padding: 7px 8px; text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: #fff; font-weight: 700; }
    table.items thead th:first-child { text-align: center; width: 30px; }
    table.items thead th:not(:first-child):not(:nth-child(2)) { text-align: right; }
    .totals { display: flex; justify-content: flex-end; margin-top: 12px; }
    .totals-box { width: 260px; background: #f3f4f6; border-radius: 6px; padding: 10px 14px; }
    .totals-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 12px; color: #4b5563; }
    .totals-row.total { border-top: 2px solid #111827; margin-top: 5px; padding-top: 8px; font-size: 15px; font-weight: 700; color: #111827; }
    .totals-row.total span:last-child { color: #111827; }
    .brand-row { margin-top: 18px; text-align: center; }
    .brand-pill { display: inline-block; padding: 4px 14px; margin: 0 4px; border: 1.5px solid #111827; border-radius: 3px; font-weight: 900; font-size: 11px; letter-spacing: 0.05em; }
    .footer { margin-top: 22px; padding: 12px 20px; background: #111827; color: #d1d5db; text-align: center; font-size: 9.5px; }
    .footer strong { color: #fff; }
    .commitment-box { margin-top: 18px; padding: 14px 16px; background: #fff7ed; border: 1.5px solid #fed7aa; border-radius: 8px; }
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
          <div class="company-info">Carrera 6 #123A-74, Bogota D.C. &nbsp;·&nbsp; Cel: +57 311 2487439</div>
        </div>
      </div>
      <div style="text-align:right;">
        <div class="quote-title">${docTitle}</div>
        <div class="quote-number">No. ${quote.quote_number}</div>
        <div style="font-size:10.5px; color:#6b7280; margin-top:3px;">Fecha: ${date}</div>
        ${quote.valid_until ? `<div style="font-size:10.5px; color:#6b7280;">Válida hasta: ${formatDate(quote.valid_until)}</div>` : ''}
      </div>
    </div>

    <!-- Destinatario -->
    <div style="margin-bottom:14px;">
      <p style="font-size:12px;">Señor(a)</p>
      <p style="font-size:13.5px; font-weight:700; margin-top:2px;">${contactLine}${quote.client_name}${cityLine}</p>
    </div>

    ${quote.intro_text ? `
    <p style="font-size:11.5px; color:#374151; line-height:1.6; margin-bottom:14px;">${quote.intro_text}</p>
    ` : ''}

    <div style="margin-bottom:6px;">
      <table class="items">
        <thead>
          <tr>
            <th>#</th>
            <th>Detalle</th>
            <th>Cant.</th>
            <th>Precio Unit.</th>
            ${hasDiscount ? '<th>Dto%</th>' : ''}
            <th>Subtotal</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>

      <div class="totals">
        <div class="totals-box">
          <div class="totals-row">
            <span>Subtotal</span>
            <span style="font-family:monospace">${fmt(quote.subtotal)}</span>
          </div>
          ${quote.iva_porcentaje > 0 ? `
          <div class="totals-row">
            <span>IVA (${quote.iva_porcentaje}%)</span>
            <span style="font-family:monospace">${fmt(quote.iva_valor)}</span>
          </div>
          ` : ''}
          <div class="totals-row total">
            <span>TOTAL</span>
            <span style="font-family:monospace">${fmt(quote.total)}</span>
          </div>
        </div>
      </div>
    </div>

    ${quote.closing_text ? `
    <p style="font-size:11.5px; color:#374151; line-height:1.6; margin-top:16px;">${quote.closing_text}</p>
    ` : ''}

    ${commitmentBlock}

    <div style="margin-top:22px; font-size:12px;">
      <p>Atentamente,</p>
      <p style="font-weight:700; margin-top:14px;">Equipo Comercial</p>
      <p style="font-weight:700;">Fonneta Comunicaciones S.A.S.</p>
    </div>

    ${quote.cost_center ? `
    <div class="brand-row">
      <span class="brand-pill">${quote.cost_center}</span>
    </div>
    ` : ''}

    <div class="footer">
      <strong>Documento confidencial</strong> &middot; Uso interno y de archivo comercial<br>
      administrativo@fonneta.com &middot; Carrera 6 #123A-74, Bogota D.C. &middot; +57 311 2487439
    </div>
  </div>
</body>
</html>`;
}
