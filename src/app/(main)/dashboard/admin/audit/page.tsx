import { RoleGuard } from '@/features/auth/components/RoleGuard';
import { AuditLogViewer } from '@/features/admin/components/Audit/AuditLogViewer';
import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
    title: 'Auditoría del Sistema | Fonnetapp',
    description: 'Registro de actividades y cambios en el sistema',
};

export default function AuditPage() {
    return (
        <RoleGuard
            allowedRoles={['admin']}
            fallback={
                <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
                    <p className="text-yellow-700 font-medium">
                        No tienes permisos para acceder a esta sección
                    </p>
                </div>
            }
        >
            <div className="p-6">
                <div className="mb-6">
                    <Link 
                        href="/dashboard/admin"
                        className="text-indigo-600 hover:text-indigo-800 text-sm flex items-center gap-1 mb-4"
                    >
                        ← Volver al dashboard
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-900">Registro de Auditoría</h1>
                    <p className="text-gray-500 mt-1">Historial de acciones críticas y cambios en el sistema</p>
                </div>
                <AuditLogViewer />
            </div>
        </RoleGuard>
    );
}
