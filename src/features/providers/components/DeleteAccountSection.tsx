'use client';

import { useState } from 'react';
import { Trash2, AlertTriangle, Loader2 } from 'lucide-react';

export function DeleteAccountSection() {
    const [open, setOpen] = useState(false);
    const [password, setPassword] = useState('');
    const [confirmed, setConfirmed] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleDelete = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/account/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password }),
            });
            const data = (await response.json().catch(() => ({}))) as { error?: string };
            if (!response.ok) {
                setError(data.error || 'No se pudo eliminar la cuenta.');
                return;
            }
            window.location.href = '/login';
        } catch {
            setError('Error de red. Inténtalo de nuevo.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-2xl border border-red-100 p-6">
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-red-50 rounded-xl">
                    <Trash2 className="w-5 h-5 text-red-600" />
                </div>
                <div>
                    <h2 className="font-semibold text-gray-900">Eliminar mi cuenta y mis datos</h2>
                    <p className="text-sm text-gray-500">Derecho de supresión (Habeas Data)</p>
                </div>
            </div>

            {!open ? (
                <button
                    type="button"
                    onClick={() => setOpen(true)}
                    className="text-sm font-bold text-red-600 hover:text-red-700 underline"
                >
                    Quiero eliminar mi cuenta
                </button>
            ) : (
                <div className="space-y-4">
                    <div className="flex gap-3 p-4 bg-red-50 rounded-xl text-sm text-red-800">
                        <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                        <p>
                            Se eliminarán tu acceso, tu perfil y tus documentos de identidad (RUT, cédula, cámara de comercio y
                            certificación bancaria). Las facturas y órdenes ya radicadas se conservan sin datos personales por
                            obligación de conservación contable. Esta acción no se puede deshacer.
                        </p>
                    </div>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Confirma con tu contraseña"
                        autoComplete="current-password"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                    />
                    <label className="flex items-start gap-2 text-sm text-gray-700">
                        <input
                            type="checkbox"
                            checked={confirmed}
                            onChange={(e) => setConfirmed(e.target.checked)}
                            className="mt-1 w-4 h-4"
                        />
                        Entiendo que esta acción es permanente.
                    </label>
                    {error && <p className="text-sm font-bold text-red-600">{error}</p>}
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={handleDelete}
                            disabled={!password || !confirmed || loading}
                            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-bold text-sm disabled:opacity-50 flex items-center gap-2"
                        >
                            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                            Eliminar definitivamente
                        </button>
                        <button
                            type="button"
                            onClick={() => { setOpen(false); setPassword(''); setConfirmed(false); setError(null); }}
                            className="text-sm font-bold text-gray-500 hover:text-gray-700"
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
