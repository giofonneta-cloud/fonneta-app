-- =============================================
-- MÓDULO RELEASE DOCUMENTS (AIM / OBR / COE)
-- Generación y envío de releases ligados a una Orden de Compra
-- =============================================

CREATE TABLE IF NOT EXISTS public.release_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    release_number TEXT NOT NULL UNIQUE,
    release_year INTEGER NOT NULL,
    release_month INTEGER NOT NULL,
    release_sequence INTEGER NOT NULL,
    tipo_release TEXT NOT NULL CHECK (tipo_release IN ('aim','obr','coe')),
    marca TEXT NOT NULL CHECK (marca IN ('FUSCIA','SOHO','MONICA J','FONNETA','CLUB INDOMITAS')),
    purchase_order_id UUID REFERENCES public.purchase_orders(id) ON DELETE SET NULL,
    provider_id UUID REFERENCES public.providers(id) ON DELETE SET NULL,
    recipient_email TEXT NOT NULL,
    recipient_name TEXT NOT NULL,
    campos JSONB NOT NULL DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'pendiente_firma'
        CHECK (status IN ('pendiente_firma','firmado')),
    document_url TEXT,
    signed_document_url TEXT,
    sent_at TIMESTAMPTZ,
    signed_at TIMESTAMPTZ,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Unicidad que previene condiciones de carrera en la numeración,
-- escalada por (tipo, año, mes) — igual patrón que idx_po_year_sequence.
CREATE UNIQUE INDEX IF NOT EXISTS idx_release_type_year_month_seq
    ON public.release_documents(tipo_release, release_year, release_month, release_sequence);

CREATE INDEX IF NOT EXISTS idx_release_po ON public.release_documents(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_release_provider ON public.release_documents(provider_id);
CREATE INDEX IF NOT EXISTS idx_release_status ON public.release_documents(status);

CREATE OR REPLACE FUNCTION public.update_release_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER release_documents_updated_at
    BEFORE UPDATE ON public.release_documents
    FOR EACH ROW EXECUTE FUNCTION public.update_release_documents_updated_at();

-- Genera: RELEASE-{TIPO}{AAAAMM}-{consecutivo de 2 dígitos, reinicia cada mes por tipo}
-- p.ej. RELEASE-AIM202602-01
CREATE OR REPLACE FUNCTION public.generate_release_number()
RETURNS TRIGGER AS $$
DECLARE current_year INTEGER; current_month INTEGER; next_seq INTEGER;
BEGIN
    current_year := EXTRACT(YEAR FROM NOW())::INTEGER;
    current_month := EXTRACT(MONTH FROM NOW())::INTEGER;

    SELECT COALESCE(MAX(release_sequence), 0) + 1 INTO next_seq
    FROM public.release_documents
    WHERE tipo_release = NEW.tipo_release
      AND release_year = current_year
      AND release_month = current_month;

    NEW.release_year := current_year;
    NEW.release_month := current_month;
    NEW.release_sequence := next_seq;
    NEW.release_number := 'RELEASE-' || UPPER(NEW.tipo_release)
        || current_year::TEXT || LPAD(current_month::TEXT, 2, '0')
        || '-' || LPAD(next_seq::TEXT, 2, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_release_number_trigger
    BEFORE INSERT ON public.release_documents
    FOR EACH ROW EXECUTE FUNCTION public.generate_release_number();

ALTER TABLE public.release_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage release_documents"
    ON public.release_documents FOR ALL TO authenticated USING (true) WITH CHECK (true);
