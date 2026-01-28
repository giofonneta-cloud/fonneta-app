'use client';

import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/shared/components/ui/form';
import { Input } from '@/shared/components/ui/input';
import { Button } from '@/shared/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Separator } from '@/shared/components/ui/separator';
import { Textarea } from '@/shared/components/ui/textarea';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { Receipt, Building2, Link, FileCheck, Package, Plus, Trash2, Calendar, Mail, DollarSign, Wallet } from 'lucide-react';
import { expensesService } from '../services/expensesService';
import { providerService } from '@/features/providers/services/providerService';
import { projectService } from '@/features/projects/services/projectService';
import { useAuthStore } from '@/features/auth/store/authStore';
import { Provider } from '@/features/providers/types/provider.types';
import { Project } from '@/features/projects/types/project.types';

const EXPENSE_CATEGORIES = [
    {
        label: "Gastos Proyectos",
        options: [
            { value: "transporte_aereo", label: "Transporte - Aéreo" },
            { value: "transporte_terrestre", label: "Transporte - Terrestre" },
            { value: "transporte_maritimo", label: "Transporte - Fluvial y Marítimo" },
            { value: "transporte_carga", label: "Transporte de carga y mensajería" },
            { value: "transporte_equipaje", label: "Excesos de equipaje" },
            { value: "impuestos", label: "Impuestos aeroportuarios" },
            { value: "visas", label: "Visas" },
            { value: "seguros", label: "Seguros" },
            { value: "alojamiento", label: "Alojamiento" },
            { value: "viaticos", label: "Viáticos" },
            { value: "alimentacion", label: "Alimentación" },
            { value: "produccion_freelancers", label: "Producción - Freelancers (Foto, Video, Periodista)" },
            { value: "produccion_modelos", label: "Producción - Modelos" },
            { value: "produccion_maquillaje", label: "Producción - Maquillaje Peinado" },
            { value: "produccion_vestuario", label: "Producción - Vestuario" },
            { value: "produccion_mobiliario", label: "Producción - Mobiliario" },
            { value: "personal_coordinador", label: "Personal - Coordinador revista" },
            { value: "personal_arte", label: "Personal - Director arte revista" },
            { value: "personal_editor", label: "Personal - Editor general revista" },
            { value: "personal_ilustrador", label: "Personal - Ilustrador" },
            { value: "personal_estilo", label: "Personal - Corrector estilo" },
            { value: "personal_periodistas", label: "Personal - Periodistas" },
            { value: "servicios_tic", label: "Servicios TIC" },
            { value: "logistica", label: "Logística" },
            { value: "salud", label: "Servicios Salud e insumos" },
            { value: "publicidad_redes", label: "Publicidad - Pauta redes" },
            { value: "publicidad_impresa", label: "Publicidad - Pauta Impresa" },
            { value: "diseno", label: "Diseño" },
            { value: "imprenta", label: "Imprenta / Impresión" },
            { value: "comision", label: "Comisión x venta" },
            { value: "reintegros", label: "Reintegros" },
            { value: "bodegaje", label: "Bodegaje" },
            { value: "nomina", label: "Nomina Fonneta" },
        ]
    },
    {
        label: "Gastos Fijos",
        options: [
            { value: "fijo_transporte", label: "Transporte" },
            { value: "fijo_seguros", label: "Seguros" },
            { value: "fijo_alojamiento", label: "Alojamiento" },
            { value: "fijo_viaticos", label: "Viáticos" },
            { value: "fijo_alimentacion", label: "Alimentación" },
            { value: "fijo_servicios", label: "Servicios TIC" },
            { value: "fijo_logistica", label: "Logística" },
        ]
    }
];

const PAY_METHODS = [
    { value: "transferencia", label: "TRANSFERENCIA" },
    { value: "tarjeta_credito", label: "TARJETA DE CRÉDITO" },
    { value: "canje", label: "CANJE" },
    { value: "efectivo", label: "EFECTIVO" },
];

const expenseFormSchema = z.object({
    proveedor_id: z.string().min(1, "Selecciona un proveedor"),
    proyecto_id: z.string().min(1, "Selecciona un proyecto"),
    marca_id: z.string().optional(),
    producto_id: z.string().optional(),
    valor_neto: z.coerce.number().positive("Debe ser mayor a 0"),
    tiene_iva: z.boolean().default(true),
    iva_porcentaje: z.coerce.number().default(19),
    categoria: z.string().min(1, "Categoría requerida"),
    codigo_oc: z.string().optional(),
    codigo_release: z.string().optional(),
    numero_factura_proveedor: z.string().optional(),
    fecha_radicado: z.string().optional(),
    plazo_pago: z.string().default('0'),
    fecha_limite_pago: z.string().optional(),
    estado_pago: z.enum(['pendiente', 'pagado']),
    forma_pago: z.string().optional(),
    documentos_faltantes: z.array(z.string()).default([]),
    observaciones: z.string().optional(),
    entregables: z.array(z.object({
        nombre: z.string().min(1, "Nombre requerido"),
        fecha_entrega_comprometida: z.string().optional(),
        estado: z.enum(['pendiente', 'recibido', 'aprobado']).default('pendiente'),
    })).default([]),
});

type ExpenseFormValues = z.infer<typeof expenseFormSchema>;

interface ExpenseFormProps {
    onSuccess?: () => void;
    initialProjectId?: string;
    initialClientId?: string;
}

export function ExpenseForm({ onSuccess, initialProjectId, initialClientId }: ExpenseFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [providers, setProviders] = useState<Provider[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);

    useEffect(() => {
        // Fetch providers (is_provider=true) and projects
        providerService.getProviders().then(setProviders).catch(console.error);
        projectService.getProjects().then(setProjects).catch(console.error);
    }, []);

    const form = useForm<ExpenseFormValues>({
        resolver: zodResolver(expenseFormSchema) as any,
        defaultValues: {
            proveedor_id: initialClientId || '',
            proyecto_id: initialProjectId || '',
            marca_id: '',
            producto_id: '',
            valor_neto: 0,
            tiene_iva: true,
            iva_porcentaje: 19,
            categoria: '',
            codigo_oc: '',
            codigo_release: '',
            numero_factura_proveedor: '',
            fecha_radicado: '',
            plazo_pago: '0',
            fecha_limite_pago: '',
            estado_pago: 'pendiente',
            forma_pago: '',
            documentos_faltantes: [],
            observaciones: '',
            entregables: [],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "entregables",
    });

    const { profile } = useAuthStore();
    const valorNeto = Number(form.watch('valor_neto')) || 0;
    const tieneIva = form.watch('tiene_iva');
    const ivaPorcentaje = tieneIva ? (Number(form.watch('iva_porcentaje')) || 0) : 0;
    const ivaValor = valorNeto * (ivaPorcentaje / 100);
    const totalConIva = valorNeto + ivaValor;
    const estadoPago = form.watch('estado_pago');
    const fechaRadicado = form.watch('fecha_radicado');
    const plazoPago = form.watch('plazo_pago');

    // Efecto para calcular fecha límite de pago automáticamente
    useEffect(() => {
        if (fechaRadicado && plazoPago && plazoPago !== '0') {
            const date = new Date(fechaRadicado);
            date.setDate(date.getDate() + parseInt(plazoPago));
            const formattedDate = date.toISOString().split('T')[0];
            form.setValue('fecha_limite_pago', formattedDate);
        }
    }, [fechaRadicado, plazoPago, form]);

    const onSubmit = async (values: ExpenseFormValues) => {
        setIsSubmitting(true);
        try {
            // Validación de límites de aprobación profesional
            const limit = Number(profile?.approval_limit_expenses) || 0;
            const requiresApproval = totalConIva > limit;

            if (requiresApproval) {
                const proceed = confirm(`El monto total (${totalConIva.toLocaleString()}) supera tu límite de aprobación (${limit.toLocaleString()}). \n\nEl gasto será registrado pero quedará marcado como 'PENDIENTE DE APROBACIÓN SUPERIOR'. ¿Deseas continuar?`);
                if (!proceed) {
                    setIsSubmitting(false);
                    return;
                }
            }

            // Isolate entregables from main payload
            const { entregables, ...gastoData } = values;

            // Sanitize payload (convert empty strings to null)
            const cleanGastoData = Object.fromEntries(
                Object.entries(gastoData).map(([key, value]) => {
                    if (value === '') return [key, null];
                    return [key, value];
                })
            );

            const finalPayload = {
                ...cleanGastoData,
                iva_valor: ivaValor,
                total_con_iva: totalConIva,
                // Campo ficticio para demostrar la lógica si existiera en la BD o en un campo de observaciones
                observaciones: requiresApproval 
                    ? `[AUTO-ALERTA] Monto supera límite de ${profile?.full_name}. ${values.observaciones || ''}`
                    : values.observaciones
            };

            console.log("🚀 Enviando Gasto a Supabase:", finalPayload);

            // 1. Create Gasto
            const createdGasto = await expensesService.createGasto(finalPayload as any);

            // 2. Create Entregables if any
            if (entregables && entregables.length > 0 && createdGasto?.id) {
                console.log("📝 Guardando entregables...", entregables);
                await Promise.all(entregables.map(entregable =>
                    expensesService.addEntregable({
                        ...entregable,
                        gasto_id: createdGasto.id
                    } as any)
                ));
            }

            alert(requiresApproval 
                ? "Gasto registrado con éxito. Nota: Requiere aprobación superior por superar el límite." 
                : "Gasto registrado exitosamente");
                
            form.reset();
            if (onSuccess) onSuccess();
        } catch (error: any) {
            console.error("❌ Error CRÍTICO al guardar gasto:", error);
            alert(`Error al guardar: ${error.message || "Error desconocido"}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const docOptions = [
        { id: 'rut', label: 'RUT actualizado' },
        { id: 'cert_bancaria', label: 'Certificación bancaria' },
        { id: 'factura_firmada', label: 'Factura firmada' },
        { id: 'acta_entrega', label: 'Acta de entrega' },
    ];

    return (
        <Card className="max-w-4xl mx-auto shadow-2xl border-slate-200 overflow-hidden">
            <CardHeader className="bg-slate-900 border-b p-6 text-white">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-800 rounded-lg">
                        <Receipt className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                        <CardTitle className="text-xl font-bold">Nuevo Gasto a Proveedor</CardTitle>
                        <p className="text-xs text-slate-400 font-medium">Gestiona contrataciones, facturas y pagos institucionales</p>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-8">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit, (errors) => {
                        console.error("❌ Error de Validación:", errors);
                        alert("No se puede guardar: Verifica los campos requeridos marcados en rojo.");
                    })} className="space-y-10">
                        {/* 1. Información del Proveedor y Vinculación */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <section className="space-y-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <Building2 className="w-4 h-4 text-slate-400" />
                                    <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Proveedor</h3>
                                </div>
                                <FormField
                                    control={form.control}
                                    name="proveedor_id"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormControl>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger className="bg-white">
                                                            <SelectValue placeholder="Busca un proveedor..." />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {providers.map((p) => (
                                                            <SelectItem key={p.id} value={p.id}>
                                                                {p.business_name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </FormControl>
                                            <FormDescription className="text-[10px]">Si no aparece, regístralo primero en Proveedores</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </section>

                            <section className="space-y-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <Link className="w-4 h-4 text-slate-400" />
                                    <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Proyecto Vinculado</h3>
                                </div>
                                <FormField
                                    control={form.control}
                                    name="proyecto_id"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormControl>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger className="bg-white">
                                                            <SelectValue placeholder="Selecciona proyecto..." />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {projects.map((p) => (
                                                            <SelectItem key={p.id} value={p.id}>
                                                                {p.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </section>
                        </div>

                        <Separator />

                        {/* 2. Detalles Financieros y Contractuales */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <section className="space-y-6">
                                <div className="flex items-center gap-2 mb-2">
                                    <DollarSign className="w-4 h-4 text-emerald-500" />
                                    <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Finanzas</h3>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="valor_neto"
                                        render={({ field }) => (
                                            <FormItem className="col-span-2">
                                                <FormLabel className="text-xs font-bold text-slate-500">Valor Neto (USD)</FormLabel>
                                                <FormControl>
                                                    <Input {...field} type="number" className="font-bold text-lg" />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <div className="p-3 bg-slate-50 border rounded-lg flex items-center justify-between col-span-2">
                                        <div>
                                            <span className="text-[10px] font-bold text-slate-400 block uppercase">Incluye IVA?</span>
                                            <FormField
                                                control={form.control}
                                                name="tiene_iva"
                                                render={({ field }) => (
                                                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 mt-1">
                                                        <FormControl>
                                                            <Checkbox
                                                                checked={field.value}
                                                                onCheckedChange={field.onChange}
                                                            />
                                                        </FormControl>
                                                        <FormLabel className="text-xs font-medium text-slate-600">Sí, aplicar IVA</FormLabel>
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                        {tieneIva && (
                                            <div className="text-right">
                                                <span className="text-[10px] font-bold text-slate-400 block uppercase">IVA ({ivaPorcentaje}%)</span>
                                                <span className="text-sm font-bold text-slate-700">{ivaValor.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg col-span-2">
                                        <span className="text-[10px] font-bold text-emerald-600 block uppercase">Total con IVA</span>
                                        <span className="text-sm font-black text-emerald-700">{totalConIva.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</span>
                                    </div>
                                    <FormField
                                        control={form.control}
                                        name="categoria"
                                        render={({ field }) => (
                                            <FormItem className="col-span-2">
                                                <FormLabel className="text-xs font-bold text-slate-500">Categoría de Gasto</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl><SelectTrigger><SelectValue placeholder="Selecciona..." /></SelectTrigger></FormControl>
                                                    <SelectContent>
                                                        {EXPENSE_CATEGORIES.map((group) => (
                                                            <React.Fragment key={group.label}>
                                                                <div className="px-2 py-1.5 text-xs font-bold text-slate-400 bg-slate-50 uppercase tracking-tighter">
                                                                    {group.label}
                                                                </div>
                                                                {group.options.map((opt) => (
                                                                    <SelectItem key={opt.value} value={opt.value}>
                                                                        {opt.label}
                                                                    </SelectItem>
                                                                ))}
                                                            </React.Fragment>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </section>

                            <section className="space-y-6">
                                <div className="flex items-center gap-2 mb-2">
                                    <FileCheck className="w-4 h-4 text-blue-500" />
                                    <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Documentación OC</h3>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="codigo_oc"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs font-bold text-slate-500">Código OC</FormLabel>
                                                <Input {...field} className="bg-white" />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="codigo_release"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs font-bold text-slate-500">Código Release</FormLabel>
                                                <Input {...field} className="bg-white" />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="numero_factura_proveedor"
                                        render={({ field }) => (
                                            <FormItem className="col-span-2">
                                                <FormLabel className="text-xs font-bold text-slate-500">N° Factura Proveedor</FormLabel>
                                                <Input {...field} className="bg-white" />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="fecha_radicado"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs font-bold text-slate-500 text-[10px]">Fecha Radicado</FormLabel>
                                                <Input {...field} type="date" className="bg-white text-xs" />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="plazo_pago"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs font-bold text-slate-500">Plazo Pago</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl><SelectTrigger className="bg-white text-xs"><SelectValue placeholder="Días..." /></SelectTrigger></FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="0">Inmediato</SelectItem>
                                                        <SelectItem value="15">15 días</SelectItem>
                                                        <SelectItem value="30">30 días</SelectItem>
                                                        <SelectItem value="45">45 días</SelectItem>
                                                        <SelectItem value="60">60 días</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="fecha_limite_pago"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs font-bold text-slate-500 text-[10px]">Pago Estimado</FormLabel>
                                                <Input {...field} type="date" className="bg-emerald-50 text-xs font-bold border-emerald-200" readOnly />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </section>
                        </div>

                        <Separator />

                        {/* 3. Validación y Estado de Pago */}
                        <section className="space-y-6">
                            <div className="flex items-center gap-2">
                                <FileCheck className="w-4 h-4 text-emerald-500" />
                                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Validación y Estado de Pago</h3>
                            </div>
                            <div className="p-6 bg-slate-50 rounded-xl border space-y-6">
                                <FormField
                                    control={form.control}
                                    name="estado_pago"
                                    render={({ field }) => (
                                        <FormItem className="space-y-4">
                                            <FormLabel className="text-sm font-bold text-slate-700">Estado Actual de Pago</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl><SelectTrigger className="w-full md:w-[300px] bg-white"><SelectValue /></SelectTrigger></FormControl>
                                                <SelectContent>
                                                    <SelectItem value="pendiente">⏳ Pendiente</SelectItem>
                                                    <SelectItem value="pagado">✅ Pagado</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </FormItem>
                                    )}
                                />
                                
                                <FormField
                                    control={form.control}
                                    name="forma_pago"
                                    render={({ field }) => (
                                        <FormItem className="space-y-4">
                                            <div className="flex items-center gap-2">
                                                <Wallet className="w-4 h-4 text-emerald-500" />
                                                <FormLabel className="text-sm font-bold text-slate-700 uppercase">Forma de Pago</FormLabel>
                                            </div>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl><SelectTrigger className="w-full md:w-[300px] bg-white"><SelectValue placeholder="Selecciona..." /></SelectTrigger></FormControl>
                                                <SelectContent>
                                                    {PAY_METHODS.map((method) => (
                                                        <SelectItem key={method.value} value={method.value}>
                                                            {method.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </section>

                        {/* 4. Entregables */}
                        <section className="space-y-6">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <Package className="w-4 h-4 text-blue-500" />
                                    <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Entregables Asociados</h3>
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => append({ nombre: '', estado: 'pendiente' })}
                                    className="gap-2 text-[10px] font-bold h-8"
                                >
                                    <Plus className="w-3 h-3" />
                                    Agregar Entregable
                                </Button>
                            </div>

                            <div className="space-y-3">
                                {fields.length === 0 ? (
                                    <div className="py-8 border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-slate-400">
                                        <Package className="w-8 h-8 opacity-20 mb-2" />
                                        <p className="text-[10px] font-medium uppercase tracking-widest">No hay entregables registrados</p>
                                    </div>
                                ) : (
                                    fields.map((field, index) => (
                                        <div key={field.id} className="flex flex-wrap md:flex-nowrap gap-4 items-end p-4 bg-white border rounded-xl shadow-sm animate-in zoom-in-95 duration-200">
                                            <div className="flex-1 space-y-1">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase">Nombre entregable</label>
                                                <Input {...form.register(`entregables.${index}.nombre` as const)} placeholder="Ej: Diseños finales v1" className="bg-slate-50/50" />
                                            </div>
                                            <div className="w-full md:w-[150px] space-y-1">
                                                <label className="text-[10px] font-bold text-slate-400 uppercase">Estado</label>
                                                <Select onValueChange={(val) => form.setValue(`entregables.${index}.estado` as any, val as any)} defaultValue={field.estado}>
                                                    <SelectTrigger className="bg-slate-50/50 h-10"><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="pendiente">Pendiente</SelectItem>
                                                        <SelectItem value="recibido">Recibido</SelectItem>
                                                        <SelectItem value="aprobado">Aprobado</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="text-rose-500 hover:text-rose-700 hover:bg-rose-50">
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </section>

                        <div className="flex justify-end items-center gap-4 pt-8">
                            <Button type="button" variant="outline" className="px-8 border-slate-200" onClick={() => onSuccess?.()}>Cancelar</Button>
                            <Button type="submit" className="px-12 bg-slate-900 hover:bg-black text-white font-bold h-12 transition-all active:scale-95" disabled={isSubmitting}>
                                {isSubmitting ? "Guardando..." : "Guardar Gasto y Notificar"}
                            </Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
