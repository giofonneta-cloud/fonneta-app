'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { parametrosService } from '@/features/admin/services/parametrosService';
import { ParametroForm } from './ParametroForm';
import type { Parametro } from '@/features/admin/types/admin.types';

const TABS = [
    { key: 'centros_costo', label: 'Centros de Costo', showGrupo: false },
    { key: 'lineas_negocio', label: 'Líneas de Negocio', showGrupo: false },
    { key: 'formas_pago', label: 'Formas de Pago', showGrupo: false },
    { key: 'plazos_pago_ventas', label: 'Plazos Pago (Ventas)', showGrupo: false },
    { key: 'plazos_pago_gastos', label: 'Plazos Pago (Gastos)', showGrupo: false },
    { key: 'categorias_gasto', label: 'Categorías de Gasto', showGrupo: true },
    { key: 'tipos_tarifario', label: 'Tipos Tarifario', showGrupo: false },
    { key: 'unidades_medida', label: 'Unidades de Medida', showGrupo: false },
    { key: 'estados_onboarding', label: 'Estados Onboarding', showGrupo: false },
];

export function ParametrosManager() {
    const [activeTab, setActiveTab] = useState(TABS[0].key);
    const [items, setItems] = useState<Parametro[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [editingItem, setEditingItem] = useState<Parametro | null>(null);

    const currentTab = TABS.find(t => t.key === activeTab)!;
    const gruposExistentes = [...new Set(items.map(i => i.grupo).filter(Boolean))] as string[];

    const loadItems = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await parametrosService.getByCategoria(activeTab);
            setItems(data);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [activeTab]);

    useEffect(() => {
        setShowForm(false);
        setEditingItem(null);
        loadItems();
    }, [loadItems]);

    const handleDelete = async (id: string) => {
        if (!confirm('¿Eliminar esta opción?')) return;
        await parametrosService.delete(id);
        loadItems();
    };

    const handleMove = async (index: number, direction: 'up' | 'down') => {
        const newItems = [...items];
        const swapIdx = direction === 'up' ? index - 1 : index + 1;
        if (swapIdx < 0 || swapIdx >= newItems.length) return;
        [newItems[index], newItems[swapIdx]] = [newItems[swapIdx], newItems[index]];
        const reordered = newItems.map((item, i) => ({ id: item.id, orden: i + 1 }));
        setItems(newItems);
        await parametrosService.reorder(reordered);
    };

    const handleSaved = () => {
        setShowForm(false);
        setEditingItem(null);
        loadItems();
    };

    // Agrupar items por grupo (para categorías_gasto)
    const grouped = currentTab.showGrupo
        ? items.reduce<Record<string, Parametro[]>>((acc, item) => {
            const g = item.grupo ?? 'Sin grupo';
            if (!acc[g]) acc[g] = [];
            acc[g].push(item);
            return acc;
        }, {})
        : null;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-black text-gray-900">Parámetros del Sistema</h1>
                <p className="text-sm text-gray-500 mt-1">Administra las opciones de todos los campos desplegables del sistema</p>
            </div>

            {/* Tabs */}
            <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-2">
                {TABS.map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors ${
                            activeTab === tab.key
                                ? 'bg-blue-600 text-white'
                                : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-gray-800">{currentTab.label}</h2>
                    {!showForm && !editingItem && (
                        <button
                            onClick={() => setShowForm(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-colors"
                        >
                            <Plus className="w-4 h-4" /> Agregar opción
                        </button>
                    )}
                </div>

                {/* Form para nueva opción */}
                {showForm && !editingItem && (
                    <ParametroForm
                        categoria={activeTab}
                        showGrupo={currentTab.showGrupo}
                        gruposExistentes={gruposExistentes}
                        onSaved={handleSaved}
                        onCancel={() => setShowForm(false)}
                    />
                )}

                {isLoading ? (
                    <div className="text-center py-8 text-gray-400">Cargando...</div>
                ) : items.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">No hay opciones configuradas</div>
                ) : currentTab.showGrupo && grouped ? (
                    /* Vista agrupada (categorías de gasto) */
                    <div className="space-y-4">
                        {Object.entries(grouped).map(([grupo, groupItems]) => (
                            <div key={grupo}>
                                <h3 className="text-xs font-black uppercase tracking-widest text-blue-600 mb-2 px-2">{grupo}</h3>
                                <ItemsList
                                    items={groupItems}
                                    editingItem={editingItem}
                                    activeTab={activeTab}
                                    showGrupo={currentTab.showGrupo}
                                    gruposExistentes={gruposExistentes}
                                    onEdit={setEditingItem}
                                    onDelete={handleDelete}
                                    onMove={handleMove}
                                    onSaved={handleSaved}
                                    onCancelEdit={() => setEditingItem(null)}
                                    getIndexInMain={(item) => items.indexOf(item)}
                                />
                            </div>
                        ))}
                    </div>
                ) : (
                    /* Vista plana */
                    <ItemsList
                        items={items}
                        editingItem={editingItem}
                        activeTab={activeTab}
                        showGrupo={currentTab.showGrupo}
                        gruposExistentes={gruposExistentes}
                        onEdit={setEditingItem}
                        onDelete={handleDelete}
                        onMove={handleMove}
                        onSaved={handleSaved}
                        onCancelEdit={() => setEditingItem(null)}
                        getIndexInMain={(item) => items.indexOf(item)}
                    />
                )}
            </div>
        </div>
    );
}

interface ItemsListProps {
    items: Parametro[];
    editingItem: Parametro | null;
    activeTab: string;
    showGrupo: boolean;
    gruposExistentes: string[];
    onEdit: (item: Parametro) => void;
    onDelete: (id: string) => void;
    onMove: (index: number, direction: 'up' | 'down') => void;
    onSaved: () => void;
    onCancelEdit: () => void;
    getIndexInMain: (item: Parametro) => number;
}

function ItemsList({ items, editingItem, activeTab, showGrupo, gruposExistentes, onEdit, onDelete, onMove, onSaved, onCancelEdit, getIndexInMain }: ItemsListProps) {
    return (
        <div className="space-y-2">
            {items.map((item, idx) => (
                <div key={item.id}>
                    {editingItem?.id === item.id ? (
                        <ParametroForm
                            categoria={activeTab}
                            showGrupo={showGrupo}
                            gruposExistentes={gruposExistentes}
                            editingItem={editingItem}
                            onSaved={onSaved}
                            onCancel={onCancelEdit}
                        />
                    ) : (
                        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl hover:bg-gray-100 transition-colors group">
                            <div className="flex items-center gap-3">
                                <div className="flex flex-col gap-0.5">
                                    <button onClick={() => onMove(getIndexInMain(item), 'up')} className="text-gray-300 hover:text-gray-600 transition-colors">
                                        <ChevronUp className="w-3 h-3" />
                                    </button>
                                    <button onClick={() => onMove(getIndexInMain(item), 'down')} className="text-gray-300 hover:text-gray-600 transition-colors">
                                        <ChevronDown className="w-3 h-3" />
                                    </button>
                                </div>
                                <div>
                                    <span className="font-semibold text-gray-800 text-sm">{item.etiqueta}</span>
                                    <span className="ml-2 text-xs text-gray-400 font-mono">{item.valor}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => onEdit(item)}
                                    className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                                    title="Editar"
                                >
                                    <Pencil className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => onDelete(item.id)}
                                    className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Eliminar"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
