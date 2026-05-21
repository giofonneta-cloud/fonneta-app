'use client';

import { useState, useEffect } from 'react';
import { getSystemModules, updateModuleConfig } from '../../services/adminService';
import type { SystemConfig } from '../../types/admin.types';
import { Settings, Save, AlertCircle, CheckCircle } from 'lucide-react';

export function SystemConfigEditor() {
    const [modules, setModules] = useState<SystemConfig[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Valor local del formulario
    const [metaAnual, setMetaAnual] = useState<string>('5000000000');

    useEffect(() => {
        loadModules();
    }, []);

    const loadModules = async () => {
        try {
            const data = await getSystemModules();
            setModules(data);

            // Si existe finanzas_config, cargar su meta_anual
            const finanzasConfig = data.find(m => m.module_name === 'finanzas_config');
            if (finanzasConfig && finanzasConfig.config_data?.meta_anual) {
                setMetaAnual(String(finanzasConfig.config_data.meta_anual));
            }
        } catch (error) {
            console.error('Error loading modules:', error);
            setMessage({ type: 'error', text: 'Error cargando configuración' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setIsSaving(true);
            setMessage(null);

            // Buscar el módulo finanzas_config
            const finanzasConfig = modules.find(m => m.module_name === 'finanzas_config');
            if (!finanzasConfig) {
                setMessage({
                    type: 'error',
                    text: 'Módulo de configuración de finanzas no encontrado. Ejecuta el INSERT manual primero.'
                });
                return;
            }

            const newMetaValue = Math.floor(Number(metaAnual));
            if (isNaN(newMetaValue) || newMetaValue <= 0) {
                setMessage({ type: 'error', text: 'Meta Anual debe ser un número positivo' });
                return;
            }

            // Actualizar config_data con el nuevo valor
            const result = await updateModuleConfig(finanzasConfig.id, {
                meta_anual: newMetaValue
            });

            if (result.success) {
                setMessage({ type: 'success', text: '✓ Meta Anual actualizada correctamente' });
                // Recargar para confirmar
                await loadModules();
            } else {
                setMessage({ type: 'error', text: `Error: ${result.error}` });
            }
        } catch (error) {
            console.error('Error saving config:', error);
            setMessage({ type: 'error', text: 'Error al guardar configuración' });
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const finanzasConfig = modules.find(m => m.module_name === 'finanzas_config');

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-indigo-50 rounded-lg">
                        <Settings className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900">Configuración de Finanzas</h2>
                        <p className="text-sm text-gray-500">Parámetros del módulo de finanzas</p>
                    </div>
                </div>

                {!finanzasConfig ? (
                    <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg mb-6">
                        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                        <div className="text-sm text-amber-800">
                            <p className="font-medium">Configuración no encontrada</p>
                            <p>Ejecuta este INSERT en Supabase SQL Editor:</p>
                            <pre className="mt-2 p-2 bg-white border border-amber-200 rounded text-xs overflow-x-auto">
{`INSERT INTO system_config (
  module_name, display_name, description,
  is_active, is_core, config_data, affected_roles
) VALUES (
  'finanzas_config', 'Configuración de Finanzas',
  'Parámetros numéricos del módulo de finanzas',
  true, false,
  '{"meta_anual": 5000000000}'::jsonb, '{}'::text[]
);`}
                            </pre>
                        </div>
                    </div>
                ) : null}

                <div className="space-y-4">
                    <div>
                        <label htmlFor="meta" className="block text-sm font-medium text-gray-700 mb-2">
                            Meta Anual (COP)
                        </label>
                        <input
                            id="meta"
                            type="number"
                            value={metaAnual}
                            onChange={(e) => setMetaAnual(e.target.value)}
                            disabled={isSaving || !finanzasConfig}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                            placeholder="5000000000"
                        />
                        <p className="mt-1 text-xs text-gray-500">
                            Meta de ingresos anuales que se muestra en el dashboard de finanzas
                        </p>
                    </div>

                    {message && (
                        <div className={`flex items-center gap-3 p-4 rounded-lg ${
                            message.type === 'success'
                                ? 'bg-green-50 border border-green-200 text-green-800'
                                : 'bg-red-50 border border-red-200 text-red-800'
                        }`}>
                            {message.type === 'success' ? (
                                <CheckCircle className="w-5 h-5 flex-shrink-0" />
                            ) : (
                                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            )}
                            <p className="text-sm">{message.text}</p>
                        </div>
                    )}

                    <button
                        onClick={handleSave}
                        disabled={isSaving || !finanzasConfig}
                        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                    >
                        <Save className="w-5 h-5" />
                        {isSaving ? 'Guardando...' : 'Guardar Configuración'}
                    </button>
                </div>
            </div>

            {finanzasConfig && (
                <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 text-sm text-gray-600">
                    <p className="font-medium text-gray-700 mb-2">Información del módulo:</p>
                    <ul className="space-y-1 text-xs">
                        <li><span className="font-medium">Estado:</span> {finanzasConfig.is_active ? 'Activo' : 'Inactivo'}</li>
                        <li><span className="font-medium">Última actualización:</span> {new Date(finanzasConfig.updated_at).toLocaleString('es-CO')}</li>
                    </ul>
                </div>
            )}
        </div>
    );
}
