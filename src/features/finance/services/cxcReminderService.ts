import { supabase } from '@/shared/lib/supabase';

export type CxcReminderTipo = 'previo_5d' | 'vencimiento' | 'vencida_8d';

export interface CxcReminder {
    id: string;
    venta_id: string;
    tipo: CxcReminderTipo;
    dias_relativos: number;
    recipient_email: string;
    test_mode: boolean;
    sent_at: string;
    created_at: string;
}

export interface CxcRemindersRunSummary {
    success: boolean;
    checked: number;
    sent: number;
    skipped: number;
    sinEmail: number;
    yaEnviado: number;
    errores: number;
    testMode: boolean;
}

export const cxcReminderService = {
    // Recordatorios enviados, agrupados por venta_id (para el seguimiento en CXC).
    async getByVentaIds(ventaIds: string[]): Promise<Record<string, CxcReminder[]>> {
        if (ventaIds.length === 0) return {};
        const { data, error } = await supabase
            .from('cxc_reminders')
            .select('*')
            .in('venta_id', ventaIds)
            .order('sent_at', { ascending: false });

        if (error) throw error;

        const map: Record<string, CxcReminder[]> = {};
        for (const r of (data ?? []) as CxcReminder[]) {
            (map[r.venta_id] ??= []).push(r);
        }
        return map;
    },

    // Dispara manualmente la corrida de recordatorios (mismo endpoint que el cron).
    async runNow(): Promise<CxcRemindersRunSummary> {
        const res = await fetch('/api/cxc/send-reminders', { method: 'POST' });
        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.error || 'Error al enviar recordatorios');
        }
        return res.json();
    },
};
