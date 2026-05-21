import { SystemConfigEditor } from '@/features/admin/components/SystemConfig/SystemConfigEditor';

export const metadata = {
    title: 'Configuración del Sistema | Fonneta',
    description: 'Administra los parámetros globales del sistema',
};

export default function ConfiguracionPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Configuración del Sistema</h1>
                <p className="mt-2 text-gray-600">
                    Parámetros globales y configuraciones del módulo de finanzas
                </p>
            </div>

            <SystemConfigEditor />
        </div>
    );
}
