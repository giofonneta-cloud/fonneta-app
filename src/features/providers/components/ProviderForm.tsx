'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/shared/components/ui/form';
import { Input } from '@/shared/components/ui/input';
import { Button } from '@/shared/components/ui/button';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Building2, User, Mail, Phone, FileText, MapPin, Upload, Info, Tag, X } from 'lucide-react';
import { providerService } from '../services/providerService';
import { COLOMBIA_DEPARTMENTS, COLOMBIA_CITIES_BY_DEPT } from '@/shared/lib/colombia-data';
import { Textarea } from '@/shared/components/ui/textarea';
import { cn } from '@/shared/lib/utils';
import { ExternalLink } from 'lucide-react';
import { useParametros } from '@/features/admin/hooks/useParametros';

const providerFormSchema = z.object({
    business_name: z.string().min(3, "Mínimo 3 caracteres"),
    person_type: z.enum(['natural', 'juridica']).optional(),
    document_type: z.enum(['nit', 'cedula_ciudadania', 'cedula_extranjeria', 'pasaporte']).optional(),
    document_number: z.string().optional(),
    contact_name: z.string().optional(),
    contact_email: z.string().email("Email inválido").optional().or(z.literal('')),
    contact_phone: z.string().optional(),
    billing_email: z.string().email("Email inválido").optional().or(z.literal('')),
    address: z.string().optional(),
    city: z.string().optional(),
    department: z.string().optional(),
    country: z.string().optional(),
    is_client: z.boolean().default(false),
    is_provider: z.boolean().default(true),
    onboarding_status: z.enum(['EN REVISION', 'DEVUELTO', 'VALIDADO']).optional(),
    onboarding_notes: z.string().optional(),
});

type ProviderFormValues = z.infer<typeof providerFormSchema>;

import { Provider, CreateProviderInput } from '../types/provider.types';

interface ProviderFormProps {
    onSuccess?: () => void;
    onCancel?: () => void;
    initialData?: Provider;
}

export function ProviderForm({ onSuccess, onCancel, initialData }: ProviderFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { opciones: estadosOnboarding } = useParametros('estados_onboarding');
    const [documentFiles, setDocumentFiles] = useState<{
        rut?: File;
        camara?: File;
        cedula_rep?: File;
        bancaria?: File;
    }>({});
    const [docUrls, setDocUrls] = useState<{
        rut: string | null;
        camara: string | null;
        cedula_rep: string | null;
        bancaria: string | null;
    }>({
        rut: initialData?.rut_url ?? null,
        camara: initialData?.camara_comercio_url ?? null,
        cedula_rep: initialData?.cedula_url ?? null,
        bancaria: initialData?.cert_bancaria_url ?? null,
    });
    const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);
    const [localTags, setLocalTags] = useState<string[]>(initialData?.tags ?? []);
    const [tagInput, setTagInput] = useState('');

    const addTag = () => {
        const tag = tagInput.trim();
        if (!tag || localTags.includes(tag)) return;
        setLocalTags(prev => [...prev, tag]);
        setTagInput('');
    };
    const removeTag = (tag: string) => setLocalTags(prev => prev.filter(t => t !== tag));

    const TAG_COLORS = [
        'bg-blue-50 text-blue-700 border-blue-200',
        'bg-purple-50 text-purple-700 border-purple-200',
        'bg-emerald-50 text-emerald-700 border-emerald-200',
        'bg-amber-50 text-amber-700 border-amber-200',
        'bg-rose-50 text-rose-700 border-rose-200',
        'bg-indigo-50 text-indigo-700 border-indigo-200',
        'bg-teal-50 text-teal-700 border-teal-200',
    ];
    const getTagColor = (tag: string) => {
        let hash = 0;
        for (let i = 0; i < tag.length; i++) hash = tag.charCodeAt(i) + ((hash << 5) - hash);
        return TAG_COLORS[Math.abs(hash) % TAG_COLORS.length];
    };

    const fileInputRefs = {
        rut: React.useRef<HTMLInputElement>(null),
        camara: React.useRef<HTMLInputElement>(null),
        cedula_rep: React.useRef<HTMLInputElement>(null),
        bancaria: React.useRef<HTMLInputElement>(null),
    };


    const form = useForm<ProviderFormValues>({
        resolver: zodResolver(providerFormSchema) as any,
        defaultValues: {
            business_name: initialData?.business_name || '',
            person_type: initialData?.person_type || undefined,
            document_type: initialData?.document_type || undefined,
            document_number: initialData?.document_number || '',
            contact_name: initialData?.contact_name || '',
            contact_email: initialData?.contact_email || '',
            contact_phone: initialData?.contact_phone || '',
            billing_email: initialData?.billing_email || '',
            address: initialData?.address || '',
            city: initialData?.city || '',
            department: initialData?.department || '',
            country: initialData?.country || 'Colombia',
            is_client: initialData?.is_client ?? false,
            is_provider: initialData?.is_provider ?? true,
            onboarding_status: initialData?.onboarding_status || 'EN REVISION',
            onboarding_notes: initialData?.onboarding_notes || '',
        },
    });

    const personType = form.watch('person_type');
    const country = form.watch('country');
    const departmentName = form.watch('department');
    const onboardingStatus = form.watch('onboarding_status');

    const handleFileSelect = (type: 'rut' | 'camara' | 'cedula_rep' | 'bancaria') => (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            setDocumentFiles(prev => ({ ...prev, [type]: e.target.files![0] }));
        }
    };


    const onSubmit = async (values: ProviderFormValues) => {
        setIsSubmitting(true);
        try {
            let providerId = initialData?.id;

            if (initialData) {
                await providerService.updateProvider(initialData.id, { ...values, tags: localTags });
            } else {
                const newProvider = await providerService.createProvider({ ...values, tags: localTags });
                providerId = newProvider.id;
            }

            if (providerId) {
                const docMap = [
                    { key: 'rut' as const, type: 'RUT', column: 'rut_url', file: documentFiles.rut },
                    { key: 'camara' as const, type: 'Camara_Comercio', column: 'camara_comercio_url', file: documentFiles.camara },
                    { key: 'cedula_rep' as const, type: 'Cedula_Rep_Legal', column: 'cedula_url', file: documentFiles.cedula_rep },
                    { key: 'bancaria' as const, type: 'Cert_Bancaria', column: 'cert_bancaria_url', file: documentFiles.bancaria },
                ];

                const urlUpdates: Record<string, string> = {};
                for (const doc of docMap) {
                    if (!doc.file) continue;
                    setUploadingDoc(doc.type);
                    const fd = new FormData();
                    fd.append('file', doc.file);
                    fd.append('providerId', providerId);
                    fd.append('providerName', values.business_name);
                    fd.append('providerNIT', values.document_number || '');
                    fd.append('documentType', doc.type);

                    const res = await fetch('/api/providers/upload-document', { method: 'POST', body: fd });
                    if (!res.ok) {
                        const err = await res.json() as { error?: string };
                        throw new Error(err.error || `Error subiendo ${doc.type}`);
                    }
                    const { webViewLink } = await res.json() as { webViewLink: string };
                    urlUpdates[doc.column] = webViewLink;
                    setDocUrls(prev => ({ ...prev, [doc.key]: webViewLink }));
                }
                setUploadingDoc(null);

                if (Object.keys(urlUpdates).length > 0) {
                    const patchRes = await fetch('/api/providers/create', {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ providerId, ...urlUpdates }),
                    });
                    if (!patchRes.ok) {
                        const err = await patchRes.json() as { error?: string };
                        throw new Error(err.error || 'Error guardando URLs de documentos');
                    }
                }
            }

            form.reset();
            setDocumentFiles({});
            setLocalTags([]);
            setTagInput('');
            onSuccess?.();
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : 'Error desconocido';
            console.error('Error saving provider:', error);
            alert(`Error al guardar: ${msg}`);
        } finally {
            setIsSubmitting(false);
            setUploadingDoc(null);
        }
    };

    return (
        <Card className="max-w-4xl mx-auto shadow-xl border-slate-200">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
                <div className="flex items-center gap-3">
                    <User className="w-8 h-8" />
                    <div>
                        <CardTitle className="text-2xl font-bold">
                            {initialData ? 'Editar Proveedor/Cliente' : 'Nuevo Proveedor/Cliente'}
                        </CardTitle>
                        <p className="text-blue-100 opacity-90">
                            {initialData ? 'Actualiza la información del registro' : 'Completa el formulario para registrar un nuevo proveedor o cliente'}
                        </p>
                    </div>
                </div>
            </CardHeader>
            
            <CardContent className="p-8">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
{/* Información del Proveedor/Cliente */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-2 mb-4">
                                <Building2 className="w-5 h-5 text-blue-600" />
                                <h3 className="text-lg font-bold text-slate-800">Información del Proveedor/Cliente</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField
                                    control={form.control}
                                    name="business_name"
                                    render={({ field }) => (
                                        <FormItem className="md:col-span-2">
                                            <FormLabel className="text-sm font-bold text-slate-700">
                                                Nombre del Proveedor/Cliente *
                                            </FormLabel>
                                            <FormControl>
                                                <Input {...field} placeholder="Ej: Diseños Creativos SAS" className="bg-white" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="person_type"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-sm font-bold text-slate-700">Tipo de Persona</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="bg-white">
                                                        <SelectValue placeholder="Selecciona tipo" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="natural">Natural</SelectItem>
                                                    <SelectItem value="juridica">Jurídica</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="document_type"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-sm font-bold text-slate-700">Tipo de Documento</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="bg-white">
                                                        <SelectValue placeholder="Selecciona tipo" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="nit">NIT</SelectItem>
                                                    <SelectItem value="cedula_ciudadania">Cédula de Ciudadanía</SelectItem>
                                                    <SelectItem value="cedula_extranjeria">Cédula de Extranjería</SelectItem>
                                                    <SelectItem value="pasaporte">Pasaporte</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="document_number"
                                    render={({ field }) => (
                                        <FormItem className="md:col-span-2">
                                            <FormLabel className="text-sm font-bold text-slate-700">Número de Documento / NIT</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <FileText className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                                                    <Input {...field} placeholder="900123456-7" className="pl-10 bg-white" />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </section>

                        {/* Información de Contacto */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-2 mb-4">
                                <User className="w-5 h-5 text-emerald-600" />
                                <h3 className="text-lg font-bold text-slate-800">Información de Contacto</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField
                                    control={form.control}
                                    name="contact_name"
                                    render={({ field }) => (
                                        <FormItem className="md:col-span-2">
                                            <FormLabel className="text-sm font-bold text-slate-700">Nombre de Contacto</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                                                    <Input {...field} placeholder="Juan Pérez" className="pl-10 bg-white" />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="contact_email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-sm font-bold text-slate-700">Email de Contacto</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                                                    <Input {...field} type="email" placeholder="contacto@empresa.com" className="pl-10 bg-white" />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="contact_phone"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-sm font-bold text-slate-700">Teléfono</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <Phone className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                                                    <Input {...field} placeholder="+57 300 123 4567" className="pl-10 bg-white" />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="billing_email"
                                    render={({ field }) => (
                                        <FormItem className="md:col-span-2">
                                            <FormLabel className="text-sm font-bold text-slate-700">Email de Facturación</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                                                    <Input {...field} type="email" placeholder="facturacion@empresa.com" className="pl-10 bg-white" />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </section>

                        {/* Ubicación */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-2 mb-4">
                                <MapPin className="w-5 h-5 text-purple-600" />
                                <h3 className="text-lg font-bold text-slate-800">Ubicación</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField
                                    control={form.control}
                                    name="country"
                                    render={({ field }) => (
                                        <FormItem className="md:col-span-2">
                                            <FormLabel className="text-sm font-bold text-slate-700">País</FormLabel>
                                            <Select onValueChange={(val) => {
                                                field.onChange(val);
                                                form.setValue('department', '');
                                                form.setValue('city', '');
                                            }} value={field.value || 'Colombia'}>
                                                <FormControl>
                                                    <SelectTrigger className="bg-white">
                                                        <SelectValue placeholder="Selecciona país" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="Colombia">Colombia</SelectItem>
                                                    <SelectItem value="México">México</SelectItem>
                                                    <SelectItem value="España">España</SelectItem>
                                                    <SelectItem value="USA">USA</SelectItem>
                                                    <SelectItem value="Otro">Otro</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="address"
                                    render={({ field }) => (
                                        <FormItem className="md:col-span-2">
                                            <FormLabel className="text-sm font-bold text-slate-700">Dirección</FormLabel>
                                            <FormControl>
                                                <Input {...field} placeholder="Calle 123 # 45-67" className="bg-white" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="department"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-sm font-bold text-slate-700">Departamento / Estado</FormLabel>
                                            {country === 'Colombia' ? (
                                                <Select onValueChange={(val) => {
                                                    field.onChange(val);
                                                    form.setValue('city', '');
                                                }} value={field.value || ''}>
                                                    <FormControl>
                                                        <SelectTrigger className="bg-white">
                                                            <SelectValue placeholder="Selecciona departamento" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {COLOMBIA_DEPARTMENTS.map(dept => (
                                                            <SelectItem key={dept.id} value={dept.name}>{dept.name}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            ) : (
                                                <FormControl>
                                                    <Input {...field} placeholder="Cundinamarca" className="bg-white" />
                                                </FormControl>
                                            )}
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="city"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-sm font-bold text-slate-700">Ciudad / Municipio</FormLabel>
                                            {country === 'Colombia' && departmentName ? (
                                                <Select onValueChange={field.onChange} value={field.value || ''}>
                                                    <FormControl>
                                                        <SelectTrigger className="bg-white">
                                                            <SelectValue placeholder="Selecciona municipio" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {COLOMBIA_CITIES_BY_DEPT[COLOMBIA_DEPARTMENTS.find(d => d.name === departmentName)?.id || '']?.map(city => (
                                                            <SelectItem key={city} value={city}>{city}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            ) : (
                                                <FormControl>
                                                    <Input {...field} placeholder="Bogotá" className="bg-white" disabled={country === 'Colombia' && !departmentName} />
                                                </FormControl>
                                            )}
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </section>

                        {/* Documentos */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-2 mb-4">
                                <Upload className="w-5 h-5 text-orange-600" />
                                <h3 className="text-lg font-bold text-slate-800">Documentos Requeridos</h3>
                            </div>
                            <div className="grid grid-cols-1 gap-4 bg-slate-50 p-6 rounded-lg border border-slate-200">
                                {/* RUT */}
                                <div className="flex items-center justify-between p-3 bg-white rounded border border-slate-200">
                                    <div className="flex items-center gap-3">
                                        <FileText className="w-5 h-5 text-blue-600" />
                                        <div>
                                            <p className="font-bold text-sm text-slate-700">RUT Actualizado</p>
                                            <p className="text-xs text-slate-500">Formato PDF</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {docUrls.rut && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="text-blue-600 hover:text-blue-700"
                                                onClick={() => window.open(docUrls.rut!, '_blank')}
                                            >
                                                <ExternalLink className="w-4 h-4 mr-1" /> Abrir
                                            </Button>
                                        )}
                                        {uploadingDoc === 'RUT' && <span className="text-xs text-amber-600 font-medium">Subiendo...</span>}
                                        {documentFiles.rut && uploadingDoc !== 'RUT' && <span className="text-xs text-green-600 font-medium">Listo para subir</span>}
                                        <input
                                            type="file"
                                            accept=".pdf"
                                            onChange={handleFileSelect('rut')}
                                            className="hidden"
                                            ref={fileInputRefs.rut}
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => fileInputRefs.rut.current?.click()}
                                        >
                                            {docUrls.rut ? 'Actualizar' : 'Subir'}
                                        </Button>
                                    </div>
                                </div>

                                {/* Cámara de Comercio */}
                                {personType === 'juridica' && (
                                    <div className="flex items-center justify-between p-3 bg-white rounded border border-slate-200">
                                        <div className="flex items-center gap-3">
                                            <Building2 className="w-5 h-5 text-indigo-600" />
                                            <div>
                                                <p className="font-bold text-sm text-slate-700">Cámara de Comercio</p>
                                                <p className="text-xs text-slate-500">Max 30 días de vigencia</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {docUrls.camara && (
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-blue-600 hover:text-blue-700"
                                                    onClick={() => window.open(docUrls.camara!, '_blank')}
                                                >
                                                    <ExternalLink className="w-4 h-4 mr-1" /> Abrir
                                                </Button>
                                            )}
                                            {uploadingDoc === 'Camara_Comercio' && <span className="text-xs text-amber-600 font-medium">Subiendo...</span>}
                                            {documentFiles.camara && uploadingDoc !== 'Camara_Comercio' && <span className="text-xs text-green-600 font-medium">Listo para subir</span>}
                                            <input
                                                type="file"
                                                accept=".pdf"
                                                onChange={handleFileSelect('camara')}
                                                className="hidden"
                                                ref={fileInputRefs.camara}
                                            />
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => fileInputRefs.camara.current?.click()}
                                            >
                                                {docUrls.camara ? 'Actualizar' : 'Subir'}
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {/* Cédula Representante Legal */}
                                <div className="flex items-center justify-between p-3 bg-white rounded border border-slate-200">
                                    <div className="flex items-center gap-3">
                                        <User className="w-5 h-5 text-emerald-600" />
                                        <div>
                                            <p className="font-bold text-sm text-slate-700">Cédula Rep. Legal</p>
                                            <p className="text-xs text-slate-500">Ambas caras</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {docUrls.cedula_rep && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="text-blue-600 hover:text-blue-700"
                                                onClick={() => window.open(docUrls.cedula_rep!, '_blank')}
                                            >
                                                <ExternalLink className="w-4 h-4 mr-1" /> Abrir
                                            </Button>
                                        )}
                                        {uploadingDoc === 'Cedula_Rep_Legal' && <span className="text-xs text-amber-600 font-medium">Subiendo...</span>}
                                        {documentFiles.cedula_rep && uploadingDoc !== 'Cedula_Rep_Legal' && <span className="text-xs text-green-600 font-medium">Listo para subir</span>}
                                        <input
                                            type="file"
                                            accept=".pdf,.png,.jpg,.jpeg"
                                            onChange={handleFileSelect('cedula_rep')}
                                            className="hidden"
                                            ref={fileInputRefs.cedula_rep}
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => fileInputRefs.cedula_rep.current?.click()}
                                        >
                                            {docUrls.cedula_rep ? 'Actualizar' : 'Subir'}
                                        </Button>
                                    </div>
                                </div>

                                {/* Certificación Bancaria */}
                                <div className="flex items-center justify-between p-3 bg-white rounded border border-slate-200">
                                    <div className="flex items-center gap-3">
                                        <FileText className="w-5 h-5 text-purple-600" />
                                        <div>
                                            <p className="font-bold text-sm text-slate-700">Certificación Bancaria</p>
                                            <p className="text-xs text-slate-500">Opcional</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {docUrls.bancaria && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="text-blue-600 hover:text-blue-700"
                                                onClick={() => window.open(docUrls.bancaria!, '_blank')}
                                            >
                                                <ExternalLink className="w-4 h-4 mr-1" /> Abrir
                                            </Button>
                                        )}
                                        {uploadingDoc === 'Cert_Bancaria' && <span className="text-xs text-amber-600 font-medium">Subiendo...</span>}
                                        {documentFiles.bancaria && uploadingDoc !== 'Cert_Bancaria' && <span className="text-xs text-green-600 font-medium">Listo para subir</span>}
                                        <input
                                            type="file"
                                            accept=".pdf"
                                            onChange={handleFileSelect('bancaria')}
                                            className="hidden"
                                            ref={fileInputRefs.bancaria}
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => fileInputRefs.bancaria.current?.click()}
                                        >
                                            {docUrls.bancaria ? 'Actualizar' : 'Subir'}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </section>


                        {/* Tipo de Relación */}
                        <section className="space-y-4">
                            <h3 className="text-lg font-bold text-slate-800">Tipo de Relación</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg border">
                                <FormField
                                    control={form.control}
                                    name="is_provider"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                            <FormControl>
                                                <Checkbox
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                />
                                            </FormControl>
                                            <div className="space-y-1 leading-none">
                                                <FormLabel className="text-sm font-bold text-slate-700">
                                                    Es Proveedor
                                                </FormLabel>
                                                <FormDescription className="text-xs text-slate-500">
                                                    Nos provee servicios o productos
                                                </FormDescription>
                                            </div>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="is_client"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                            <FormControl>
                                                <Checkbox
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                />
                                            </FormControl>
                                            <div className="space-y-1 leading-none">
                                                <FormLabel className="text-sm font-bold text-slate-700">
                                                    Es Cliente
                                                </FormLabel>
                                                <FormDescription className="text-xs text-slate-500">
                                                    Le vendemos servicios o productos
                                                </FormDescription>
                                            </div>
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </section>

                        {/* Etiquetas */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-2 mb-4">
                                <Tag className="w-5 h-5 text-violet-600" />
                                <h3 className="text-lg font-bold text-slate-800">Etiquetas</h3>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={tagInput}
                                        onChange={e => setTagInput(e.target.value)}
                                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                                        placeholder="Ej: VIP, Frecuente, Prioritario..."
                                        className="flex-1 px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-colors placeholder:text-slate-300"
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={addTag}
                                        disabled={!tagInput.trim()}
                                        className="shrink-0"
                                    >
                                        Agregar
                                    </Button>
                                </div>
                                {localTags.length > 0 ? (
                                    <div className="flex flex-wrap gap-1.5">
                                        {localTags.map(tag => (
                                            <span
                                                key={tag}
                                                className={cn('inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border', getTagColor(tag))}
                                            >
                                                {tag}
                                                <button
                                                    type="button"
                                                    onClick={() => removeTag(tag)}
                                                    className="hover:opacity-60 transition-opacity"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-xs text-slate-400">Sin etiquetas. Agrega para clasificar este registro.</p>
                                )}
                            </div>
                        </section>

                        {/* Estado del Registro (Solo visible para admin/edición) */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-2 mb-4">
                                <Info className="w-5 h-5 text-blue-600" />
                                <h3 className="text-lg font-bold text-slate-800">Estado del Registro</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-lg border">
                                <FormField
                                    control={form.control}
                                    name="onboarding_status"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-sm font-bold text-slate-700">Estado</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className={cn(
                                                        "bg-white font-bold",
                                                        field.value === 'VALIDADO' && "text-green-700 border-green-200",
                                                        field.value === 'DEVUELTO' && "text-orange-700 border-orange-200",
                                                        field.value === 'EN REVISION' && "text-blue-700 border-blue-200"
                                                    )}>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {estadosOnboarding.map(o => (
                                                        <SelectItem key={o.valor} value={o.valor}>{o.etiqueta}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="onboarding_notes"
                                    render={({ field }) => (
                                        <FormItem className="md:col-span-2">
                                            <FormLabel className="text-sm font-bold text-slate-700">Notas de Retroalimentación / Observaciones</FormLabel>
                                            <FormControl>
                                                <Textarea 
                                                    {...field} 
                                                    placeholder="Registra observaciones sobre este proveedor o explica qué debe corregir..." 
                                                    className="bg-white min-h-[100px]"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </section>

                        <div className="flex justify-end gap-4 pt-6 border-t">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    form.reset();
                                    form.reset();
                                    setDocumentFiles({});
                                    onCancel?.();
                                }}
                                className="px-8"
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="px-12 bg-blue-600 hover:bg-blue-700 text-white font-bold"
                            >
                                {isSubmitting ? "Guardando..." : "Guardar"}
                            </Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
