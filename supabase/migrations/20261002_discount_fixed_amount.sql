-- Descuento por valor fijo (COP) además de porcentaje.
-- Cotizaciones / órdenes de producción: descuento por ítem.
ALTER TABLE public.quote_items
  ADD COLUMN IF NOT EXISTS descuento_tipo TEXT NOT NULL DEFAULT 'porcentaje'
    CHECK (descuento_tipo IN ('porcentaje', 'valor')),
  ADD COLUMN IF NOT EXISTS descuento_valor NUMERIC(14,2) NOT NULL DEFAULT 0
    CHECK (descuento_valor >= 0);

-- Órdenes de compra: descuento a nivel de orden, aplicado al subtotal antes del IVA.
ALTER TABLE public.purchase_orders
  ADD COLUMN IF NOT EXISTS descuento_tipo TEXT NOT NULL DEFAULT 'valor'
    CHECK (descuento_tipo IN ('porcentaje', 'valor')),
  ADD COLUMN IF NOT EXISTS descuento_porcentaje NUMERIC(5,2) NOT NULL DEFAULT 0
    CHECK (descuento_porcentaje >= 0 AND descuento_porcentaje <= 100),
  ADD COLUMN IF NOT EXISTS descuento_valor NUMERIC(14,2) NOT NULL DEFAULT 0
    CHECK (descuento_valor >= 0),
  ADD COLUMN IF NOT EXISTS descuento_monto NUMERIC(14,2) NOT NULL DEFAULT 0
    CHECK (descuento_monto >= 0);
