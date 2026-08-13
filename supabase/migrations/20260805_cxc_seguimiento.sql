-- =============================================
-- SEGUIMIENTO DE COBRO CXC (unificado)
-- Registra tanto los recordatorios automáticos (correo) como las
-- gestiones manuales (correo, llamada, nota) en una sola bitácora por factura.
-- =============================================

CREATE TABLE IF NOT EXISTS public.cxc_seguimiento (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venta_id UUID REFERENCES public.ventas(id) ON DELETE CASCADE NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('correo_recordatorio', 'correo', 'llamada', 'nota', 'otro')),
    descripcion TEXT,
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    es_automatico BOOLEAN NOT NULL DEFAULT false,
    -- Campos solo para recordatorios automáticos (dedup + trazabilidad)
    recordatorio_tipo TEXT CHECK (recordatorio_tipo IN ('previo_5d', 'vencimiento', 'vencida_8d')),
    dias_relativos INTEGER,
    recipient_email TEXT,
    test_mode BOOLEAN NOT NULL DEFAULT false,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Deduplicación de envíos automáticos: un recordatorio por (venta, día relativo, test_mode).
CREATE UNIQUE INDEX IF NOT EXISTS idx_cxc_seg_auto_dedup
    ON public.cxc_seguimiento(venta_id, dias_relativos, test_mode)
    WHERE es_automatico;

CREATE INDEX IF NOT EXISTS idx_cxc_seg_venta ON public.cxc_seguimiento(venta_id);

ALTER TABLE public.cxc_seguimiento ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage cxc_seguimiento"
    ON public.cxc_seguimiento FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Reemplaza la tabla anterior (solo contenía datos de prueba).
DROP TABLE IF EXISTS public.cxc_reminders;
