-- ============================================
-- MIGRACIÓN: Corregir RLS para Registro de Proveedores
-- Fecha: 2026-01-31
-- Descripción: Permite que nuevos usuarios puedan crear su perfil y registro de proveedor
-- ============================================

-- ============================================
-- 1. PROFILES: Permitir INSERT para usuarios autenticados (su propio perfil)
-- ============================================
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;

CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT
WITH CHECK (
    -- Usuario puede crear su propio perfil (id debe coincidir con auth.uid())
    id = auth.uid()
);

-- Asegurar que usuarios pueden leer su propio perfil
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;

CREATE POLICY "profiles_select_own" ON profiles FOR SELECT
USING (
    id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'administrativo'))
);

-- ============================================
-- 2. PROVIDERS: Permitir INSERT para proveedores (su propio registro)
-- ============================================
DROP POLICY IF EXISTS "providers_insert_policy" ON providers;

CREATE POLICY "providers_insert_policy" ON providers FOR INSERT
WITH CHECK (
    -- Admin y Administrativo pueden crear cualquier proveedor
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'administrativo'))
    -- Usuario autenticado puede crear proveedor vinculado a sí mismo
    OR (user_id = auth.uid())
);

-- ============================================
-- 3. PROVIDER_DOCUMENTS: Permitir INSERT para proveedores
-- ============================================
DROP POLICY IF EXISTS "provider_documents_insert_policy" ON provider_documents;

CREATE POLICY "provider_documents_insert_policy" ON provider_documents FOR INSERT
WITH CHECK (
    -- Proveedor puede subir sus propios documentos
    provider_id IN (SELECT id FROM providers WHERE user_id = auth.uid())
    -- Admin puede subir para cualquier proveedor
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'administrativo'))
);

-- Asegurar SELECT para provider_documents
DROP POLICY IF EXISTS "provider_documents_select_policy" ON provider_documents;

CREATE POLICY "provider_documents_select_policy" ON provider_documents FOR SELECT
USING (
    -- Proveedor ve sus documentos
    provider_id IN (SELECT id FROM providers WHERE user_id = auth.uid())
    -- Admin ve todos
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'administrativo'))
);

-- Permitir UPDATE para reemplazar documentos
DROP POLICY IF EXISTS "provider_documents_update_policy" ON provider_documents;

CREATE POLICY "provider_documents_update_policy" ON provider_documents FOR UPDATE
USING (
    provider_id IN (SELECT id FROM providers WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'administrativo'))
)
WITH CHECK (
    provider_id IN (SELECT id FROM providers WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'administrativo'))
);

-- ============================================
-- VERIFICACIÓN
-- ============================================
DO $$
BEGIN
    RAISE NOTICE 'RLS corregido para: profiles (INSERT own), providers (INSERT self), provider_documents (INSERT/SELECT/UPDATE)';
END $$;
