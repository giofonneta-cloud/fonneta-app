'use client';

import React, { useState } from 'react';
import { ProviderForm } from '@/features/providers/components/ProviderForm';
import { ProvidersTable } from '@/features/providers/components/ProvidersList';
import { Button } from '@/shared/components/ui/button';
import { Plus, Building2, List, UserPlus, Copy, Check } from 'lucide-react';
import { Provider } from '@/features/providers/types/provider.types';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/shared/components/ui/dialog';
import { Input } from '@/shared/components/ui/input';

export default function ProvidersPage() {
    const [showForm, setShowForm] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);
    const [selectedProvider, setSelectedProvider] = useState<Provider | undefined>(undefined);
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [copied, setCopied] = useState(false);

    const inviteLink = typeof window !== 'undefined' 
        ? `${window.location.origin}/register/provider`
        : '';

    const handleCopyLink = () => {
        navigator.clipboard.writeText(inviteLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

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
                        <>
                            <Button
                                onClick={() => setIsInviteModalOpen(true)}
                                variant="outline"
                                className="border-blue-200 text-blue-600 hover:bg-blue-50 font-bold gap-2"
                            >
                                <UserPlus className="w-4 h-4" />
                                Invitar Proveedor
                            </Button>
                            <Button
                                onClick={handleCreateNew}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-bold gap-2 shadow-lg"
                            >
                                <Plus className="w-4 h-4" />
                                Nuevo Proveedor/Cliente
                            </Button>
                        </>
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

            <Dialog open={isInviteModalOpen} onOpenChange={setIsInviteModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Invitar Proveedor</DialogTitle>
                        <DialogDescription>
                            Comparte este enlace con tu proveedor para que pueda registrarse en la plataforma.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex items-center space-x-2 py-4">
                        <div className="grid flex-1 gap-2">
                            <Input
                                id="link"
                                defaultValue={inviteLink}
                                readOnly
                                className="bg-slate-50 border-slate-200"
                            />
                        </div>
                        <Button
                            type="submit"
                            size="sm"
                            className="px-3 bg-blue-600 hover:bg-blue-700 h-10"
                            onClick={handleCopyLink}
                        >
                            {copied ? (
                                <Check className="h-4 w-4" />
                            ) : (
                                <Copy className="h-4 w-4" />
                            )}
                            <span className="sr-only">Copiar</span>
                        </Button>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                        <p className="text-xs text-blue-700 font-medium leading-relaxed">
                            <strong>Nota:</strong> Los proveedores registrados mediante este link aparecerán automáticamente en tu lista para que puedas validar sus datos.
                        </p>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
