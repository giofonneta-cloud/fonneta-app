-- ============================================================
-- FIX DEFINITIVO RLS PARA project_tasks
-- ============================================================
-- Ejecuta este SQL en: https://supabase.com/dashboard/project/dmdnxgthekbslzehctgn/sql/new

-- PASO 1: Ver políticas actuales (simplificado)
SELECT policyname, cmd
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'project_tasks';

-- PASO 2: Eliminar TODAS las políticas existentes
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
DROP POLICY IF EXISTS "allow_all_select" ON project_tasks;
DROP POLICY IF EXISTS "allow_all_insert" ON project_tasks;
DROP POLICY IF EXISTS "allow_all_update" ON project_tasks;
DROP POLICY IF EXISTS "allow_all_delete" ON project_tasks;

-- PASO 3: Crear políticas ULTRA PERMISIVAS
CREATE POLICY "select_authenticated"
ON project_tasks FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "insert_authenticated"
ON project_tasks FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "update_authenticated"
ON project_tasks FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "delete_authenticated"
ON project_tasks FOR DELETE
TO authenticated
USING (true);

-- PASO 4: Verificar que las 4 políticas nuevas existen
SELECT policyname, cmd, roles
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'project_tasks'
ORDER BY cmd;

-- ============================================================
-- RESULTADO ESPERADO: Deberías ver exactamente 4 políticas:
-- select_authenticated | SELECT | {authenticated}
-- insert_authenticated | INSERT | {authenticated}
-- update_authenticated | UPDATE | {authenticated}
-- delete_authenticated | DELETE | {authenticated}
-- ============================================================
