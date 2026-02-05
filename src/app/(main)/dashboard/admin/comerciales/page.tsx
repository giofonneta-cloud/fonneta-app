import { ComercialesManager } from '@/features/admin/components/ComercialesManager';
import { RoleGuard } from '@/features/auth/components/RoleGuard';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function ComercialesPage() {
    return (
        <RoleGuard
            allowedRoles={['admin']}
            fallback={
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                    <p className="text-yellow-700 font-medium">
                        Solo los administradores pueden gestionar comerciales
                    </p>
                </div>
            }
        >
            <div className="space-y-6">
                {/* Header con navegación */}
                <div className="flex items-center gap-4">
                    <Link
                        href="/dashboard/admin"
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            Gestión de Comerciales
                        </h1>
                        <p className="text-gray-500">
                            Administra los comerciales para asignar comisiones por ventas
                        </p>
                    </div>
                </div>

                {/* Componente principal */}
                <ComercialesManager />
            </div>
        </RoleGuard>
    );
}
