-- Marca cuándo se notificó a contabilidad (con el PDF) la aprobación y causación de la legalización.
ALTER TABLE public.legalizaciones ADD COLUMN IF NOT EXISTS contabilidad_notificada_at TIMESTAMPTZ;
