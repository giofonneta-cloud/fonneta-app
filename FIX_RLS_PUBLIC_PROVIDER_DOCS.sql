-- ============================================================
-- FIX RLS: HACER PÚBLICO provider_documents
-- ============================================================

-- Eliminar políticas anteriores (solo autenticados)
DROP POLICY IF EXISTS "provider_docs_select_all" ON provider_documents;
DROP POLICY IF EXISTS "provider_docs_insert_all" ON provider_documents;
DROP POLICY IF EXISTS "provider_docs_update_all" ON provider_documents;
DROP POLICY IF EXISTS "provider_docs_delete_all" ON provider_documents;

-- Crear políticas PÚBLICAS (anon + authenticated)
-- SELECT
CREATE POLICY "provider_docs_select_public"
    ON provider_documents FOR SELECT
    TO public
    USING (true);

-- INSERT
CREATE POLICY "provider_docs_insert_public"
    ON provider_documents FOR INSERT
    TO public
    WITH CHECK (true);

-- UPDATE
CREATE POLICY "provider_docs_update_public"
    ON provider_documents FOR UPDATE
    TO public
    USING (true)
    WITH CHECK (true);

-- DELETE
CREATE POLICY "provider_docs_delete_public"
    ON provider_documents FOR DELETE
    TO public
    USING (true);

-- Verificar
SELECT tablename, policyname, roles, cmd
FROM pg_policies
WHERE tablename = 'provider_documents';
