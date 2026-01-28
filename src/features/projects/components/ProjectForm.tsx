'use client';

import { useState, useEffect } from 'react';
import { Project, ProjectStatus } from '../types/project.types';
import { X, Save, FileText, DollarSign, Image as ImageIcon, User, Plus, Check, Briefcase, LayoutGrid } from 'lucide-react';
import { supabase } from '@/shared/lib/supabase';

interface ProjectFormProps {
    onClose: () => void;
    onSubmit: (project: Omit<Project, 'id' | 'created_at' | 'updated_at'>) => Promise<any>;
}

export function ProjectForm({ onClose, onSubmit }: ProjectFormProps) {
    const [formData, setFormData] = useState({
        name: '',
        client: '',
        client_id: null as string | null,
        service_type: '',
        status: 'brief' as ProjectStatus,
        quotation_number: '',
        items_description: '',
        net_value: 0,
        total_value_with_tax: 0,
        product_image_url: '',
        line_of_business: '',
        brand: '',
        product_name: '',
        budget_income_currency: 'COP',
        budget_expense_currency: 'COP',
    });

    const [clients, setClients] = useState<any[]>([]);
    const [showNewClientForm, setShowNewClientForm] = useState(false);
    const [newClientName, setNewClientName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchClients();
    }, []);

    const fetchClients = async () => {
        // Fetch entities that are marked as clients
        const { data } = await supabase
            .from('providers')
            .select('*')
            .eq('is_client', true)
            .order('business_name');
        if (data) setClients(data);
    };

    const handleCreateClient = async () => {
        if (!newClientName.trim()) return;

        // Insert into providers table but mark as client
        const { data, error } = await supabase
            .from('providers')
            .insert({
                business_name: newClientName,
                is_client: true,
                is_provider: false // Initially just a client
            })
            .select()
            .single();

        if (!error && data) {
            setClients(prev => [...prev, data].sort((a, b) => a.business_name.localeCompare(b.business_name)));
            setFormData({ ...formData, client: data.business_name, client_id: data.id });
            setNewClientName('');
            setShowNewClientForm(false);
        } else if (error) {
            console.error('Error creating client:', error);
        }
    };

    const handleClientChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedClientId = e.target.value;
        const selectedClient = clients.find(c => c.id === selectedClientId);
        
        if (selectedClientId && selectedClient) {
            setFormData({
                ...formData,
                client: selectedClient.business_name,
                client_id: selectedClientId
            });
        } else {
             setFormData({
                ...formData,
                client: '',
                client_id: null
            });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        console.log("🚀 Submitting project with data:", formData);

        try {
            const projectName = formData.name || `${formData.line_of_business} - ${formData.brand} - ${formData.product_name}`;

            await onSubmit({
                ...formData,
                name: projectName,
                budget_income: formData.total_value_with_tax,
                budget_expense: formData.net_value * 0.7,
                start_date: new Date().toISOString(),
                deadline: null,
                pm_id: null,
            });
            onClose();
        } catch (error: any) {
            console.error('❌ Error creating project:', error);
            console.error('Error details:', JSON.stringify(error, null, 2));
            alert(`Error al crear proyecto: ${error.message || JSON.stringify(error)}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-gray-100 flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/80 backdrop-blur-sm sticky top-0 z-10">
                    <div>
                        <h2 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                            <div className="p-2 bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-200">
                                <Plus className="w-5 h-5" />
                            </div>
                            Nuevo Proyecto
                        </h2>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1 ml-12">Configuración Inicial & Presupuesto</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white rounded-xl transition-colors text-gray-400 hover:text-gray-600 border border-transparent hover:border-gray-200">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar p-8">
                    
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        
                        {/* Left Column: Core Info */}
                        <div className="lg:col-span-7 space-y-8">
                            
                            {/* Section: Business Definition */}
                            <div className="space-y-4">
                                <h3 className="flex items-center gap-2 text-sm font-black text-gray-900 uppercase tracking-wider">
                                    <Briefcase className="w-4 h-4 text-blue-600" />
                                    Definición del Negocio
                                </h3>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Línea de Negocio</label>
                                        <div className="relative">
                                            <select
                                                required
                                                className="w-full pl-4 pr-10 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-bold text-gray-800 appearance-none cursor-pointer hover:bg-white"
                                                value={formData.line_of_business}
                                                onChange={e => setFormData({ ...formData, line_of_business: e.target.value })}
                                            >
                                                <option value="">SELECCIONAR...</option>
                                                <option value="REVISTAS">REVISTAS</option>
                                                <option value="EVENTOS">EVENTOS</option>
                                                <option value="DIGITAL">DIGITAL</option>
                                                <option value="BTL">BTL</option>
                                            </select>
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                                                <LayoutGrid className="w-4 h-4" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Marca</label>
                                        <input
                                            type="text"
                                            required
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-bold text-gray-800 placeholder:text-gray-300 hover:bg-white"
                                            placeholder="Ej. Disuiza"
                                            value={formData.brand}
                                            onChange={e => setFormData({ ...formData, brand: e.target.value })}
                                        />
                                    </div>
                                    
                                    <div className="md:col-span-2 space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Producto / Campaña</label>
                                        <input
                                            type="text"
                                            required
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-bold text-gray-800 placeholder:text-gray-300 hover:bg-white"
                                            placeholder="Ej. Content + Wish List Diciembre"
                                            value={formData.product_name}
                                            onChange={e => setFormData({ ...formData, product_name: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <hr className="border-gray-100" />

                            {/* Section: Client & Details */}
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <h3 className="flex items-center gap-2 text-sm font-black text-gray-900 uppercase tracking-wider">
                                        <User className="w-4 h-4 text-blue-600" />
                                        Información del Cliente
                                    </h3>
                                    {!showNewClientForm && (
                                        <button
                                            type="button"
                                            onClick={() => setShowNewClientForm(true)}
                                            className="text-[10px] font-black text-blue-600 hover:text-blue-800 uppercase flex items-center gap-1 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
                                        >
                                            <Plus className="w-3 h-3" /> Nuevo Cliente
                                        </button>
                                    )}
                                </div>

                                <div className="space-y-4">
                                    {showNewClientForm ? (
                                        <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 animate-in slide-in-from-top-2">
                                            <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2 block">Nombre del Nuevo Cliente</label>
                                            <div className="flex gap-2">
                                                <input
                                                    autoFocus
                                                    className="flex-1 px-4 py-3 bg-white border border-blue-200 rounded-xl outline-none font-bold text-gray-800 focus:ring-2 focus:ring-blue-500/20"
                                                    placeholder="Razón Social / Nombre Comercial"
                                                    value={newClientName}
                                                    onChange={e => setNewClientName(e.target.value)}
                                                    onKeyDown={e => e.key === 'Enter' && handleCreateClient()}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={handleCreateClient}
                                                    className="px-6 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold shadow-lg shadow-blue-200 transition-all active:scale-95"
                                                >
                                                    Crear
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setShowNewClientForm(false)}
                                                    className="px-4 bg-white text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 font-bold"
                                                >
                                                    <X className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <select
                                                required
                                                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-bold text-gray-800 hover:bg-white"
                                                value={formData.client_id || ''}
                                                onChange={handleClientChange}
                                            >
                                                <option value="">SELECCIONAR CLIENTE EXISTENTE...</option>
                                                {clients.map(c => (
                                                    <option key={c.id} value={c.id}>{c.business_name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">No. Cotización</label>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-bold text-gray-800 placeholder:text-gray-300 hover:bg-white"
                                                    placeholder="COT-000"
                                                    value={formData.quotation_number}
                                                    onChange={e => setFormData({ ...formData, quotation_number: e.target.value })}
                                                />
                                                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Financials & Visuals */}
                        <div className="lg:col-span-5 space-y-8">
                            
                            {/* Section: Financials */}
                            <div className="p-6 bg-slate-50 border border-slate-100 rounded-3xl space-y-4">
                                <h3 className="flex items-center gap-2 text-sm font-black text-slate-900 uppercase tracking-wider">
                                    <DollarSign className="w-4 h-4 text-emerald-600" />
                                    Presupuesto
                                </h3>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Valor Venta (Antes IVA)</label>
                                        <div className="relative group">
                                            <input
                                                type="number"
                                                required
                                                min="0"
                                                className="w-full pl-4 pr-12 py-4 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all font-black text-xl text-slate-900 group-hover:border-emerald-300"
                                                value={formData.net_value || ''}
                                                onChange={e => {
                                                    const val = parseFloat(e.target.value) || 0;
                                                    setFormData({ ...formData, net_value: val, total_value_with_tax: val * 1.19 });
                                                }}
                                                placeholder="0"
                                            />
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">COP</span>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Total con IVA (Estimado)</label>
                                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">19%</span>
                                        </div>
                                        <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl">
                                            <span className="block text-2xl font-black text-emerald-700">
                                                {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(formData.total_value_with_tax)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Section: Visuals */}
                            <div className="space-y-4">
                                <h3 className="flex items-center gap-2 text-sm font-black text-gray-900 uppercase tracking-wider">
                                    <ImageIcon className="w-4 h-4 text-blue-600" />
                                    Visualización
                                </h3>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Imagen de Portada (URL)</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-bold text-gray-800 placeholder:text-gray-300 text-sm hover:bg-white"
                                        placeholder="https://..."
                                        value={formData.product_image_url}
                                        onChange={e => setFormData({ ...formData, product_image_url: e.target.value })}
                                    />
                                    {formData.product_image_url && (
                                        <div className="mt-2 h-32 w-full rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
                                            <img 
                                                src={formData.product_image_url} 
                                                alt="Preview" 
                                                className="w-full h-full object-cover"
                                                onError={(e) => (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x200?text=Error+Loading+Image'}
                                            />
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Descripción del Alcance</label>
                                    <textarea
                                        rows={4}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium text-gray-800 placeholder:text-gray-400 text-sm resize-none hover:bg-white"
                                        placeholder="Detalla qué incluye este proyecto..."
                                        value={formData.items_description}
                                        onChange={e => setFormData({ ...formData, items_description: e.target.value })}
                                    />
                                </div>
                            </div>

                        </div>
                    </div>
                </form>

                {/* Footer Actions */}
                <div className="px-8 py-6 bg-white border-t border-gray-100 flex justify-end gap-4 sticky bottom-0 z-10">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-8 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-all uppercase tracking-wide text-sm"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting || !formData.line_of_business || !formData.client_id}
                        className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-3 rounded-xl font-bold text-sm transition-all shadow-lg shadow-blue-200 hover:shadow-xl hover:translate-y-[-1px] active:translate-y-0 flex items-center justify-center gap-2 uppercase tracking-wide"
                    >
                        {isSubmitting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-5 h-5" />}
                        Crear Proyecto
                    </button>
                </div>
            </div>
        </div>
    );
}
