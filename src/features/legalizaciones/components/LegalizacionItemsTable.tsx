'use client';

import { Fragment } from 'react';
import { Check, MessageSquareWarning, Paperclip } from 'lucide-react';
import type { LegalizacionItem } from '../types/legalizacion.types';
import { formatCOP, formatDate, INPUT_CLASS } from './legalizacionFormat';

interface Props {
  items: LegalizacionItem[];
  // El aprobador decide línea por línea mientras revisa.
  reviewing: boolean;
  aprobadas: Record<string, boolean>;
  observaciones: Record<string, string>;
  onToggleApproval: (itemId: string) => void;
  onToggleObservation: (itemId: string) => void;
  onObservationChange: (itemId: string, text: string) => void;
  // Muestra el estado y las observaciones guardadas de una revisión anterior.
  showSavedReview: boolean;
}

const BASE_HEADERS = ['Fecha', 'Categoría', 'Establecimiento', 'N° soporte', 'Descripción', 'Valor', 'Soporte'];

const BADGE_APPROVED = 'inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-md bg-emerald-50 text-emerald-700';

export function LegalizacionItemsTable({
  items,
  reviewing,
  aprobadas,
  observaciones,
  onToggleApproval,
  onToggleObservation,
  onObservationChange,
  showSavedReview,
}: Props) {
  const hasApprovedLines = items.some((item) => item.revision_estado === 'aprobada');
  const showReviewColumn = reviewing || (showSavedReview && hasApprovedLines);
  const columns = BASE_HEADERS.length + (showReviewColumn ? 1 : 0);

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[820px] text-sm">
        <thead>
          <tr className="text-left text-xs font-bold text-slate-400 border-b border-slate-100">
            {BASE_HEADERS.map((header) => (
              <th key={header} className={`py-2 pr-3 ${header === 'Valor' ? 'text-right' : ''}`}>{header}</th>
            ))}
            {showReviewColumn && <th className="py-2">Revisión</th>}
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const alreadyApproved = item.revision_estado === 'aprobada';
            const approvedNow = !!aprobadas[item.id];
            const flagged = item.id in observaciones;
            const saved = showSavedReview && !alreadyApproved ? item.observacion_revisor : null;
            const tint = flagged || (saved && !reviewing) ? 'bg-red-50/60' : '';

            return (
              <Fragment key={item.id}>
                <tr className={`border-b border-slate-50 ${tint}`}>
                  <td className="py-2 pr-3 text-slate-500 whitespace-nowrap">{formatDate(item.fecha)}</td>
                  <td className="py-2 pr-3 text-slate-700">{item.categoria_etiqueta || item.categoria || '—'}</td>
                  <td className="py-2 pr-3 text-slate-700">
                    {item.establecimiento || '—'}
                    {item.establecimiento_nit && <span className="block text-xs text-slate-400 mt-0.5">NIT {item.establecimiento_nit}</span>}
                  </td>
                  <td className="py-2 pr-3 text-slate-700">{item.numero_soporte || '—'}</td>
                  <td className="py-2 pr-3 text-slate-500">
                    {item.descripcion || '—'}
                    {item.comentario && <span className="block text-xs italic text-slate-400 mt-0.5">{item.comentario}</span>}
                  </td>
                  <td className="py-2 pr-3 text-right font-semibold text-slate-800 whitespace-nowrap">{formatCOP(item.valor)}</td>
                  <td className="py-2 pr-3">
                    {item.soporte_url?.startsWith('https://') ? (
                      <a href={item.soporte_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-blue-600 hover:underline">
                        <Paperclip className="w-3.5 h-3.5" />
                        Ver
                      </a>
                    ) : <span className="text-red-500 text-xs font-semibold">Falta</span>}
                  </td>
                  {showReviewColumn && (
                    <td className="py-2">
                      {alreadyApproved ? (
                        <span className={BADGE_APPROVED}><Check className="w-3.5 h-3.5" />Aprobada</span>
                      ) : reviewing ? (
                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            onClick={() => onToggleApproval(item.id)}
                            className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-md border transition-colors ${
                              approvedNow
                                ? 'bg-emerald-600 border-emerald-600 text-white hover:bg-emerald-700'
                                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            <Check className="w-3.5 h-3.5" />
                            {approvedNow ? 'Aprobada' : 'Aprobar'}
                          </button>
                          <button
                            type="button"
                            onClick={() => onToggleObservation(item.id)}
                            className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-md border transition-colors ${
                              flagged
                                ? 'bg-red-600 border-red-600 text-white hover:bg-red-700'
                                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            <MessageSquareWarning className="w-3.5 h-3.5" />
                            {flagged ? 'Quitar' : 'Observar'}
                          </button>
                        </div>
                      ) : null}
                    </td>
                  )}
                </tr>
                {flagged && (
                  <tr className="bg-red-50/60 border-b border-red-100">
                    <td colSpan={columns} className="px-0 pb-3 pt-1">
                      <input
                        type="text"
                        autoFocus
                        aria-label="Observación de la línea"
                        placeholder="¿Qué debe corregir o aclarar en esta línea?"
                        value={observaciones[item.id]}
                        onChange={(e) => onObservationChange(item.id, e.target.value)}
                        className={INPUT_CLASS}
                      />
                    </td>
                  </tr>
                )}
                {!flagged && saved && (
                  <tr className="bg-red-50/60 border-b border-red-100">
                    <td colSpan={columns} className="pb-2.5 text-xs font-semibold text-red-700">
                      {reviewing ? 'Observación de la revisión anterior: ' : 'Observación del revisor: '}
                      <span className="font-normal">{saved}</span>
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
