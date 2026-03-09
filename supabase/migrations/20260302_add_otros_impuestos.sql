-- Agregar columna otros_impuestos a la tabla gastos
ALTER TABLE public.gastos
ADD COLUMN IF NOT EXISTS otros_impuestos DECIMAL(12,2) DEFAULT 0.00;

-- Comentario para documentar
COMMENT ON COLUMN public.gastos.otros_impuestos IS 'Otros impuestos aplicables: retenciones, ICA, etc.';
