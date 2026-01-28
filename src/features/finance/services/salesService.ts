import { supabase } from '@/shared/lib/supabase';
import { Venta, PaymentStatus } from '../types/sales-expenses.types';
import { CreateVentaSchema, RegistrarPagoSchema, validateOrThrow } from '@/shared/lib/validators';

export const salesService = {
    async getAllSales() {
        const { data, error } = await supabase
            .from('ventas')
            .select(`
                *,
                proyecto:projects(*),
                cliente:providers(*)
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data as Venta[];
    },

    async getSalesByProject(projectId: string) {
        const { data, error } = await supabase
            .from('ventas')
            .select('*')
            .eq('proyecto_id', projectId);

        if (error) throw error;
        return data as Venta[];
    },

    /**
     * Crea una venta con cálculos automáticos de IVA y retención
     * Usa: create_venta_calculada RPC function
     * Valida con Zod antes de enviar
     */
    async createSale(input: {
        project_id: string;
        client_id: string;
        descripcion: string;
        monto_base: number;
        iva_porcentaje?: number;
        retencion_porcentaje?: number;
        fecha_venta: string;
        fecha_vencimiento?: string;
        metodo_pago?: string;
        notas?: string;
    }) {
        // Validar con Zod
        validateOrThrow(CreateVentaSchema, input);

        const { data, error } = await supabase.rpc('create_venta_calculada', {
            p_project_id: input.project_id,
            p_client_id: input.client_id,
            p_descripcion: input.descripcion,
            p_monto_base: input.monto_base,
            p_iva_porcentaje: input.iva_porcentaje ?? 19,
            p_retencion_porcentaje: input.retencion_porcentaje ?? 0,
            p_fecha_venta: input.fecha_venta,
            p_fecha_vencimiento: input.fecha_vencimiento || null,
            p_metodo_pago: input.metodo_pago || null,
            p_notas: input.notas || null,
        });

        if (error) throw error;
        return data as {
            venta_id: string;
            monto_base: number;
            iva_valor: number;
            retencion_valor: number;
            valor_neto: number;
        };
    },

    /**
     * @deprecated Usar createSale con RPC para cálculos automáticos
     */
    async createSaleLegacy(venta: Omit<Venta, 'id' | 'created_at' | 'updated_at'>) {
        const { data, error } = await supabase
            .from('ventas')
            .insert(venta)
            .select()
            .single();

        if (error) throw error;
        return data as Venta;
    },

    async updateSale(id: string, updates: Partial<Venta>) {
        const { data, error } = await supabase
            .from('ventas')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as Venta;
    },

    /**
     * Registra un pago con bloqueo FOR UPDATE para evitar race conditions
     * Usa: registrar_pago_venta RPC function
     * Valida con Zod antes de enviar
     */
    async recordPayment(input: {
        venta_id: string;
        monto: number;
        metodo_pago: 'efectivo' | 'transferencia' | 'tarjeta' | 'cheque' | 'otro';
        referencia?: string;
        notas?: string;
    }) {
        // Validar con Zod
        validateOrThrow(RegistrarPagoSchema, input);

        const { data, error } = await supabase.rpc('registrar_pago_venta', {
            p_venta_id: input.venta_id,
            p_monto_pago: input.monto,
            p_metodo_pago: input.metodo_pago,
            p_referencia: input.referencia || null,
            p_notas: input.notas || null,
        });

        if (error) throw error;
        return data as {
            success: boolean;
            venta_id: string;
            monto_pagado: number;
            total_pagado: number;
            estado_pago: string;
            saldo_pendiente: number;
        };
    },

    /**
     * @deprecated Usar recordPayment con RPC para operación atómica
     */
    async recordPaymentLegacy(id: string, valorPagado: number, fechaPago: string) {
        const { data: currentSales } = await supabase
            .from('ventas')
            .select('valor_venta_neto, iva_valor')
            .eq('id', id)
            .single();

        const total = (currentSales?.valor_venta_neto || 0) + (currentSales?.iva_valor || 0);

        let status: PaymentStatus = 'parcial';
        if (valorPagado >= total) {
            status = 'pagado';
        }

        return this.updateSale(id, {
            valor_pagado: valorPagado,
            fecha_pago_real: fechaPago,
            estado_pago: status
        });
    }
};
