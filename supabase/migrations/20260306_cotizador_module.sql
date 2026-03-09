-- =============================================
-- MÓDULO COTIZADOR
-- Tablas: tarifario + cotizacion_items
-- =============================================

-- 1. TARIFARIO — Catálogo global de productos con precios
CREATE TABLE IF NOT EXISTS public.tarifario (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    descripcion TEXT,
    tipo TEXT NOT NULL CHECK (tipo IN ('editorial', 'evento', 'digital', 'btl')),
    cost_center TEXT CHECK (cost_center IN ('FUSCIA', 'SOHO', 'MONICA J', 'FONNETA', 'CLUB INDOMITAS')),
    unidad TEXT DEFAULT 'unidad',
    precio_piso DECIMAL(12,2) NOT NULL CHECK (precio_piso >= 0),
    precio_techo DECIMAL(12,2) NOT NULL CHECK (precio_techo >= 0),
    descuento_maximo DECIMAL(5,2) DEFAULT 0 CHECK (descuento_maximo >= 0 AND descuento_maximo <= 100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT precio_techo_gte_piso CHECK (precio_techo >= precio_piso)
);

CREATE INDEX IF NOT EXISTS idx_tarifario_tipo ON public.tarifario(tipo);
CREATE INDEX IF NOT EXISTS idx_tarifario_cost_center ON public.tarifario(cost_center);
CREATE INDEX IF NOT EXISTS idx_tarifario_active ON public.tarifario(is_active);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION public.update_tarifario_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tarifario_updated_at
    BEFORE UPDATE ON public.tarifario
    FOR EACH ROW EXECUTE FUNCTION public.update_tarifario_updated_at();

-- RLS
ALTER TABLE public.tarifario ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read tarifario"
    ON public.tarifario FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can insert tarifario"
    ON public.tarifario FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Authenticated users can update tarifario"
    ON public.tarifario FOR UPDATE
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can delete tarifario"
    ON public.tarifario FOR DELETE
    TO authenticated
    USING (true);


-- 2. COTIZACION_ITEMS — Ítems de cotización vinculados a proyectos
CREATE TABLE IF NOT EXISTS public.cotizacion_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    tarifario_id UUID REFERENCES public.tarifario(id) ON DELETE SET NULL,
    -- Snapshot del producto al momento de cotizar
    nombre TEXT NOT NULL,
    descripcion TEXT,
    tipo TEXT,
    cost_center TEXT,
    unidad TEXT DEFAULT 'unidad',
    -- Precios personalizados
    cantidad INTEGER DEFAULT 1 NOT NULL CHECK (cantidad > 0),
    precio_unitario DECIMAL(12,2) NOT NULL CHECK (precio_unitario >= 0),
    precio_piso DECIMAL(12,2),
    precio_techo DECIMAL(12,2),
    descuento_porcentaje DECIMAL(5,2) DEFAULT 0 CHECK (descuento_porcentaje >= 0 AND descuento_porcentaje <= 100),
    subtotal DECIMAL(12,2) NOT NULL CHECK (subtotal >= 0),
    notas TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_cotizacion_items_project ON public.cotizacion_items(project_id);
CREATE INDEX IF NOT EXISTS idx_cotizacion_items_tarifario ON public.cotizacion_items(tarifario_id);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION public.update_cotizacion_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cotizacion_items_updated_at
    BEFORE UPDATE ON public.cotizacion_items
    FOR EACH ROW EXECUTE FUNCTION public.update_cotizacion_items_updated_at();

-- RLS
ALTER TABLE public.cotizacion_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage cotizacion_items"
    ON public.cotizacion_items FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);
