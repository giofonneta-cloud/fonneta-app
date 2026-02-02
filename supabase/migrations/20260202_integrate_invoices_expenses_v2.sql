-- ============================================
-- MIGRACIÓN: Integración Facturas -> Gastos V2
-- Fecha: 2026-02-02
-- Descripción: Agrega columnas financieras y plazo_pago a provider_invoices
-- ============================================

-- 1. Añadir columnas financieras
ALTER TABLE public.provider_invoices 
ADD COLUMN IF NOT EXISTS iva_valor DECIMAL(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS iva_porcentaje DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_con_iva DECIMAL(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS categoria TEXT,
ADD COLUMN IF NOT EXISTS expense_id UUID REFERENCES public.gastos(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS plazo_pago INTEGER DEFAULT 60;

-- 2. Actualizar comentarios
COMMENT ON COLUMN public.provider_invoices.iva_valor IS 'Valor calculado del IVA';
COMMENT ON COLUMN public.provider_invoices.iva_porcentaje IS 'Porcentaje de IVA aplicado';
COMMENT ON COLUMN public.provider_invoices.total_con_iva IS 'Monto total incluyendo IVA';
COMMENT ON COLUMN public.provider_invoices.categoria IS 'Categoría del gasto vinculada al sistema de finanzas';
COMMENT ON COLUMN public.provider_invoices.expense_id IS 'ID del gasto generado en la tabla public.gastos';
COMMENT ON COLUMN public.provider_invoices.plazo_pago IS 'Días de plazo para el pago desde el radicado';

-- 3. Verificación
DO $$
BEGIN
    RAISE NOTICE 'Migración de integración Facturas-Gastos completada';
END $$;
