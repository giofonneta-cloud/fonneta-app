-- ============================================
-- MIGRACIÓN: Fix Invoice Devuelto Status and Notifications
-- Fecha: 2026-02-26
-- ============================================

-- 1. Fix provider_invoices status check constraint
DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Find and drop existing check constraint on status
    FOR r IN (
        SELECT conname 
        FROM pg_constraint 
        WHERE conrelid = 'provider_invoices'::regclass AND (conname LIKE '%status%' OR pg_get_constraintdef(oid) LIKE '%status%')
    ) LOOP
        EXECUTE 'ALTER TABLE provider_invoices DROP CONSTRAINT IF EXISTS ' || quote_ident(r.conname);
    END LOOP;
END $$;

ALTER TABLE provider_invoices
  ADD CONSTRAINT provider_invoices_status_check 
  CHECK (status IN ('pendiente', 'en_revision', 'aprobado', 'pagado', 'rechazado', 'devuelto'));

-- 2. Fix notifications INSERT policy
DROP POLICY IF EXISTS "Admins and System can insert notifications" ON notifications;
CREATE POLICY "Authenticated users can insert notifications"
  ON notifications
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);
