'use client';

import { useState, useEffect } from 'react';
import { getCustomFields, deleteCustomField } from '../../services/adminService';
import type { CustomField } from '../../types/admin.types';
import Link from 'next/link';
import { FieldForm } from './FieldForm';

export function FieldsList() {
    const [fields, setFields] = useState<CustomField[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filterEntity, setFilterEntity] = useState<string>('all');
    const [isEditing, setIsEditing] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        loadFields();
    }, []);

    const loadFields = async () => {
        try {
            const data = await getCustomFields();
            setFields(data);
        } catch (error) {
            console.error('Error loading fields:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (confirm(`¿Estás seguro de eliminar el campo "${name}"? Esta acción no se puede deshacer.`)) {
            const result = await deleteCustomField(id);
            if (result.success) {
                setFields(prev => prev.filter(f => f.id !== id));
            } else {
                alert('Error al eliminar el campo');
            }
        }
    };

    const handleSuccess = () => {
        setIsCreating(false);
        setIsEditing(null);
        loadFields();
    };

    const filteredFields = filterEntity === 'all' 
        ? fields 
        : fields.filter(f => f.entity_type === filterEntity);

    if (isLoading) {
        return (
            <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (isCreating || isEditing) {
        return (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-900">
                        {isCreating ? 'Nuevo Campo Personalizado' : 'Editar Campo'}
                    </h2>
                    <button
                        onClick={() => { setIsCreating(false); setIsEditing(null); }}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        Cancelar
                    </button>
                </div>
                <FieldForm 
                    fieldId={isEditing} 
                    onSuccess={handleSuccess}
                    onCancel={() => { setIsCreating(false); setIsEditing(null); }}
                />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex gap-2">
                    <FilterButton 
                        active={filterEntity === 'all'} 
                        label="Todos" 
                        onClick={() => setFilterEntity('all')} 
                    />
                    <FilterButton 
                        active={filterEntity === 'project'} 
                        label="Proyectos" 
                        onClick={() => setFilterEntity('project')} 
                    />
                    <FilterButton 
                        active={filterEntity === 'expense'} 
                        label="Gastos" 
                        onClick={() => setFilterEntity('expense')} 
                    />
                    <FilterButton 
                        active={filterEntity === 'provider'} 
                        label="Proveedores" 
                        onClick={() => setFilterEntity('provider')} 
                    />
                </div>
                <button
                    onClick={() => setIsCreating(true)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Nuevo Campo
                </button>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Campo</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entidad</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requerido</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredFields.map((field) => (
                            <tr key={field.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900">{field.field_label}</div>
                                    <div className="text-xs text-gray-500">{field.field_name}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <EntityBadge type={field.entity_type} />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {field.field_type}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {field.is_required ? 'Sí' : 'No'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                        field.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-800'
                                    }`}>
                                        {field.is_active ? 'Activo' : 'Inactivo'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button
                                        onClick={() => setIsEditing(field.id)}
                                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                                    >
                                        Editar
                                    </button>
                                    <button
                                        onClick={() => handleDelete(field.id, field.field_label)}
                                        className="text-red-600 hover:text-red-900"
                                    >
                                        Eliminar
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {filteredFields.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                    No hay campos personalizados configurados
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function FilterButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                active 
                    ? 'bg-indigo-100 text-indigo-700' 
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
        >
            {label}
        </button>
    );
}

function EntityBadge({ type }: { type: string }) {
    const colors: Record<string, string> = {
        project: 'bg-blue-100 text-blue-800',
        expense: 'bg-rose-100 text-rose-800',
        sale: 'bg-emerald-100 text-emerald-800',
        provider: 'bg-amber-100 text-amber-800',
    };

    return (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[type] || 'bg-gray-100 text-gray-800'}`}>
            {type.charAt(0).toUpperCase() + type.slice(1)}
        </span>
    );
}
