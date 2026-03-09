'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shared/components/ui/form';
import { Input } from '@/shared/components/ui/input';
import { Button } from '@/shared/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Separator } from '@/shared/components/ui/separator';
import { Textarea } from '@/shared/components/ui/textarea';
import { DollarSign, FileText, BadgeCheck, Users, Calendar, UserCircle } from 'lucide-react';
import { salesService } from '../services/salesService';
import { comercialesService, Comercial } from '../services/comercialesService';
import { providerService } from '@/features/providers/services/providerService';
import { Provider } from '@/features/providers/types/provider.types';
import { projectService } from '@/features/projects/services/projectService';
import { Project } from '@/features/projects/types/project.types';
import { Venta } from '../types/sales-expenses.types';

const salesFormSchema = z.object({
    cliente_id: z.string().min(1, "Selecciona un cliente"),
    line_of_business: z.string().min(1, "Requerido"),
    proyecto_id: z.string().min(1, "Requerido"),
    marca_id: z.string().optional(),
    producto_id: z.string().optional(),
    valor_venta_neto: z.coerce.number().positive("Debe ser mayor a 0"),
    iva_porcentaje: z.coerce.number().default(19),
    estado_oc: z.enum(['oc_recibida', 'facturar_sin_oc']),
    numero_oc: z.string().optional(),
    numero_factura: z.string().optional(),
    fecha_factura: z.string().optional(),
    plazo_pago_dias: z.coerce.number().default(30),
    tiene_comision: z.boolean().default(false),
    comercial_id: z.string().optional(),
    porcentaje_comision: z.coerce.number().min(0).max(100).default(10),
    notas_internas: z.string().optional(),
    cost_center: z.string().optional(),
});

type SalesFormValues = z.infer<typeof salesFormSchema>;

interface SalesFormProps {
    onSuccess?: () => void;
    onCancel?: () => void;
    initialProjectId?: string;
    initialClientId?: string;
    initialData?: Venta;
    initialValorNeto?: number;
}

export function SalesForm({ onSuccess, onCancel, initialProjectId, initialClientId, initialData, initialValorNeto }: SalesFormProps) {
    const isEditing = !!initialData;
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [clients, setClients] = useState<Provider[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [comerciales, setComerciales] = useState<Comercial[]>([]);

    useEffect(() => {
        providerService.getClients().then(setClients).catch(console.error);
        projectService.getProjects().then(setProjects).catch(console.error);
        comercialesService.getComerciales().then(setComerciales).catch(console.error);
    }, []);

    const hasComision = !!(initialData?.porcentaje_comision && initialData.porcentaje_comision > 0);

    const form = useForm<SalesFormValues>({
        resolver: zodResolver(salesFormSchema) as any,
        defaultValues: initialData ? {
            cliente_id: initialData.cliente_id || '',
            line_of_business: initialData.line_of_business || '',
            proyecto_id: initialData.proyecto_id || '',
            marca_id: '',
            producto_id: '',
            valor_venta_neto: initialData.valor_venta_neto || 0,
            iva_porcentaje: initialData.iva_porcentaje || 19,
            estado_oc: initialData.estado_oc || 'oc_recibida',
            numero_oc: initialData.numero_oc || '',
            numero_factura: initialData.numero_factura || '',
            fecha_factura: initialData.fecha_factura || '',
            plazo_pago_dias: initialData.plazo_pago_dias || 30,
            tiene_comision: hasComision,
            comercial_id: (initialData as any).comercial_id || '',
            porcentaje_comision: initialData.porcentaje_comision || 10,
            notas_internas: initialData.notas_internas || '',
            cost_center: initialData.cost_center || '',
        } : {
            cliente_id: initialClientId || '',
            line_of_business: '',
            proyecto_id: initialProjectId || '',
            marca_id: '',
            producto_id: '',
            valor_venta_neto: initialValorNeto || 0,
            iva_porcentaje: 19,
            estado_oc: 'oc_recibida',
            numero_oc: '',
            numero_factura: '',
            fecha_factura: '',
            plazo_pago_dias: 30,
            tiene_comision: false,
            comercial_id: '',
            porcentaje_comision: 10,
            notas_internas: '',
            cost_center: '',
        },
    });

    const valorNeto = Number(form.watch('valor_venta_neto')) || 0;
    const ivaPorcentaje = Number(form.watch('iva_porcentaje')) || 0;
    const tieneComision = form.watch('tiene_comision');
    const porcentajeComision = tieneComision ? (Number(form.watch('porcentaje_comision')) || 0) : 0;

    const ivaValor = valorNeto * (ivaPorcentaje / 100);
    const totalConIva = valorNeto + ivaValor;
    const valorComision = valorNeto * (porcentajeComision / 100);

    const fechaFactura = form.watch('fecha_factura');
    const plazoDias = Number(form.watch('plazo_pago_dias')) || 0;

    const fechaCobroEstimada = React.useMemo(() => {
        if (!fechaFactura) return 'Pendiente';
        const parts = fechaFactura.split('-');
        if (parts.length !== 3) return 'Fecha inválida';

        const date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        date.setDate(date.getDate() + plazoDias);

        return date.toLocaleDateString('es-CO', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }, [fechaFactura, plazoDias]);

    const onSubmit = async (values: SalesFormValues) => {
        setIsSubmitting(true);
        try {
            // Calcular fecha de cobro estimada
            let fechaCobroEstimadaISO: string | undefined;
            if (values.fecha_factura) {
                const parts = values.fecha_factura.split('-');
                const date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
                date.setDate(date.getDate() + values.plazo_pago_dias);
                fechaCobroEstimadaISO = date.toISOString().split('T')[0];
            }

            // Mapear campos directamente a la tabla ventas
            const payload = {
                proyecto_id: values.proyecto_id,
                cliente_id: values.cliente_id,
                valor_venta_neto: values.valor_venta_neto,
                iva_porcentaje: values.iva_porcentaje,
                line_of_business: values.line_of_business,
                estado_oc: values.estado_oc,
                numero_oc: values.numero_oc || undefined,
                numero_factura: values.numero_factura || undefined,
                fecha_factura: values.fecha_factura || undefined,
                plazo_pago_dias: values.plazo_pago_dias,
                fecha_cobro_estimada: fechaCobroEstimadaISO,
                comercial_id: values.tiene_comision && values.comercial_id ? values.comercial_id : undefined,
                porcentaje_comision: values.tiene_comision ? values.porcentaje_comision : 0,
                notas_internas: values.notas_internas || undefined,
                cost_center: values.cost_center || undefined,
            };

            console.log("🚀 Enviando payload a Supabase:", payload);

            if (isEditing && initialData) {
                const ivaPct = payload.iva_porcentaje ?? 19;
                const ivaVal = payload.valor_venta_neto * (ivaPct / 100);
                await salesService.updateSale(initialData.id, {
                    ...payload,
                    iva_valor: ivaVal,
                    total_con_iva: payload.valor_venta_neto + ivaVal,
                    valor_comision: (payload.porcentaje_comision ?? 0) > 0
                        ? payload.valor_venta_neto * ((payload.porcentaje_comision ?? 0) / 100)
                        : 0,
                } as any);
                alert("Venta actualizada exitosamente");
            } else {
                await salesService.createSale(payload);
                alert("Venta registrada exitosamente");
            }
            form.reset();
            if (onSuccess) onSuccess();
        } catch (error: any) {
            console.error("❌ Error CRÍTICO al guardar venta:", error);

            let errorMessage = "Error desconocido";
            if (typeof error === 'object') {
                errorMessage = error.message || JSON.stringify(error);
                console.error("Detalles del error (JSON):", JSON.stringify(error, null, 2));
                if (error.details) console.error("DB Details:", error.details);
                if (error.hint) console.error("DB Hint:", error.hint);
            }

            alert(`Error al guardar: ${errorMessage}\n\nRevisa la consola para más detalles.`);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Card className="max-w-4xl mx-auto shadow-2xl border-slate-200">
            <CardHeader className="bg-slate-50 border-b p-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-600 rounded-lg">
                        <DollarSign className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <CardTitle className="text-xl font-bold text-slate-800">
                            {isEditing ? 'Editar Venta' : 'Nueva Venta'}
                            {isEditing && initialData?.numero_factura && (
                                <span className="ml-2 text-sm font-mono font-normal text-slate-400">#{initialData.numero_factura}</span>
                            )}
                        </CardTitle>
                        <p className="text-xs text-slate-500 font-medium">
                            {isEditing ? 'Modifica los datos de esta venta' : 'Registra los ingresos asociados a un proyecto institucional'}
                        </p>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-8">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit, (errors) => {
                        console.error("❌ Error de Validación:", errors);
                        alert("No se puede guardar: Hay campos requeridos sin completar. Revisa los mensajes en rojo.");
                    })} className="space-y-8">
                        {/* 1. Información del Proyecto */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-2 mb-4">
                                <Users className="w-4 h-4 text-blue-500" />
                                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Información del Proyecto</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-slate-50/50 rounded-xl border border-slate-100">
                                <FormField
                                    control={form.control}
                                    name="cliente_id"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-bold text-slate-500">Cliente</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="bg-white border-slate-200 focus:ring-blue-500">
                                                        <SelectValue placeholder="Selecciona cliente" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {clients.map((client) => (
                                                        <SelectItem key={client.id} value={client.id}>
                                                            {client.business_name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="line_of_business"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-bold text-slate-500">Línea de Negocio</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="bg-white border-slate-200 focus:ring-blue-500">
                                                        <SelectValue placeholder="Selecciona línea" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="publicidad">Publicidad</SelectItem>
                                                    <SelectItem value="editorial">Editorial</SelectItem>
                                                    <SelectItem value="digital">Digital</SelectItem>
                                                    <SelectItem value="eventos">Eventos</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="proyecto_id"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-bold text-slate-500">Proyecto</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="bg-white border-slate-200 focus:ring-blue-500">
                                                        <SelectValue placeholder="Selecciona proyecto" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {projects.map((project) => (
                                                        <SelectItem key={project.id} value={project.id}>
                                                            {project.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="cost_center"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-bold text-slate-500">Centro de Costo</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="bg-white border-slate-200 focus:ring-blue-500">
                                                        <SelectValue placeholder="Selecciona centro de costo" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="FUSCIA">FUSCIA</SelectItem>
                                                    <SelectItem value="SOHO">SOHO</SelectItem>
                                                    <SelectItem value="MONICA J">MONICA J</SelectItem>
                                                    <SelectItem value="FONNETA">FONNETA</SelectItem>
                                                    <SelectItem value="CLUB INDOMITAS">CLUB INDOMITAS</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </section>

                        <Separator className="bg-slate-100" />

                        {/* 2. Detalles Comerciales */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-2 mb-4">
                                <DollarSign className="w-4 h-4 text-emerald-500" />
                                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Detalles Comerciales</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 bg-emerald-50/20 rounded-xl border border-emerald-100/50">
                                <FormField
                                    control={form.control}
                                    name="valor_venta_neto"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-bold text-slate-500">Valor Neto (COP)</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <DollarSign className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                                                    <Input {...field} type="number" className="pl-9 font-semibold" />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500">IVA (19%)</label>
                                    <div className="h-10 px-3 py-2 bg-slate-100/50 rounded-md border border-slate-200 text-slate-600 font-medium">
                                        {ivaValor.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500">Total con IVA</label>
                                    <div className="h-10 px-3 py-2 bg-emerald-500 text-white rounded-md font-bold shadow-sm">
                                        {totalConIva.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })}
                                    </div>
                                </div>
                                <FormField
                                    control={form.control}
                                    name="estado_oc"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-bold text-slate-500">Estado CT</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="bg-white">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="oc_recibida">CT Recibida</SelectItem>
                                                    <SelectItem value="facturar_sin_oc">Facturar sin CT</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="numero_oc"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-bold text-slate-500">Número de CT</FormLabel>
                                            <FormControl>
                                                <Input {...field} placeholder="Ej: CT-2026-001" className="bg-white" disabled={form.watch('estado_oc') === 'facturar_sin_oc'} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </section>

                        <Separator className="bg-slate-100" />

                        {/* 3. Facturación */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-2 mb-4">
                                <FileText className="w-4 h-4 text-purple-500" />
                                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Facturación</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-4 bg-purple-50/20 rounded-xl border border-purple-100/50">
                                <FormField
                                    control={form.control}
                                    name="numero_factura"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-bold text-slate-500">N° Factura</FormLabel>
                                            <Input {...field} className="bg-white" />
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="fecha_factura"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-bold text-slate-500">Fecha Factura</FormLabel>
                                            <Input {...field} type="date" className="bg-white" />
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="plazo_pago_dias"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-bold text-slate-500">Plazo (Días)</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={String(field.value)}>
                                                <FormControl>
                                                    <SelectTrigger className="bg-white">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="15">15 Días</SelectItem>
                                                    <SelectItem value="30">30 Días</SelectItem>
                                                    <SelectItem value="45">45 Días</SelectItem>
                                                    <SelectItem value="60">60 Días</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500">Cobro Estimado</label>
                                    <div className="h-10 px-3 py-2 bg-blue-50/50 rounded-md border border-blue-100 text-blue-700 text-xs font-bold flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-blue-400" />
                                        {fechaCobroEstimada}
                                    </div>
                                </div>
                            </div>
                        </section>

                        <Separator className="bg-slate-100" />

                        {/* 4. Comisiones */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-2 mb-4">
                                <BadgeCheck className="w-4 h-4 text-orange-500" />
                                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Comisiones</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-6 bg-orange-50/20 rounded-xl border border-orange-100/50 items-end">
                                <FormField
                                    control={form.control}
                                    name="tiene_comision"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center space-x-3 space-y-0 p-2">
                                            <FormControl>
                                                <input
                                                    type="checkbox"
                                                    checked={field.value}
                                                    onChange={field.onChange}
                                                    className="w-5 h-5 rounded border-slate-300 text-orange-600 focus:ring-orange-500"
                                                />
                                            </FormControl>
                                            <div className="space-y-1 leading-none">
                                                <FormLabel className="text-sm font-bold text-slate-700">
                                                    ¿Incluye Comisión?
                                                </FormLabel>
                                            </div>
                                        </FormItem>
                                    )}
                                />

                                {form.watch('tiene_comision') && (
                                    <>
                                        <FormField
                                            control={form.control}
                                            name="comercial_id"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-xs font-bold text-slate-500 flex items-center gap-1">
                                                        <UserCircle className="w-3 h-3" />
                                                        Comercial
                                                    </FormLabel>
                                                    <Select
                                                        onValueChange={(value) => {
                                                            field.onChange(value);
                                                            // Auto-fill percentage from comercial default
                                                            const comercial = comerciales.find(c => c.id === value);
                                                            if (comercial) {
                                                                form.setValue('porcentaje_comision', comercial.porcentaje_comision_default);
                                                            }
                                                        }}
                                                        defaultValue={field.value}
                                                    >
                                                        <FormControl>
                                                            <SelectTrigger className="bg-white border-orange-200 focus:ring-orange-500">
                                                                <SelectValue placeholder="Seleccionar comercial" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {comerciales.length === 0 ? (
                                                                <SelectItem value="_none" disabled>
                                                                    No hay comerciales registrados
                                                                </SelectItem>
                                                            ) : (
                                                                comerciales.map((comercial) => (
                                                                    <SelectItem key={comercial.id} value={comercial.id}>
                                                                        {comercial.nombre} ({comercial.porcentaje_comision_default}%)
                                                                    </SelectItem>
                                                                ))
                                                            )}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="porcentaje_comision"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-xs font-bold text-slate-500">% Comisión</FormLabel>
                                                    <FormControl>
                                                        <Input {...field} type="number" className="bg-white font-bold text-orange-600" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <div className="space-y-1">
                                            <span className="text-xs font-bold text-slate-400 tracking-tighter uppercase">Valor Comisión</span>
                                            <p className="text-2xl font-black text-slate-800 tracking-tighter">
                                                {valorComision.toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })}
                                            </p>
                                            <p className="text-[10px] text-slate-400 font-medium">Calculado sobre el valor neto sin IVA</p>
                                        </div>
                                    </>
                                )}
                            </div>
                        </section>

                        <Separator className="bg-slate-100" />

                        {/* 5. Notas */}
                        <FormField
                            control={form.control}
                            name="notas_internas"
                            render={({ field }) => (
                                <FormItem>
                                    <div className="flex items-center gap-2 mb-2">
                                        <FileText className="w-4 h-4 text-slate-400" />
                                        <FormLabel className="text-xs font-bold text-slate-500 uppercase">Notas de Seguimiento</FormLabel>
                                    </div>
                                    <FormControl>
                                        <Textarea {...field} placeholder="Registra contactos, correos enviados, o cualquier detalle relevante para la cobranza..." className="min-h-[100px] border-slate-200" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="flex justify-end items-center gap-4 pt-4">
                            <Button type="button" variant="outline" className="px-8 border-slate-200 hover:bg-slate-50" onClick={() => (onCancel ?? onSuccess)?.()}>
                                Cancelar
                            </Button>
                            <Button type="submit" className="px-10 bg-blue-600 hover:bg-blue-700 text-white font-bold py-6 h-auto transition-transform active:scale-95" disabled={isSubmitting}>
                                {isSubmitting ? "Guardando..." : isEditing ? "Guardar Cambios" : "Guardar Registro de Venta"}
                            </Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
