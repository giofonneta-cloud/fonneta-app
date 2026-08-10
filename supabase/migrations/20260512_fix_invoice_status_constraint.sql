-- ============================================
-- MIGRACIÓN: Fix provider_invoices status constraint
-- Fecha: 2026-05-12
-- Descripción: Asegurar que el estado 'devuelto' esté disponible
-- ============================================

-- 1. Verificar si la tabla existe
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'provider_invoices') THEN
    
    -- 2. Encontrar y dropear el constraint de status existente
    ALTER TABLE provider_invoices 
      DROP CONSTRAINT IF EXISTS provider_invoices_status_check;
    
    -- 3. Agregar el nuevo constraint con todos los estados válidos
    ALTER TABLE provider_invoices 
      ADD CONSTRAINT provider_invoices_status_check 
      CHECK (status IN ('pendiente', 'en_revision', 'aprobado', 'pagado', 'rechazado', 'devuelto'));
    
  END IF;
END $$;

