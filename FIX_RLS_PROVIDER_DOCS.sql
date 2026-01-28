-- ============================================================
-- LIMPIEZA Y RECREACIÓN DE POLÍTICAS RLS PARA provider_documents
-- ============================================================

-- Desactivar RLS temporalmente
ALTER TABLE provider_documents DISABLE ROW LEVEL SECURITY;

-- Eliminar TODAS las políticas existentes
DO $$
DECLARE
    pol_name TEXT;
BEGIN
    FOR pol_name IN
        SELECT policyname
        FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'provider_documents'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.provider_documents', pol_name);
        RAISE NOTICE 'Dropped policy: %', pol_name;
    END LOOP;
END $$;

-- ============================================================
-- CREAR POLÍTICAS NUEVAS PERMISIVAS
-- ============================================================

-- SELECT
CREATE POLICY "provider_docs_select_all"
    ON provider_documents FOR SELECT
    TO authenticated
    USING (true);

-- INSERT
CREATE POLICY "provider_docs_insert_all"
    ON provider_documents FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- UPDATE
CREATE POLICY "provider_docs_update_all"
    ON provider_documents FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- DELETE
CREATE POLICY "provider_docs_delete_all"
    ON provider_documents FOR DELETE
    TO authenticated
    USING (true);

-- Reactivar RLS
ALTER TABLE provider_documents ENABLE ROW LEVEL SECURITY;

-- Verificar
SELECT tablename, policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'provider_documents';
