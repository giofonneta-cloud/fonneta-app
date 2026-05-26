'use client';

import { useState, useEffect } from 'react';
import { ProvidersTable } from './ProvidersList';
import { AdminInvoicesView } from './AdminInvoicesView';
import { ProviderForm } from './ProviderForm';
import {
    Building2, FileText, CheckCircle2, Clock, AlertCircle,
    TrendingUp, Plus, UserPlus, Copy, Check, X, Info, Mail, Send
} from 'lucide-react';
import { providerService } from '../services/providerService';
import { providerInvoiceService } from '../services/providerInvoiceService';
import { Provider, ProviderInvoice } from '../types/provider.types';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/shared/components/ui/dialog';

export function AdminDashboard() {
    const [activeTab, setActiveTab] = useState<'onboarding' | 'invoices'>('onboarding');
    const [stats, setStats] = useState({
        pendingProviders: 0,
        pendingInvoices: 0,
        approvedAmount: 0,
        returnedCount: 0
    });

    // Form states (moved from ProvidersPage)
    const [showForm, setShowForm] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);
    const [selectedProvider, setSelectedProvider] = useState<Provider | undefined>(undefined);
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [copied, setCopied] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteProviderName, setInviteProviderName] = useState('');
    const [inviteSending, setInviteSending] = useState(false);
    const [inviteMessage, setInviteMessage] = useState('');

    const inviteLink = typeof window !== 'undefined' 
        ? `${window.location.origin}/register/provider`
        : '';

    useEffect(() => {
        loadStats();
    }, [refreshKey]);

    const loadStats = async () => {
        try {
            const [providers, invoices] = await Promise.all([
                providerService.getProviders(),
                providerInvoiceService.getAllInvoices()
            ]);

            const pendingProviders = providers.filter(p => p.onboarding_status === 'EN REVISION').length;
            const pendingInvoices = invoices.filter(i => i.status === 'pendiente' || i.status === 'en_revision').length;
            const approvedAmount = invoices
                .filter(i => i.status === 'aprobado' || i.status === 'pagado')
                .reduce((sum, i) => sum + i.amount, 0);
            const returnedCount = invoices.filter(i => i.status === 'devuelto').length + 
                                  providers.filter(p => p.onboarding_status === 'DEVUELTO').length;

            setStats({
                pendingProviders,
                pendingInvoices,
                approvedAmount,
                returnedCount
            });
        } catch (err) {
            console.error('Error loading dashboard stats:', err);
        }
    };

    const handleCopyLink = () => {
        navigator.clipboard.writeText(inviteLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSendInvitation = async () => {
        if (!inviteEmail || !inviteProviderName) {
            setInviteMessage('Por favor completa todos los campos');
            return;
        }

        setInviteSending(true);
        setInviteMessage('');

        try {
            const response = await fetch('/api/providers/send-invitation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: inviteEmail,
                    providerName: inviteProviderName,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                setInviteMessage(data.error || 'Error al enviar la invitación');
                return;
            }

            setInviteMessage('✓ Invitación enviada exitosamente');
            setInviteEmail('');
            setInviteProviderName('');
            setTimeout(() => {
                setIsInviteModalOpen(false);
                setInviteMessage('');
            }, 2000);
        } catch (error) {
            setInviteMessage('Error al enviar la invitación');
            console.error('Error:', error);
        } finally {
            setInviteSending(false);
        }
    };

    const handleSuccess = () => {
        setShowForm(false);
        setSelectedProvider(undefined);
        setRefreshKey(prev => prev + 1);
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
        <div className="space-y-6 animate-in fade-in duration-700">
            {/* Header - More Compact */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                        <Building2 className="w-8 h-8 text-blue-600 bg-blue-50 p-1.5 rounded-xl" />
                        Proveedores Centro de Control 
                    </h1>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsInviteModalOpen(true)}
                        className="px-4 py-2.5 bg-white border border-blue-100 text-blue-600 rounded-xl font-black text-xs hover:bg-blue-50 transition-all flex items-center gap-2 shadow-sm"
                    >
                        <UserPlus className="w-4 h-4" />
                        Invitar
                    </button>
                    <button
                        onClick={handleCreateNew}
                        className="px-4 py-2.5 bg-blue-600 text-white rounded-xl font-black text-xs hover:bg-blue-700 transition-all flex items-center gap-2 shadow-lg shadow-blue-200 border-b-2 border-blue-800"
                    >
                        <Plus className="w-4 h-4" />
                        Nuevo Registro
                    </button>
                </div>
            </div>

            {/* Stats Grid - Very Compact Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard 
                    icon={Building2} 
                    label="Onboarding" 
                    value={stats.pendingProviders} 
                    color="blue"
                />
                <StatCard 
                    icon={FileText} 
                    label="Facturas Pendientes" 
                    value={stats.pendingInvoices} 
                    color="yellow"
                />
                <StatCard 
                    icon={TrendingUp} 
                    label="Total Aprobado" 
                    value={`$${(stats.approvedAmount / 1000000).toFixed(1)}M`} 
                    color="green"
                />
                <StatCard 
                    icon={AlertCircle} 
                    label="Por Ajustar" 
                    value={stats.returnedCount} 
                    color="orange"
                />
            </div>

            {/* Main Content Area */}
            {showForm ? (
                <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl p-8 relative animate-in zoom-in duration-300">
                    <button 
                        onClick={handleCancel}
                        className="absolute right-6 top-6 p-2 bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-xl transition-all border border-gray-100"
                    >
                        <X className="w-5 h-5" />
                    </button>
                    <ProviderForm
                        key={selectedProvider?.id ?? 'new'}
                        onSuccess={handleSuccess}
                        onCancel={handleCancel}
                        initialData={selectedProvider}
                    />
                </div>
            ) : (
                <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-200/50 overflow-hidden">
                    {/* High-Contrast Tabs */}
                    <div className="flex bg-gray-100/50 p-1.5 gap-1.5">
                        <button
                            onClick={() => setActiveTab('onboarding')}
                            className={`
                                flex-1 py-3.5 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-3 uppercase tracking-widest
                                ${activeTab === 'onboarding' 
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
                                    : 'text-gray-500 hover:text-gray-700 hover:bg-white'}
                            `}
                        >
                            <Building2 className={`w-4 h-4 ${activeTab === 'onboarding' ? 'text-blue-200' : 'text-gray-400'}`} />
                            Validación de Proveedores
                        </button>
                        <button
                            onClick={() => setActiveTab('invoices')}
                            className={`
                                flex-1 py-3.5 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-3 uppercase tracking-widest
                                ${activeTab === 'invoices' 
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
                                    : 'text-gray-500 hover:text-gray-700 hover:bg-white'}
                            `}
                        >
                            <FileText className={`w-4 h-4 ${activeTab === 'invoices' ? 'text-blue-200' : 'text-gray-400'}`} />
                            Radicación de Facturas
                        </button>
                    </div>

                    <div className="p-6 h-full min-h-[500px]">
                        {activeTab === 'onboarding' ? (
                            <div className="animate-in slide-in-from-left duration-500">
                                <ProvidersTable 
                                    key={refreshKey}
                                    onEdit={handleEdit}
                                />
                            </div>
                        ) : (
                            <div className="animate-in slide-in-from-right duration-500">
                                <AdminInvoicesView />
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Invite Modal - Tabs for Link & Email */}
            <Dialog open={isInviteModalOpen} onOpenChange={setIsInviteModalOpen}>
                <DialogContent className="sm:max-w-2xl bg-white rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden">
                    <div className="p-8 pb-5 bg-gradient-to-r from-blue-600 to-violet-600 text-white">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-black italic tracking-tight uppercase">Invitar Proveedor</DialogTitle>
                            <DialogDescription className="text-blue-100 font-bold mt-1 text-sm">
                                Elige entre compartir un enlace o enviar invitación por correo.
                            </DialogDescription>
                        </DialogHeader>
                    </div>

                    <div className="p-8 space-y-8">
                        {/* Link Section */}
                        <div>
                            <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-4">Opción 1: Compartir Enlace</h3>
                            <div className="flex items-center space-x-2">
                                <Input
                                    id="link"
                                    defaultValue={inviteLink}
                                    readOnly
                                    className="bg-gray-50 border-transparent rounded-xl h-12 font-bold text-gray-900 focus:ring-blue-500/20"
                                />
                                <Button
                                    type="submit"
                                    size="sm"
                                    className={`h-12 w-12 rounded-xl transition-all shadow-md ${copied ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                                    onClick={handleCopyLink}
                                >
                                    {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                                </Button>
                            </div>
                        </div>

                        {/* Email Section */}
                        <div className="border-t border-gray-200 pt-8">
                            <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Mail className="w-4 h-4" />
                                Opción 2: Enviar por Correo
                            </h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-black text-gray-600 uppercase tracking-widest block mb-2">
                                        Nombre del Proveedor
                                    </label>
                                    <Input
                                        placeholder="Ej: Juan Pérez o Empresa XYZ"
                                        value={inviteProviderName}
                                        onChange={(e) => setInviteProviderName(e.target.value)}
                                        className="rounded-xl h-11 bg-gray-50 border-gray-200"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-black text-gray-600 uppercase tracking-widest block mb-2">
                                        Correo Electrónico
                                    </label>
                                    <Input
                                        type="email"
                                        placeholder="proveedor@empresa.com"
                                        value={inviteEmail}
                                        onChange={(e) => setInviteEmail(e.target.value)}
                                        className="rounded-xl h-11 bg-gray-50 border-gray-200"
                                    />
                                </div>

                                {inviteMessage && (
                                    <div className={`p-3 rounded-lg text-sm font-bold ${inviteMessage.includes('✓') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                        {inviteMessage}
                                    </div>
                                )}

                                <Button
                                    onClick={handleSendInvitation}
                                    disabled={inviteSending}
                                    className="w-full bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white font-black h-11 rounded-xl shadow-lg flex items-center justify-center gap-2"
                                >
                                    {inviteSending ? (
                                        <>
                                            <div className="animate-spin">⏳</div>
                                            Enviando...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="w-4 h-4" />
                                            Enviar Invitación
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="p-8 pt-0 flex justify-end border-t border-gray-200">
                        <button
                            onClick={() => {
                                setIsInviteModalOpen(false);
                                setInviteEmail('');
                                setInviteProviderName('');
                                setInviteMessage('');
                            }}
                            className="text-gray-400 font-black text-[10px] uppercase tracking-widest hover:text-gray-900 transition-all px-4 py-2"
                        >
                            Cerrar
                        </button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function StatCard({ icon: Icon, label, value, color }: { icon: any, label: string, value: string | number, color: 'blue' | 'yellow' | 'green' | 'orange' }) {
    const colorMap = {
        blue: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100' },
        yellow: { bg: 'bg-yellow-50', text: 'text-yellow-600', border: 'border-yellow-100' },
        green: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-100' },
        orange: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-100' }
    };

    const styles = colorMap[color];

    return (
        <div className={`p-4 bg-white rounded-2xl border ${styles.border} shadow-sm hover:shadow-md transition-all group flex items-center gap-4`}>
            <div className={`w-10 h-10 ${styles.bg} rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}>
                <Icon className={`w-5 h-5 ${styles.text}`} />
            </div>
            <div>
                <div className="text-xl font-black text-gray-900 leading-none tracking-tight">{value}</div>
                <div className="text-[10px] font-black text-gray-400 mt-1 uppercase tracking-wider">{label}</div>
            </div>
        </div>
    );
}

