-- =============================================
-- MÓDULO ÓRDENES DE COMPRA
-- Tablas: purchase_orders + purchase_order_items
-- =============================================

-- 1. PURCHASE_ORDERS
CREATE TABLE IF NOT EXISTS public.purchase_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    po_number TEXT NOT NULL UNIQUE,
    po_year INTEGER NOT NULL,
    po_sequence INTEGER NOT NULL,
    provider_id UUID REFERENCES public.providers(id) ON DELETE SET NULL,
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    recipient_name TEXT NOT NULL,
    recipient_nit TEXT,
    recipient_address TEXT,
    recipient_city TEXT,
    recipient_phone TEXT,
    recipient_email TEXT NOT NULL,
    authorized_by TEXT,
    cost_center TEXT,
    transport TEXT,
    description TEXT,
    subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
    iva_porcentaje DECIMAL(5,2) DEFAULT 0,
    iva_valor DECIMAL(12,2) DEFAULT 0,
    otros_impuestos DECIMAL(12,2) DEFAULT 0,
    total DECIMAL(12,2) NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'borrador'
        CHECK (status IN ('borrador','enviada','aceptada','completada','cancelada')),
    sent_at TIMESTAMPTZ,
    document_url TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_po_year_sequence ON public.purchase_orders(po_year, po_sequence);
CREATE INDEX IF NOT EXISTS idx_po_provider ON public.purchase_orders(provider_id);
CREATE INDEX IF NOT EXISTS idx_po_project ON public.purchase_orders(project_id);
CREATE INDEX IF NOT EXISTS idx_po_status ON public.purchase_orders(status);

CREATE OR REPLACE FUNCTION public.update_purchase_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER purchase_orders_updated_at
    BEFORE UPDATE ON public.purchase_orders
    FOR EACH ROW EXECUTE FUNCTION public.update_purchase_orders_updated_at();

CREATE OR REPLACE FUNCTION public.generate_po_number()
RETURNS TRIGGER AS $$
DECLARE current_year INTEGER; next_seq INTEGER;
BEGIN
    current_year := EXTRACT(YEAR FROM NOW())::INTEGER;
    SELECT COALESCE(MAX(po_sequence), 0) + 1 INTO next_seq
    FROM public.purchase_orders WHERE po_year = current_year;
    NEW.po_year := current_year;
    NEW.po_sequence := next_seq;
    NEW.po_number := 'OC' || LPAD(next_seq::TEXT, 3, '0') || '-' || current_year::TEXT;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_po_number_trigger
    BEFORE INSERT ON public.purchase_orders
    FOR EACH ROW EXECUTE FUNCTION public.generate_po_number();

ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage purchase_orders"
    ON public.purchase_orders FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 2. PURCHASE_ORDER_ITEMS
CREATE TABLE IF NOT EXISTS public.purchase_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_order_id UUID REFERENCES public.purchase_orders(id) ON DELETE CASCADE NOT NULL,
    tarifario_id UUID REFERENCES public.tarifario(id) ON DELETE SET NULL,
    descripcion TEXT NOT NULL,
    precio DECIMAL(12,2) NOT NULL CHECK (precio >= 0),
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_po_items_order ON public.purchase_order_items(purchase_order_id);

ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage po_items"
    ON public.purchase_order_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
