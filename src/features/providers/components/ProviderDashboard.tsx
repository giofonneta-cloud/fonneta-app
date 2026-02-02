'use client';

import { useProviderProfile } from '../hooks/useProviderProfile';
import { ProviderStatsCards } from './ProviderStatsCards';
import { Loader2, AlertCircle, FileText, Receipt, User } from 'lucide-react';
import Link from 'next/link';

export function ProviderDashboard() {
    const { provider, stats, isLoading, error } = useProviderProfile();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
                    <p className="text-gray-500 font-medium">Cargando información...</p>
                </div>
            </div>
        );
    }

    if (error || !provider || !stats) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center max-w-md">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Error al cargar información</h3>
                    <p className="text-gray-500">{error || 'No se pudo cargar tu perfil de proveedor'}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-all"
                    >
                        Reintentar
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-black text-gray-900 mb-2">
                    Bienvenido, {provider.business_name}
                </h1>
                <p className="text-gray-500 font-medium">
                    Portal de autogestión de proveedores - {provider.document_type?.toUpperCase()} {provider.document_number}
                </p>
            </div>

            {/* Stats Cards */}
            <ProviderStatsCards stats={stats} />

            {/* Estado Devuelto - Alerta */}
            {stats.onboarding_status === 'DEVUELTO' && provider.onboarding_notes && (
                <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-2xl">
                    <div className="flex items-start gap-4">
                        <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-1" />
                        <div>
                            <h4 className="text-red-700 font-bold text-lg mb-2">
                                Tu registro ha sido devuelto
                            </h4>
                            <p className="text-red-600 font-medium mb-4">
                                {provider.onboarding_notes}
                            </p>
                            <Link
                                href="/portal/profile"
                                className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 transition-all"
                            >
                                Revisar y Actualizar Información
                            </Link>
                        </div>
                    </div>
                </div>
            )}

            {/* Quick Actions */}
            <div>
                <h2 className="text-xl font-black text-gray-900 mb-4">Acciones Rápidas</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Link
                        href="/portal/profile"
                        className="p-6 bg-white border border-gray-100 rounded-2xl hover:shadow-lg hover:border-blue-200 transition-all group"
                    >
                        <User className="w-8 h-8 text-blue-500 mb-4 group-hover:scale-110 transition-transform" />
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Actualizar Perfil</h3>
                        <p className="text-sm text-gray-500">
                            Edita tu información, datos de contacto y ubicación
                        </p>
                    </Link>

                    <Link
                        href="/portal/documents"
                        className="p-6 bg-white border border-gray-100 rounded-2xl hover:shadow-lg hover:border-purple-200 transition-all group"
                    >
                        <FileText className="w-8 h-8 text-purple-500 mb-4 group-hover:scale-110 transition-transform" />
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Cargar Documentos</h3>
                        <p className="text-sm text-gray-500">
                            Sube Release, seguridad social y otros documentos
                        </p>
                    </Link>

                    <Link
                        href="/portal/invoices/new"
                        className="p-6 bg-white border border-gray-100 rounded-2xl hover:shadow-lg hover:border-emerald-200 transition-all group"
                    >
                        <Receipt className="w-8 h-8 text-emerald-500 mb-4 group-hover:scale-110 transition-transform" />
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Registrar Factura</h3>
                        <p className="text-sm text-gray-500">
                            Crea una nueva factura o cuenta de cobro
                        </p>
                    </Link>
                </div>
            </div>

            {/* Recent Activity / Info Section */}
            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Información Importante</h3>
                <ul className="space-y-3 text-sm text-gray-600">
                    <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2"></span>
                        <span>
                            Mantén tus <strong>documentos actualizados</strong> para evitar retrasos en pagos
                        </span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2"></span>
                        <span>
                            La <strong>seguridad social</strong> debe cargarse mensualmente
                        </span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2"></span>
                        <span>
                            Las facturas se aprueban dentro de <strong>5 días hábiles</strong>
                        </span>
                    </li>
                </ul>
            </div>
        </div>
    );
}
