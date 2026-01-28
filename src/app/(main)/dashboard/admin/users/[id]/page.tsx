import { RoleGuard } from '@/features/auth/components/RoleGuard';
import { UserForm } from '@/features/admin/components/UserManagement/UserForm';
import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
    title: 'Editar Usuario | Fonnetapp',
    description: 'Modificar datos del usuario',
};

interface Props {
    params: Promise<{ id: string }>;
}

export default async function EditUserPage({ params }: Props) {
    const { id } = await params;
    
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
                        href="/dashboard/admin/users"
                        className="text-indigo-600 hover:text-indigo-800 text-sm flex items-center gap-1 mb-4"
                    >
                        ← Volver a usuarios
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-900">Editar Usuario</h1>
                    <p className="text-gray-500 mt-1">Modificar datos y permisos del usuario</p>
                </div>
                <UserForm userId={id} />
            </div>
        </RoleGuard>
    );
}
