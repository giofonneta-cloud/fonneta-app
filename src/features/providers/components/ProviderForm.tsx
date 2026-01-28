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
import { Building2, User, Mail, Phone, FileText, MapPin, Globe, Upload } from 'lucide-react';
import { providerService } from '../services/providerService';

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
});

type ProviderFormValues = z.infer<typeof providerFormSchema>;

import { Provider, CreateProviderInput } from '../types/provider.types';

// ... (previous imports)

interface ProviderFormProps {
    onSuccess?: () => void;
    onCancel?: () => void;
    initialData?: Provider;
}

export function ProviderForm({ onSuccess, onCancel, initialData }: ProviderFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [documentFiles, setDocumentFiles] = useState<{
        rut?: File;
        camara?: File;
        cedula_rep?: File;
        bancaria?: File;
    }>({});


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
        },
    });

    const personType = form.watch('person_type');

    const handleFileSelect = (type: 'rut' | 'camara' | 'cedula_rep' | 'bancaria') => (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            setDocumentFiles(prev => ({ ...prev, [type]: e.target.files![0] }));
        }
    };


    const onSubmit = async (values: ProviderFormValues) => {
        setIsSubmitting(true);
        try {
            if (initialData) {
                await providerService.updateProvider(initialData.id, values);
            } else {
                await providerService.createProvider(values);
            }
            // TODO: Upload documents to storage (enhanced logic needed for updates)
            form.reset();
            form.reset();
            setDocumentFiles({});
            onSuccess?.();
        } catch (error) {
            console.error("Error saving provider:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Card className="max-w-4xl mx-auto shadow-xl border-slate-200">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-lg">
                        <Building2 className="w-6 h-6" />
                    </div>
                    <div>
                        <CardTitle className="text-2xl font-bold">
                            {initialData ? 'Editar Proveedor/Cliente' : 'Nuevo Proveedor/Cliente'}
                        </CardTitle>
                        <p className="text-sm text-blue-100 mt-1">
                            {initialData ? 'Actualiza los datos del proveedor o cliente' : 'Registra un nuevo proveedor o cliente en el sistema'}
                        </p>
                    </div>
                </div>
            </CardHeader>
// ... rest of the component
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
                                    name="city"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-sm font-bold text-slate-700">Ciudad</FormLabel>
                                            <FormControl>
                                                <Input {...field} placeholder="Bogotá" className="bg-white" />
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
                                            <FormLabel className="text-sm font-bold text-slate-700">Departamento</FormLabel>
                                            <FormControl>
                                                <Input {...field} placeholder="Cundinamarca" className="bg-white" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="country"
                                    render={({ field }) => (
                                        <FormItem className="md:col-span-2">
                                            <FormLabel className="text-sm font-bold text-slate-700">País</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <Globe className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                                                    <Input {...field} placeholder="Colombia" className="pl-10 bg-white" />
                                                </div>
                                            </FormControl>
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
                                {/* RUT - Obligatorio para todos (implícito) */}
                                <div className="flex items-center justify-between p-3 bg-white rounded border border-slate-200">
                                    <div className="flex items-center gap-3">
                                        <FileText className="w-5 h-5 text-blue-600" />
                                        <div>
                                            <p className="font-bold text-sm text-slate-700">RUT Actualizado</p>
                                            <p className="text-xs text-slate-500">Formato PDF</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {documentFiles.rut && <span className="text-xs text-green-600 font-medium">Cargado</span>}
                                        <input
                                            type="file"
                                            accept=".pdf"
                                            onChange={handleFileSelect('rut')}
                                            className="hidden"
                                            id="upload-rut"
                                        />
                                        <label htmlFor="upload-rut">
                                            <Button type="button" variant="outline" size="sm" className="cursor-pointer">
                                                {documentFiles.rut ? 'Cambiar' : 'Subir'}
                                            </Button>
                                        </label>
                                    </div>
                                </div>

                                {/* Cámara de Comercio - Solo Jurídicas */}
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
                                            {documentFiles.camara && <span className="text-xs text-green-600 font-medium">Cargado</span>}
                                            <input
                                                type="file"
                                                accept=".pdf"
                                                onChange={handleFileSelect('camara')}
                                                className="hidden"
                                                id="upload-camara"
                                            />
                                            <label htmlFor="upload-camara">
                                                <Button type="button" variant="outline" size="sm" className="cursor-pointer">
                                                    {documentFiles.camara ? 'Cambiar' : 'Subir'}
                                                </Button>
                                            </label>
                                        </div>
                                    </div>
                                )}

                                {/* Cédula Representante Legal - Obligatorio Todos */}
                                <div className="flex items-center justify-between p-3 bg-white rounded border border-slate-200">
                                    <div className="flex items-center gap-3">
                                        <User className="w-5 h-5 text-emerald-600" />
                                        <div>
                                            <p className="font-bold text-sm text-slate-700">Cédula Rep. Legal</p>
                                            <p className="text-xs text-slate-500">Ambas caras</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {documentFiles.cedula_rep && <span className="text-xs text-green-600 font-medium">Cargado</span>}
                                        <input
                                            type="file"
                                            accept=".pdf,.png,.jpg,.jpeg"
                                            onChange={handleFileSelect('cedula_rep')}
                                            className="hidden"
                                            id="upload-cedula"
                                        />
                                        <label htmlFor="upload-cedula">
                                            <Button type="button" variant="outline" size="sm" className="cursor-pointer">
                                                {documentFiles.cedula_rep ? 'Cambiar' : 'Subir'}
                                            </Button>
                                        </label>
                                    </div>
                                </div>

                                {/* Certificación Bancaria - Opcional */}
                                <div className="flex items-center justify-between p-3 bg-white rounded border border-slate-200">
                                    <div className="flex items-center gap-3">
                                        <FileText className="w-5 h-5 text-purple-600" />
                                        <div>
                                            <p className="font-bold text-sm text-slate-700">Certificación Bancaria</p>
                                            <p className="text-xs text-slate-500">Opcional</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {documentFiles.bancaria && <span className="text-xs text-green-600 font-medium">Cargado</span>}
                                        <input
                                            type="file"
                                            accept=".pdf"
                                            onChange={handleFileSelect('bancaria')}
                                            className="hidden"
                                            id="upload-bancaria"
                                        />
                                        <label htmlFor="upload-bancaria">
                                            <Button type="button" variant="outline" size="sm" className="cursor-pointer">
                                                {documentFiles.bancaria ? 'Cambiar' : 'Subir'}
                                            </Button>
                                        </label>
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
