-- ============================================================
-- DIAGNÓSTICO COMPLETO DE RLS PARA project_tasks
-- ============================================================
-- Ejecuta este SQL en: https://supabase.com/dashboard/project/dmdnxgthekbslzehctgn/sql/new

-- 1. Ver TODAS las políticas actuales en project_tasks
SELECT
    policyname AS "Nombre Política",
    cmd AS "Comando",
    roles AS "Roles",
    CASE
        WHEN qual IS NOT NULL THEN pg_get_expr(qual, 'project_tasks'::regclass)
        ELSE 'true'
    END AS "USING (condición)",
    CASE
        WHEN with_check IS NOT NULL THEN pg_get_expr(with_check, 'project_tasks'::regclass)
        ELSE 'true'
    END AS "WITH CHECK (condición)"
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'project_tasks'
ORDER BY policyname;

-- 2. Verificar si RLS está habilitado
SELECT
    tablename,
    rowsecurity AS "RLS Habilitado"
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'project_tasks';

-- 3. Ver tu user_id actual
SELECT auth.uid() AS "Mi User ID Actual";

-- 4. SOLUCIÓN: Eliminar TODAS las políticas y crear nuevas ULTRA SIMPLES
-- ============================================================

-- PASO 1: Eliminar TODAS las políticas existentes
DROP POLICY IF EXISTS "tasks_select_all" ON project_tasks;
DROP POLICY IF EXISTS "tasks_insert_all" ON project_tasks;
DROP POLICY IF EXISTS "tasks_update_all" ON project_tasks;
DROP POLICY IF EXISTS "tasks_delete_all" ON project_tasks;
DROP POLICY IF EXISTS "Users can view tasks of their projects" ON project_tasks;
DROP POLICY IF EXISTS "Users can create tasks in their projects" ON project_tasks;
DROP POLICY IF EXISTS "Users can update tasks they created or are assigned to" ON project_tasks;
DROP POLICY IF EXISTS "Users can delete tasks they created" ON project_tasks;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON project_tasks;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON project_tasks;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON project_tasks;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON project_tasks;

-- PASO 2: Crear políticas ULTRA PERMISIVAS para usuarios autenticados
CREATE POLICY "allow_all_select"
ON project_tasks FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "allow_all_insert"
ON project_tasks FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "allow_all_update"
ON project_tasks FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "allow_all_delete"
ON project_tasks FOR DELETE
TO authenticated
USING (true);

-- PASO 3: Verificar que las nuevas políticas existen
SELECT policyname, cmd
FROM pg_policies
WHERE tablename = 'project_tasks';

-- ============================================================
-- RESULTADO ESPERADO:
-- Deberías ver 4 políticas:
-- - allow_all_select (SELECT)
-- - allow_all_insert (INSERT)
-- - allow_all_update (UPDATE)
-- - allow_all_delete (DELETE)
-- ============================================================
