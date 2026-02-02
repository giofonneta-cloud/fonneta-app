-- ============================================
-- MIGRACIÓN: Módulo de Facturación para Proveedores
-- Fecha: 2026-01-30
-- Descripción: Tabla provider_invoices con RLS para autogestión de proveedores
-- PRP: PRP-001-portal-autoservicio-proveedores.md
-- ============================================

-- ============================================
-- 1. CREAR TABLA provider_invoices
-- ============================================
CREATE TABLE provider_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,

  -- Datos de factura
  invoice_number VARCHAR(100) NOT NULL,
  invoice_type VARCHAR(50) NOT NULL CHECK (invoice_type IN ('factura', 'cuenta_cobro')),
  issue_date DATE NOT NULL,
  due_date DATE,
  amount DECIMAL(15,2) NOT NULL CHECK (amount >= 0),
  concept TEXT NOT NULL,

  -- Documento adjunto
  document_url TEXT,

  -- Estado y validación
  status VARCHAR(50) NOT NULL DEFAULT 'pendiente'
    CHECK (status IN ('pendiente', 'en_revision', 'aprobado', 'pagado', 'rechazado')),
  payment_date DATE,
  admin_notes TEXT,

  -- Auditoría
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraint: invoice_number único por proveedor
  CONSTRAINT unique_invoice_number_provider UNIQUE(provider_id, invoice_number)
);

-- ============================================
-- 2. ÍNDICES para performance
-- ============================================
CREATE INDEX idx_invoices_provider ON provider_invoices(provider_id);
CREATE INDEX idx_invoices_status ON provider_invoices(status);
CREATE INDEX idx_invoices_issue_date ON provider_invoices(issue_date DESC);

-- ============================================
-- 3. TRIGGER para updated_at
-- ============================================
CREATE TRIGGER update_provider_invoices_updated_at
  BEFORE UPDATE ON provider_invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 4. HABILITAR RLS
-- ============================================
ALTER TABLE provider_invoices ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 5. POLÍTICAS RLS
-- ============================================

-- SELECT: Proveedor ve sus facturas, admin/administrativo ven todas
DROP POLICY IF EXISTS "invoices_select_policy" ON provider_invoices;
CREATE POLICY "invoices_select_policy" ON provider_invoices
  FOR SELECT
  USING (
    -- Proveedor ve solo sus facturas
    provider_id IN (
      SELECT id FROM providers WHERE user_id = auth.uid()
    )
    -- Admin y Administrativo ven todas
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'administrativo')
    )
  );

-- INSERT: Proveedor crea sus facturas, admin/administrativo pueden crear para cualquiera
DROP POLICY IF EXISTS "invoices_insert_policy" ON provider_invoices;
CREATE POLICY "invoices_insert_policy" ON provider_invoices
  FOR INSERT
  WITH CHECK (
    -- Proveedor inserta solo para su provider_id
    provider_id IN (
      SELECT id FROM providers WHERE user_id = auth.uid()
    )
    -- Admin y Administrativo pueden insertar para cualquier proveedor
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'administrativo')
    )
  );

-- UPDATE: Proveedor actualiza sus facturas, admin actualiza todo
DROP POLICY IF EXISTS "invoices_update_policy" ON provider_invoices;
CREATE POLICY "invoices_update_policy" ON provider_invoices
  FOR UPDATE
  USING (
    -- Proveedor actualiza solo sus facturas
    provider_id IN (
      SELECT id FROM providers WHERE user_id = auth.uid()
    )
    -- Admin y Administrativo actualizan todas
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'administrativo')
    )
  );

-- DELETE: Solo admin puede eliminar
DROP POLICY IF EXISTS "invoices_delete_policy" ON provider_invoices;
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
-- 6. COMENTARIOS para documentación
-- ============================================
COMMENT ON TABLE provider_invoices IS 'Facturas y cuentas de cobro registradas por proveedores';
COMMENT ON COLUMN provider_invoices.invoice_type IS 'Tipo: factura (PJ) o cuenta_cobro (PN)';
COMMENT ON COLUMN provider_invoices.status IS 'Estado: pendiente -> en_revision -> aprobado -> pagado (o rechazado)';
COMMENT ON COLUMN provider_invoices.admin_notes IS 'Notas del admin (visibles para proveedor)';
