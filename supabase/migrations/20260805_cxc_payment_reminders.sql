-- =============================================
-- RECORDATORIOS DE PAGO CXC (Cuentas por Cobrar)
-- Log de recordatorios enviados a clientes + deduplicación
-- =============================================

CREATE TABLE IF NOT EXISTS public.cxc_reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venta_id UUID REFERENCES public.ventas(id) ON DELETE CASCADE NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('previo_5d', 'vencimiento', 'vencida_8d')),
    dias_relativos INTEGER NOT NULL,
    recipient_email TEXT NOT NULL,
    test_mode BOOLEAN NOT NULL DEFAULT false,
    sent_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Evita enviar dos veces el mismo recordatorio (mismo día relativo) para una venta.
-- Se incluye test_mode para que los envíos de prueba no bloqueen los reales.
CREATE UNIQUE INDEX IF NOT EXISTS idx_cxc_reminder_dedup
    ON public.cxc_reminders(venta_id, dias_relativos, test_mode);

CREATE INDEX IF NOT EXISTS idx_cxc_reminder_venta ON public.cxc_reminders(venta_id);

ALTER TABLE public.cxc_reminders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage cxc_reminders"
    ON public.cxc_reminders FOR ALL TO authenticated USING (true) WITH CHECK (true);
