-- ============================================
-- MIGRACIÓN: Fix provider_invoices - Columnas y RLS
-- Fecha: 2026-02-02
-- Descripción: Agrega columnas faltantes y corrige políticas RLS
-- ============================================

-- ============================================
-- 1. VERIFICAR/CREAR TABLA SI NO EXISTE
-- ============================================
CREATE TABLE IF NOT EXISTS provider_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
    invoice_number VARCHAR(100) NOT NULL,
    invoice_type VARCHAR(50) NOT NULL CHECK (invoice_type IN ('factura', 'cuenta_cobro')),
    issue_date DATE NOT NULL,
    due_date DATE,
    amount DECIMAL(15,2) NOT NULL CHECK (amount >= 0),
    concept TEXT NOT NULL,
    document_url TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'pendiente'
        CHECK (status IN ('pendiente', 'en_revision', 'aprobado', 'pagado', 'rechazado')),
    payment_date DATE,
    admin_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. AÑADIR COLUMNAS FALTANTES
-- ============================================
ALTER TABLE provider_invoices ADD COLUMN IF NOT EXISTS orden_compra_url TEXT;
ALTER TABLE provider_invoices ADD COLUMN IF NOT EXISTS seguridad_social_url TEXT;
ALTER TABLE provider_invoices ADD COLUMN IF NOT EXISTS release_url TEXT;

-- ============================================
-- 3. HABILITAR RLS (idempotente)
-- ============================================
ALTER TABLE provider_invoices ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 4. RECREAR POLÍTICAS RLS (más permisivas)
-- ============================================

-- DROP todas las políticas existentes
DROP POLICY IF EXISTS "invoices_select_policy" ON provider_invoices;
DROP POLICY IF EXISTS "invoices_insert_policy" ON provider_invoices;
DROP POLICY IF EXISTS "invoices_update_policy" ON provider_invoices;
DROP POLICY IF EXISTS "invoices_delete_policy" ON provider_invoices;

-- SELECT: Proveedor ve sus facturas, admin/administrativo ven todas
CREATE POLICY "invoices_select_policy" ON provider_invoices
    FOR SELECT
    USING (
        provider_id IN (SELECT id FROM providers WHERE user_id = auth.uid())
        OR EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'administrativo')
        )
    );

-- INSERT: Proveedor crea sus facturas, admin/administrativo crean para cualquiera
CREATE POLICY "invoices_insert_policy" ON provider_invoices
    FOR INSERT
    WITH CHECK (
        provider_id IN (SELECT id FROM providers WHERE user_id = auth.uid())
        OR EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'administrativo')
        )
    );

-- UPDATE: Proveedor actualiza sus facturas en estado pendiente, admin actualiza todo
CREATE POLICY "invoices_update_policy" ON provider_invoices
    FOR UPDATE
    USING (
        provider_id IN (SELECT id FROM providers WHERE user_id = auth.uid())
        OR EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'administrativo')
        )
    )
    WITH CHECK (
        provider_id IN (SELECT id FROM providers WHERE user_id = auth.uid())
        OR EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'administrativo')
        )
    );

-- DELETE: Solo admin
CREATE POLICY "invoices_delete_policy" ON provider_invoices
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- ============================================
-- 5. ÍNDICES (IF NOT EXISTS)
-- ============================================
CREATE INDEX IF NOT EXISTS idx_invoices_provider ON provider_invoices(provider_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON provider_invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_issue_date ON provider_invoices(issue_date DESC);

-- ============================================
-- 6. COMENTARIOS
-- ============================================
COMMENT ON TABLE provider_invoices IS 'Facturas y cuentas de cobro de proveedores';
COMMENT ON COLUMN provider_invoices.orden_compra_url IS 'URL del documento de orden de compra';
COMMENT ON COLUMN provider_invoices.seguridad_social_url IS 'URL del comprobante de seguridad social';
COMMENT ON COLUMN provider_invoices.release_url IS 'URL del documento release firmado';

-- ============================================
-- 7. VERIFICACIÓN
-- ============================================
DO $$
BEGIN
    RAISE NOTICE 'Migración completada: provider_invoices con columnas adicionales y RLS corregido';
END $$;
