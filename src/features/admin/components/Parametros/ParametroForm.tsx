'use client';

import { useState, useEffect } from 'react';
import { parametrosService } from '@/features/admin/services/parametrosService';
import type { Parametro, NewParametro } from '@/features/admin/types/admin.types';

interface Props {
    categoria: string;
    showGrupo?: boolean;
    gruposExistentes?: string[];
    editingItem?: Parametro | null;
    onSaved: () => void;
    onCancel: () => void;
}

function toSlug(text: string): string {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s_]/g, '')
        .replace(/\s+/g, '_')
        .replace(/_+/g, '_')
        .trim();
}

export function ParametroForm({ categoria, showGrupo, gruposExistentes, editingItem, onSaved, onCancel }: Props) {
    const [etiqueta, setEtiqueta] = useState(editingItem?.etiqueta ?? '');
    const [valor, setValor] = useState(editingItem?.valor ?? '');
    const [grupo, setGrupo] = useState(editingItem?.grupo ?? '');
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!editingItem) {
            setValor(toSlug(etiqueta));
        }
    }, [etiqueta, editingItem]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!etiqueta.trim()) { setError('La etiqueta es requerida'); return; }
        if (!valor.trim()) { setError('El valor es requerido'); return; }
        setError('');
        setIsSaving(true);
        try {
            const payload: NewParametro = {
                categoria,
                valor: valor.trim(),
                etiqueta: etiqueta.trim(),
                grupo: showGrupo ? grupo || null : null,
            };
            if (editingItem) {
                await parametrosService.update(editingItem.id, payload);
            } else {
                await parametrosService.create(payload);
            }
            onSaved();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Error al guardar');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                    <label className="text-xs font-bold text-gray-600 uppercase">Etiqueta *</label>
                    <input
                        type="text"
                        value={etiqueta}
                        onChange={e => setEtiqueta(e.target.value)}
                        placeholder="Ej. Nuevo Centro"
                        className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                    />
                </div>
                <div>
                    <label className="text-xs font-bold text-gray-600 uppercase">Valor (clave) *</label>
                    <input
                        type="text"
                        value={valor}
                        onChange={e => setValor(e.target.value)}
                        placeholder="Ej. nuevo_centro"
                        className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-mono"
                    />
                </div>
                {showGrupo && (
                    <div>
                        <label className="text-xs font-bold text-gray-600 uppercase">Grupo</label>
                        <input
                            type="text"
                            list="grupos-list"
                            value={grupo}
                            onChange={e => setGrupo(e.target.value)}
                            placeholder="Ej. Gastos Fijos"
                            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                        />
                        <datalist id="grupos-list">
                            {gruposExistentes?.map(g => <option key={g} value={g} />)}
                        </datalist>
                    </div>
                )}
            </div>
            {error && <p className="text-red-500 text-xs">{error}</p>}
            <div className="flex gap-2 justify-end">
                <button type="button" onClick={onCancel} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 font-medium">
                    Cancelar
                </button>
                <button
                    type="submit"
                    disabled={isSaving}
                    className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                    {isSaving ? 'Guardando...' : editingItem ? 'Actualizar' : '+ Agregar'}
                </button>
            </div>
        </form>
    );
}
