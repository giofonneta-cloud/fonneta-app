import { AdminDashboard } from '@/features/admin/components/AdminDashboard';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Panel de Administración | Fonnetapp',
    description: 'Dashboard de administración del sistema',
};

export default function AdminPage() {
    return (
        <div className="p-6">
            <AdminDashboard />
        </div>
    );
}
