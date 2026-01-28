'use client';

import React, { useState } from 'react';
import { ProviderForm } from '@/features/providers/components/ProviderForm';
import { ProvidersTable } from '@/features/providers/components/ProvidersList';
import { Button } from '@/shared/components/ui/button';
import { Plus, Building2, List } from 'lucide-react';
import { Provider } from '@/features/providers/types/provider.types';

export default function ProvidersPage() {
    const [showForm, setShowForm] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);
    const [selectedProvider, setSelectedProvider] = useState<Provider | undefined>(undefined);

    const handleSuccess = () => {
        setShowForm(false);
        setSelectedProvider(undefined);
        setRefreshKey(prev => prev + 1); // Force refresh of the list
    };

    const handleCreateNew = () => {
        setSelectedProvider(undefined);
        setShowForm(true);
    };

    const handleEdit = (provider: Provider) => {
        setSelectedProvider(provider);
        setShowForm(true);
    };

    const handleCancel = () => {
        setShowForm(false);
        setSelectedProvider(undefined);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <Building2 className="w-10 h-10 text-blue-600 bg-blue-50 p-2 rounded-2xl" />
                        Proveedores y Clientes
                    </h1>
                    <p className="text-slate-500 font-medium mt-2">
                        Gestión centralizada de proveedores y clientes
                    </p>
                </div>
                <div className="flex gap-3">
                    {showForm && (
                        <Button
                            onClick={handleCancel}
                            variant="outline"
                            className="gap-2"
                        >
                            <List className="w-4 h-4" />
                            Ver Lista
                        </Button>
                    )}
                    {!showForm && (
                        <Button
                            onClick={handleCreateNew}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold gap-2 shadow-lg"
                        >
                            <Plus className="w-4 h-4" />
                            Nuevo Proveedor/Cliente
                        </Button>
                    )}
                </div>
            </div>

            {showForm ? (
                <ProviderForm
                    onSuccess={handleSuccess}
                    onCancel={handleCancel}
                    initialData={selectedProvider}
                />
            ) : (
                <ProvidersTable
                    key={refreshKey}
                    onEdit={handleEdit}
                />
            )}
        </div>
    );
}
