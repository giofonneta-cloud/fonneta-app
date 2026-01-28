import { RoleGuard } from '@/features/auth/components/RoleGuard';
import { UsersList } from '@/features/admin/components/UserManagement/UsersList';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Gestión de Usuarios | Fonnetapp',
    description: 'Administrar usuarios del sistema',
};

export default function UsersPage() {
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
                    <h1 className="text-3xl font-bold text-gray-900">Gestión de Usuarios</h1>
                    <p className="text-gray-500 mt-1">Administra los usuarios del sistema</p>
                </div>
                <UsersList />
            </div>
        </RoleGuard>
    );
}
