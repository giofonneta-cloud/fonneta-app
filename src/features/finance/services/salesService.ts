import { supabase } from '@/shared/lib/supabase';
import { Venta, PaymentStatus } from '../types/sales-expenses.types';

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
     * Crea una venta con cálculos automáticos de IVA
     * Inserta directamente en la tabla ventas
     */
    async createSale(input: {
        proyecto_id: string;
        cliente_id: string;
        valor_venta_neto: number;
        iva_porcentaje?: number;
        line_of_business?: string;
        estado_oc?: 'oc_recibida' | 'facturar_sin_oc';
        numero_oc?: string;
        numero_factura?: string;
        fecha_factura?: string;
        plazo_pago_dias?: number;
        fecha_cobro_estimada?: string;
        comercial_id?: string;
        porcentaje_comision?: number;
        notas_internas?: string;
    }) {
        // Calcular IVA automáticamente
        const ivaPorcentaje = input.iva_porcentaje ?? 19;
        const ivaValor = input.valor_venta_neto * (ivaPorcentaje / 100);
        const totalConIva = input.valor_venta_neto + ivaValor;
        const valorComision = input.porcentaje_comision
            ? input.valor_venta_neto * (input.porcentaje_comision / 100)
            : 0;

        const payload = {
            proyecto_id: input.proyecto_id,
            cliente_id: input.cliente_id,
            valor_venta_neto: input.valor_venta_neto,
            iva_porcentaje: ivaPorcentaje,
            iva_valor: ivaValor,
            total_con_iva: totalConIva,
            line_of_business: input.line_of_business || null,
            estado_oc: input.estado_oc || 'oc_recibida',
            numero_oc: input.numero_oc || null,
            numero_factura: input.numero_factura || null,
            fecha_factura: input.fecha_factura || null,
            plazo_pago_dias: input.plazo_pago_dias || 30,
            fecha_cobro_estimada: input.fecha_cobro_estimada || null,
            comercial_id: input.comercial_id || null,
            porcentaje_comision: input.porcentaje_comision || 0,
            valor_comision: valorComision,
            valor_pagado: 0,
            estado_pago: 'pendiente',
            notas_internas: input.notas_internas || null,
        };

        console.log("💾 Insertando venta:", payload);

        const { data, error } = await supabase
            .from('ventas')
            .insert(payload)
            .select()
            .single();

        if (error) {
            console.error("❌ Error al crear venta:", error);
            throw error;
        }

        console.log("✅ Venta creada:", data);
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
     * Registra un pago para una venta
     * Calcula automáticamente el estado (pendiente, parcial, pagado)
     */
    async recordPayment(id: string, valorPagado: number, fechaPago: string) {
        // Obtener la venta actual para calcular el total
        const { data: currentSale, error: fetchError } = await supabase
            .from('ventas')
            .select('valor_venta_neto, iva_valor, valor_pagado')
            .eq('id', id)
            .single();

        if (fetchError) throw fetchError;

        const total = (currentSale?.valor_venta_neto || 0) + (currentSale?.iva_valor || 0);
        const nuevoValorPagado = (currentSale?.valor_pagado || 0) + valorPagado;

        // Determinar estado de pago
        let status: PaymentStatus = 'pendiente';
        if (nuevoValorPagado >= total) {
            status = 'pagado';
        } else if (nuevoValorPagado > 0) {
            status = 'parcial';
        }

        return this.updateSale(id, {
            valor_pagado: nuevoValorPagado,
            fecha_pago_real: fechaPago,
            estado_pago: status
        });
    }
};
