-- =============================================
-- MÓDULO COTIZACIONES (PROPUESTAS COMERCIALES)
-- Tablas: quotes + quote_items
-- =============================================

-- 1. QUOTES
CREATE TABLE IF NOT EXISTS public.quotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quote_number TEXT NOT NULL UNIQUE,
    quote_year INTEGER NOT NULL,
    quote_sequence INTEGER NOT NULL,
    client_id UUID REFERENCES public.providers(id) ON DELETE SET NULL,
    client_name TEXT NOT NULL,
    client_contact_name TEXT,
    client_nit TEXT,
    client_address TEXT,
    client_city TEXT,
    client_phone TEXT,
    client_email TEXT NOT NULL,
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    cost_center TEXT,
    valid_until DATE,
    intro_text TEXT,
    closing_text TEXT,
    subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
    iva_porcentaje DECIMAL(5,2) DEFAULT 19,
    iva_valor DECIMAL(12,2) DEFAULT 0,
    total DECIMAL(12,2) NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'borrador'
        CHECK (status IN ('borrador','enviada','aceptada','rechazada')),
    sent_at TIMESTAMPTZ,
    document_url TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_quote_year_sequence ON public.quotes(quote_year, quote_sequence);
CREATE INDEX IF NOT EXISTS idx_quotes_client ON public.quotes(client_id);
CREATE INDEX IF NOT EXISTS idx_quotes_project ON public.quotes(project_id);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON public.quotes(status);
CREATE INDEX IF NOT EXISTS idx_quotes_created_by ON public.quotes(created_by);

CREATE OR REPLACE FUNCTION public.update_quotes_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER quotes_updated_at
    BEFORE UPDATE ON public.quotes
    FOR EACH ROW EXECUTE FUNCTION public.update_quotes_updated_at();

CREATE OR REPLACE FUNCTION public.generate_quote_number()
RETURNS TRIGGER AS $$
DECLARE current_year INTEGER; next_seq INTEGER;
BEGIN
    current_year := EXTRACT(YEAR FROM NOW())::INTEGER;
    SELECT COALESCE(MAX(quote_sequence), 0) + 1 INTO next_seq
    FROM public.quotes WHERE quote_year = current_year;
    NEW.quote_year := current_year;
    NEW.quote_sequence := next_seq;
    NEW.quote_number := 'COT' || LPAD(next_seq::TEXT, 3, '0') || '-' || current_year::TEXT;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_quote_number_trigger
    BEFORE INSERT ON public.quotes
    FOR EACH ROW EXECUTE FUNCTION public.generate_quote_number();

ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage quotes"
    ON public.quotes FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 2. QUOTE_ITEMS
CREATE TABLE IF NOT EXISTS public.quote_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quote_id UUID REFERENCES public.quotes(id) ON DELETE CASCADE NOT NULL,
    tarifario_id UUID REFERENCES public.tarifario(id) ON DELETE SET NULL,
    descripcion TEXT NOT NULL,
    cantidad DECIMAL(12,2) NOT NULL DEFAULT 1 CHECK (cantidad > 0),
    precio_unitario DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (precio_unitario >= 0),
    descuento_porcentaje DECIMAL(5,2) NOT NULL DEFAULT 0 CHECK (descuento_porcentaje >= 0 AND descuento_porcentaje <= 100),
    subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_quote_items_order ON public.quote_items(quote_id);

ALTER TABLE public.quote_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage quote_items"
    ON public.quote_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
