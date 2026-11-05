'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import { Check, Loader2, Paperclip, Plus, Trash2 } from 'lucide-react';
import type { Parametro } from '@/features/admin/types/admin.types';
import { legalizacionesService } from '../services/legalizacionesService';
import type { ItemSaveInput } from '../types/legalizacion.types';
import { errorMessage, formatCOP } from './legalizacionFormat';

export interface ItemDraft extends ItemSaveInput {
  key: string;
  observacion_revisor: string | null;
}

let draftCounter = 0;

export function emptyItem(): ItemDraft {
  draftCounter += 1;
  return {
    key: `linea-${draftCounter}`,
    id: null,
    revision_estado: 'pendiente',
    fecha: null,
    categoria: null,
    categoria_etiqueta: null,
    establecimiento: null,
    establecimiento_nit: null,
    numero_soporte: null,
    descripcion: null,
    comentario: null,
    observacion_revisor: null,
    valor: 0,
    soporte_url: null,
    soporte_nombre: null,
    order_index: 0,
  };
}

const CELL_INPUT =
  'w-full h-9 px-2 text-sm bg-white border border-slate-300 rounded-md hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-colors placeholder:text-slate-300 disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed';

const CELL_TEXTAREA =
  'block w-full min-h-9 px-2 py-[7px] text-sm leading-5 bg-white border border-slate-300 rounded-md resize-none overflow-hidden hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-colors placeholder:text-slate-300 disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed';

interface AutoTextProps {
  value: string;
  label: string;
  placeholder?: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}

// Crece en alto según el texto, para que nada quede cortado dentro de la celda.
function AutoText({ value, label, placeholder, disabled, onChange }: AutoTextProps) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  return (
    <textarea
      ref={ref}
      rows={1}
      aria-label={label}
      value={value}
      placeholder={placeholder}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      className={CELL_TEXTAREA}
    />
  );
}

const HEADERS =['#', 'Fecha', 'Categoría', 'Proveedor / Establecimiento', 'NIT proveedor', 'N° Factura / Soporte', 'Descripción / Concepto', 'Comentario (opcional)', 'Valor', 'Soporte', ''];

interface RowProps {
  item: ItemDraft;
  index: number;
  categorias: Parametro[];
  canRemove: boolean;
  onChange: (key: string, patch: Partial<ItemDraft>) => void;
  onRemove: (key: string) => void;
  onUploadingChange: (delta: 1 | -1) => void;
}

function ItemRow({ item, index, categorias, canRemove, onChange, onRemove, onUploadingChange }: RowProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    onUploadingChange(1);
    try {
      const url = await legalizacionesService.uploadSoporte(file);
      onChange(item.key, { soporte_url: url, soporte_nombre: file.name });
    } catch (err) {
      setUploadError(errorMessage(err, 'No se pudo subir el soporte'));
    } finally {
      setUploading(false);
      onUploadingChange(-1);
    }
  };

  const handleCategoria = (valor: string) => {
    const opcion = categorias.find((c) => c.valor === valor);
    onChange(item.key, { categoria: valor || null, categoria_etiqueta: opcion?.etiqueta ?? null });
  };

  const rowLabel = `línea ${index + 1}`;
  const locked = item.revision_estado === 'aprobada';

  return (
    <>
    <tr className={`hover:bg-slate-50/60 align-top ${item.observacion_revisor ? 'bg-red-50/60' : 'border-b border-slate-100'}`}>
      <td className="pl-3 pr-1 py-2 text-xs font-bold text-slate-400 w-8">{index + 1}</td>
      <td className="px-1 py-2 w-[140px]">
        <input
          type="date"
          aria-label={`Fecha ${rowLabel}`}
          value={item.fecha ?? ''}
          onChange={(e) => onChange(item.key, { fecha: e.target.value || null })}
          disabled={locked}
          className={CELL_INPUT}
        />
      </td>
      <td className="px-1 py-2 w-[150px]">
        <select
          aria-label={`Categoría ${rowLabel}`}
          value={item.categoria ?? ''}
          onChange={(e) => handleCategoria(e.target.value)}
          disabled={locked}
          className={CELL_INPUT}
        >
          <option value="">Selecciona...</option>
          {categorias.map((c) => <option key={c.id} value={c.valor}>{c.etiqueta}</option>)}
        </select>
      </td>
      <td className="px-1 py-2 w-[190px]">
        <AutoText
          label={`Proveedor ${rowLabel}`}
          value={item.establecimiento ?? ''}
          disabled={locked}
          onChange={(value) => onChange(item.key, { establecimiento: value })}
        />
      </td>
      <td className="px-1 py-2 w-[130px]">
        <input
          type="text"
          aria-label={`NIT del proveedor ${rowLabel}`}
          value={item.establecimiento_nit ?? ''}
          onChange={(e) => onChange(item.key, { establecimiento_nit: e.target.value })}
          disabled={locked}
          className={CELL_INPUT}
          placeholder="900123456-7"
        />
      </td>
      <td className="px-1 py-2 w-[140px]">
        <AutoText
          label={`N° de soporte ${rowLabel}`}
          value={item.numero_soporte ?? ''}
          disabled={locked}
          onChange={(value) => onChange(item.key, { numero_soporte: value })}
        />
      </td>
      <td className="px-1 py-2 min-w-[200px]">
        <AutoText
          label={`Descripción ${rowLabel}`}
          value={item.descripcion ?? ''}
          disabled={locked}
          onChange={(value) => onChange(item.key, { descripcion: value })}
        />
      </td>
      <td className="px-1 py-2 min-w-[180px]">
        <AutoText
          label={`Comentario ${rowLabel}`}
          value={item.comentario ?? ''}
          placeholder="Aclaración opcional"
          disabled={locked}
          onChange={(value) => onChange(item.key, { comentario: value })}
        />
      </td>
      <td className="px-1 py-2 w-[130px]">
        <input
          type="number"
          min="0"
          step="any"
          aria-label={`Valor ${rowLabel}`}
          value={item.valor === 0 ? '' : item.valor}
          onChange={(e) => onChange(item.key, { valor: Number(e.target.value) || 0 })}
          disabled={locked}
          className={`${CELL_INPUT} text-right`}
          placeholder="0"
        />
      </td>
      <td className="px-1 py-2 w-[150px]">
        <label
          title={item.soporte_nombre ?? undefined}
          className={`flex items-center gap-1.5 h-9 px-2 text-xs font-semibold border border-dashed rounded-md cursor-pointer transition-colors ${
            item.soporte_url
              ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
              : 'border-slate-300 text-slate-500 hover:bg-white'
          }`}
        >
          {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin flex-shrink-0" /> : item.soporte_url ? <Check className="w-3.5 h-3.5 flex-shrink-0" /> : <Paperclip className="w-3.5 h-3.5 flex-shrink-0" />}
          <span className="truncate">{uploading ? 'Subiendo...' : item.soporte_nombre || (item.soporte_url ? 'Cargado' : 'Adjuntar')}</span>
          <input
            type="file"
            accept="application/pdf,image/png,image/jpeg"
            className="hidden"
            disabled={uploading || locked}
            onChange={(e) => {
              handleFile(e.target.files?.[0]);
              e.target.value = '';
            }}
          />
        </label>
        {uploadError && <p className="text-[11px] text-red-600 mt-1 leading-tight">{uploadError}</p>}
      </td>
      <td className="pl-1 pr-3 py-2 w-20 text-center">
        {locked ? (
          <span className="inline-block h-9 leading-9 text-[11px] font-bold text-emerald-700">Aprobada</span>
        ) : canRemove && (
          <button
            type="button"
            onClick={() => onRemove(item.key)}
            aria-label={`Eliminar ${rowLabel}`}
            className="h-9 w-9 inline-flex items-center justify-center text-slate-300 hover:text-red-600 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </td>
    </tr>
    {item.observacion_revisor && (
      <tr className="bg-red-50/60 border-b border-red-100">
        <td />
        <td colSpan={9} className="px-2 pb-2.5 text-xs font-semibold text-red-700">
          Observación del revisor: <span className="font-normal">{item.observacion_revisor}</span>
        </td>
      </tr>
    )}
    </>
  );
}

interface EditorProps {
  items: ItemDraft[];
  categorias: Parametro[];
  onItemsChange: (updater: (prev: ItemDraft[]) => ItemDraft[]) => void;
  onUploadingChange: (delta: 1 | -1) => void;
}

export function LegalizacionItemsEditor({ items, categorias, onItemsChange, onUploadingChange }: EditorProps) {
  const total = items.reduce((sum, item) => sum + item.valor, 0);

  const updateItem = (key: string, patch: Partial<ItemDraft>) =>
    onItemsChange((prev) => prev.map((item) => (item.key === key ? { ...item, ...patch } : item)));

  const removeItem = (key: string) => onItemsChange((prev) => prev.filter((item) => item.key !== key));

  return (
    <section className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-800">Relación de gastos</h3>
        <span className="text-xs text-slate-400">Cada línea requiere su soporte</span>
      </div>

      <div className="overflow-x-auto border border-slate-200 rounded-xl">
        <table className="w-full min-w-[1400px] text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr className="text-left text-xs font-bold text-slate-500">
              {HEADERS.map((header, i) => (
                <th key={i} className={`py-2.5 ${i === 0 ? 'pl-3 pr-1' : 'px-2'} ${header === 'Valor' ? 'text-right' : ''}`}>{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <ItemRow
                key={item.key}
                item={item}
                index={index}
                categorias={categorias}
                canRemove={items.length > 1}
                onChange={updateItem}
                onRemove={removeItem}
                onUploadingChange={onUploadingChange}
              />
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-slate-50 border-t border-slate-200">
              <td colSpan={8} className="px-3 py-3">
                <button
                  type="button"
                  onClick={() => onItemsChange((prev) => [...prev, emptyItem()])}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Agregar línea
                </button>
              </td>
              <td className="px-3 py-3 text-right text-sm font-bold text-slate-900 whitespace-nowrap">{formatCOP(total)}</td>
              <td colSpan={2} />
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
}
