'use client';

import { useState, useEffect } from 'react';
import { getCustomFields, createCustomField, updateCustomField } from '../../services/adminService';
import type { CustomFieldType, CustomField } from '../../types/admin.types';

interface Props {
    fieldId: string | null;
    onSuccess: () => void;
    onCancel: () => void;
}

export function FieldForm({ fieldId, onSuccess, onCancel }: Props) {
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        entity_type: 'project',
        field_name: '',
        field_label: '',
        field_type: 'text' as CustomFieldType,
        is_required: false,
        placeholder: '',
        options: '', // Separadas por coma
        min: '',
        max: '',
        helpText: '',
    });

    useEffect(() => {
        if (fieldId) {
            loadField();
        }
    }, [fieldId]);

    const loadField = async () => {
        // En un caso real usaríamos getFieldById, aquí reutilizamos getCustomFields
        // y filtramos en cliente por simplicidad
        const fields = await getCustomFields();
        const field = fields.find(f => f.id === fieldId);
        
        if (field) {
            setFormData({
                entity_type: field.entity_type,
                field_name: field.field_name,
                field_label: field.field_label,
                field_type: field.field_type,
                is_required: field.is_required,
                placeholder: field.field_config.placeholder || '',
                options: field.field_config.options?.map(o => o.label).join(', ') || '',
                min: field.field_config.min?.toString() || '',
                max: field.field_config.max?.toString() || '',
                helpText: field.field_config.helpText || '',
            });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const config: any = {};
            if (formData.placeholder) config.placeholder = formData.placeholder;
            if (formData.helpText) config.helpText = formData.helpText;
            if (formData.min) config.min = Number(formData.min);
            if (formData.max) config.max = Number(formData.max);
            
            if (formData.field_type === 'dropdown' || formData.field_type === 'radio') {
                config.options = formData.options.split(',').map(o => ({
                    label: o.trim(),
                    value: o.trim().toLowerCase().replace(/\s+/g, '_')
                }));
            }

            const fieldData = {
                entity_type: formData.entity_type as any,
                field_name: formData.field_name.toLowerCase().replace(/\s+/g, '_'),
                field_label: formData.field_label,
                field_type: formData.field_type,
                is_required: formData.is_required,
                field_config: config,
                is_active: true,
                display_order: 0,
                visible_in: ['form'],
                visible_for_roles: ['admin', 'pm', 'administrativo'],
                editable_by_roles: ['admin', 'pm'],
            };

            if (fieldId) {
                await updateCustomField(fieldId, fieldData);
            } else {
                await createCustomField(fieldData);
            }

            onSuccess();
        } catch (error) {
            console.error('Error saving field:', error);
            alert('Error al guardar el campo');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Entidad</label>
                    <select
                        value={formData.entity_type}
                        onChange={e => setFormData({ ...formData, entity_type: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        disabled={!!fieldId}
                    >
                        <option value="project">Proyecto</option>
                        <option value="expense">Gasto</option>
                        <option value="provider">Proveedor</option>
                        <option value="sale">Venta</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Campo</label>
                    <input
                        type="text"
                        value={formData.field_label}
                        onChange={e => setFormData({ ...formData, field_label: e.target.value, field_name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Dato</label>
                    <select
                        value={formData.field_type}
                        onChange={e => setFormData({ ...formData, field_type: e.target.value as CustomFieldType })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="text">Texto Corto</option>
                        <option value="textarea">Texto Largo</option>
                        <option value="number">Número</option>
                        <option value="currency">Moneda</option>
                        <option value="date">Fecha</option>
                        <option value="dropdown">Lista Desplegable</option>
                        <option value="checkbox">Casilla de Verificación</option>
                        <option value="file">Archivo</option>
                    </select>
                </div>

                <div className="flex items-center pt-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={formData.is_required}
                            onChange={e => setFormData({ ...formData, is_required: e.target.checked })}
                            className="w-4 h-4 text-indigo-600 rounded border-gray-300"
                        />
                        <span className="text-sm text-gray-700">Campo Obligatorio</span>
                    </label>
                </div>
            </div>

            {/* Configuración específica por tipo */}
            <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                <h4 className="text-sm font-medium text-gray-900 border-b border-gray-200 pb-2">
                    Configuración Adicional
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Placeholder / Ayuda</label>
                        <input
                            type="text"
                            value={formData.placeholder}
                            onChange={e => setFormData({ ...formData, placeholder: e.target.value })}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                        />
                    </div>

                    {(formData.field_type === 'number' || formData.field_type === 'currency') && (
                        <>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Mínimo</label>
                                <input
                                    type="number"
                                    value={formData.min}
                                    onChange={e => setFormData({ ...formData, min: e.target.value })}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Máximo</label>
                                <input
                                    type="number"
                                    value={formData.max}
                                    onChange={e => setFormData({ ...formData, max: e.target.value })}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                                />
                            </div>
                        </>
                    )}

                    {(formData.field_type === 'dropdown' || formData.field_type === 'radio') && (
                        <div className="col-span-2">
                            <label className="block text-xs font-medium text-gray-500 mb-1">
                                Opciones (separadas por coma)
                            </label>
                            <input
                                type="text"
                                value={formData.options}
                                onChange={e => setFormData({ ...formData, options: e.target.value })}
                                placeholder="Opción A, Opción B, Opción C"
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                                required
                            />
                        </div>
                    )}
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                    Cancelar
                </button>
                <button
                    type="submit"
                    disabled={isLoading}
                    className="px-4 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                    {isLoading ? 'Guardando...' : fieldId ? 'Actualizar Campo' : 'Crear Campo'}
                </button>
            </div>
        </form>
    );
}
