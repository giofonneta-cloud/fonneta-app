-- ============================================================
-- 🚨 FIX DEFINITIVO: POLÍTICAS RLS PARA TAREAS
-- ============================================================
-- Ejecuta este SQL en: https://supabase.com/dashboard/project/dmdnxgthekbslzehctgn/sql/new
-- ============================================================

-- PASO 1: Desactivar RLS temporalmente
ALTER TABLE project_tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE project_comments DISABLE ROW LEVEL SECURITY;

-- PASO 2: Eliminar TODAS las políticas antiguas de project_tasks
DO $$
DECLARE
    pol_name TEXT;
BEGIN
    FOR pol_name IN
        SELECT policyname
        FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'project_tasks'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.project_tasks', pol_name);
        RAISE NOTICE 'Eliminada policy de tasks: %', pol_name;
    END LOOP;
END $$;

-- PASO 3: Eliminar TODAS las políticas antiguas de project_comments
DO $$
DECLARE
    pol_name TEXT;
BEGIN
    FOR pol_name IN
        SELECT policyname
        FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'project_comments'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.project_comments', pol_name);
        RAISE NOTICE 'Eliminada policy de comments: %', pol_name;
    END LOOP;
END $$;

-- PASO 4: Crear políticas SUPER SIMPLES para project_tasks
CREATE POLICY "tasks_select_all"
    ON project_tasks FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "tasks_insert_all"
    ON project_tasks FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "tasks_update_all"
    ON project_tasks FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "tasks_delete_all"
    ON project_tasks FOR DELETE
    TO authenticated
    USING (true);

-- PASO 5: Crear políticas SUPER SIMPLES para project_comments
CREATE POLICY "comments_select_all"
    ON project_comments FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "comments_insert_all"
    ON project_comments FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "comments_update_all"
    ON project_comments FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "comments_delete_all"
    ON project_comments FOR DELETE
    TO authenticated
    USING (true);

-- PASO 6: Reactivar RLS
ALTER TABLE project_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_comments ENABLE ROW LEVEL SECURITY;

-- PASO 7: Verificar que se crearon correctamente
SELECT
    schemaname,
    tablename,
    policyname,
    cmd,
    CASE WHEN qual::text = 'true' THEN '✅ Permite TODO' ELSE qual::text END as condicion
FROM pg_policies
WHERE tablename IN ('project_tasks', 'project_comments')
ORDER BY tablename, policyname;

-- ============================================================
-- ✅ RESULTADO ESPERADO:
-- Deberías ver 8 políticas con "✅ Permite TODO":
--
-- project_comments | comments_delete_all | DELETE | ✅ Permite TODO
-- project_comments | comments_insert_all | INSERT | ✅ Permite TODO
-- project_comments | comments_select_all | SELECT | ✅ Permite TODO
-- project_comments | comments_update_all | UPDATE | ✅ Permite TODO
-- project_tasks    | tasks_delete_all    | DELETE | ✅ Permite TODO
-- project_tasks    | tasks_insert_all    | INSERT | ✅ Permite TODO
-- project_tasks    | tasks_select_all    | SELECT | ✅ Permite TODO
-- project_tasks    | tasks_update_all    | UPDATE | ✅ Permite TODO
-- ============================================================
