-- Fonneta paga a 30 días desde la radicación en el sistema: el valor por defecto era 60.
-- Solo cambia el valor por defecto de las facturas NUEVAS; no modifica las existentes.
ALTER TABLE public.provider_invoices ALTER COLUMN plazo_pago SET DEFAULT 30;
