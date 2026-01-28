-- SOLUCIÓN DEFINITIVA: Eliminar todas las policies restrictivas y crear unas simples

-- =====================================================
-- FIX: project_tasks policies
-- =====================================================

-- Eliminar TODAS las policies existentes
DO $$
DECLARE
    pol_name TEXT;
BEGIN
    FOR pol_name IN
        SELECT policyname
        FROM pg_policies
        WHERE tablename = 'project_tasks'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON project_tasks', pol_name);
    END LOOP;
END $$;

-- Crear policies simples y permisivas (SOLO para usuarios autenticados)

CREATE POLICY "allow_all_authenticated_select"
    ON project_tasks FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "allow_all_authenticated_insert"
    ON project_tasks FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "allow_all_authenticated_update"
    ON project_tasks FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "allow_all_authenticated_delete"
    ON project_tasks FOR DELETE
    TO authenticated
    USING (true);

-- =====================================================
-- FIX: project_comments policies
-- =====================================================

-- Eliminar TODAS las policies existentes
DO $$
DECLARE
    pol_name TEXT;
BEGIN
    FOR pol_name IN
        SELECT policyname
        FROM pg_policies
        WHERE tablename = 'project_comments'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON project_comments', pol_name);
    END LOOP;
END $$;

-- Crear policies simples para comentarios

CREATE POLICY "allow_all_authenticated_select_comments"
    ON project_comments FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "allow_all_authenticated_insert_comments"
    ON project_comments FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "allow_all_authenticated_update_comments"
    ON project_comments FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "allow_all_authenticated_delete_comments"
    ON project_comments FOR DELETE
    TO authenticated
    USING (true);

-- Verificar que RLS está habilitado
ALTER TABLE project_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_comments ENABLE ROW LEVEL SECURITY;
