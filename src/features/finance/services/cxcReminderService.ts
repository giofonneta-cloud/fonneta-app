import { supabase } from '@/shared/lib/supabase';

export type SeguimientoTipo = 'correo_recordatorio' | 'correo' | 'llamada' | 'nota' | 'otro';
export type RecordatorioTipo = 'previo_5d' | 'vencimiento' | 'vencida_8d';

export interface SeguimientoEntry {
    id: string;
    venta_id: string;
    tipo: SeguimientoTipo;
    descripcion: string | null;
    fecha: string;
    es_automatico: boolean;
    recordatorio_tipo: RecordatorioTipo | null;
    dias_relativos: number | null;
    recipient_email: string | null;
    test_mode: boolean;
    created_by: string | null;
    created_at: string;
}

export interface CxcRemindersRunSummary {
    success: boolean;
    checked: number; // facturas revisadas (ya agrupadas por número de factura)
    itemsConsolidados: number; // ítems extra fusionados en un solo correo (facturas divididas por centro de costo/producto)
    sent: number;
    skipped: number;
    sinEmail: number;
    yaEnviado: number;
    errores: number;
    testMode: boolean;
}

export const cxcReminderService = {
    // Bitácora de seguimiento (auto + manual) agrupada por venta_id.
    async getByVentaIds(ventaIds: string[]): Promise<Record<string, SeguimientoEntry[]>> {
        if (ventaIds.length === 0) return {};
        const { data, error } = await supabase
            .from('cxc_seguimiento')
            .select('*')
            .in('venta_id', ventaIds)
            .order('fecha', { ascending: false })
            .order('created_at', { ascending: false });

        if (error) throw error;

        const map: Record<string, SeguimientoEntry[]> = {};
        for (const r of (data ?? []) as SeguimientoEntry[]) {
            (map[r.venta_id] ??= []).push(r);
        }
        return map;
    },

    // Registra una gestión manual de cobro (correo, llamada, nota, otro).
    async addManual(ventaId: string, input: { tipo: Exclude<SeguimientoTipo, 'correo_recordatorio'>; fecha: string; descripcion: string }): Promise<SeguimientoEntry> {
        const { data: userData } = await supabase.auth.getUser();
        const { data, error } = await supabase
            .from('cxc_seguimiento')
            .insert({
                venta_id: ventaId,
                tipo: input.tipo,
                descripcion: input.descripcion,
                fecha: input.fecha,
                es_automatico: false,
                created_by: userData.user?.id ?? null,
            })
            .select()
            .single();

        if (error) throw error;
        return data as SeguimientoEntry;
    },

    async deleteEntry(id: string): Promise<void> {
        const { error } = await supabase.from('cxc_seguimiento').delete().eq('id', id);
        if (error) throw error;
    },

    // Dispara manualmente la corrida de recordatorios automáticos (mismo endpoint que el cron).
    async runNow(): Promise<CxcRemindersRunSummary> {
        const res = await fetch('/api/cxc/send-reminders', { method: 'POST' });
        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.error || 'Error al enviar recordatorios');
        }
        return res.json();
    },
};
