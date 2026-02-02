'use client';

import { Settings, Bell, Lock, User } from 'lucide-react';

export default function ProviderSettingsPage() {
    return (
        <div className="p-8">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Ajustes</h1>
                <p className="text-gray-500 mt-1">Configura tu cuenta y preferencias</p>
            </div>

            <div className="grid gap-6 max-w-2xl">
                {/* Notificaciones */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-blue-50 rounded-xl">
                            <Bell className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="font-semibold text-gray-900">Notificaciones</h2>
                            <p className="text-sm text-gray-500">Configura cómo recibes alertas</p>
                        </div>
                    </div>
                    <div className="space-y-3">
                        <label className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                            <span className="text-sm text-gray-700">Email al aprobar documentos</span>
                            <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600 rounded" />
                        </label>
                        <label className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                            <span className="text-sm text-gray-700">Email al aprobar facturas</span>
                            <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600 rounded" />
                        </label>
                        <label className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                            <span className="text-sm text-gray-700">Email al recibir observaciones</span>
                            <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600 rounded" />
                        </label>
                    </div>
                </div>

                {/* Seguridad */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-amber-50 rounded-xl">
                            <Lock className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                            <h2 className="font-semibold text-gray-900">Seguridad</h2>
                            <p className="text-sm text-gray-500">Gestiona tu contraseña</p>
                        </div>
                    </div>
                    <button className="w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors">
                        Cambiar contraseña
                    </button>
                </div>

                {/* Cuenta */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-red-50 rounded-xl">
                            <User className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                            <h2 className="font-semibold text-gray-900">Cuenta</h2>
                            <p className="text-sm text-gray-500">Opciones de tu cuenta</p>
                        </div>
                    </div>
                    <p className="text-sm text-gray-500 p-3 bg-gray-50 rounded-xl">
                        Para solicitar la eliminación de tu cuenta, contacta al administrador.
                    </p>
                </div>
            </div>
        </div>
    );
}
