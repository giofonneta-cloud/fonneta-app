-- ============================================================
-- FIX ULTRA AGRESIVO: Elimina TODAS las políticas y crea nuevas
-- ============================================================
-- Ejecuta en: https://supabase.com/dashboard/project/dmdnxgthekbslzehctgn/sql/new

-- PASO 1: Deshabilitar RLS temporalmente para limpiar
ALTER TABLE project_tasks DISABLE ROW LEVEL SECURITY;

-- PASO 2: Eliminar TODAS las políticas con un loop dinámico
DO $$
DECLARE
    pol record;
BEGIN
    FOR pol IN
        SELECT policyname
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'project_tasks'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON project_tasks', pol.policyname);
    END LOOP;
END $$;

-- PASO 3: Habilitar RLS de nuevo
ALTER TABLE project_tasks ENABLE ROW LEVEL SECURITY;

-- PASO 4: Crear políticas ULTRA PERMISIVAS
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

-- PASO 5: Verificar que SOLO existen las 4 nuevas
SELECT policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'project_tasks'
ORDER BY cmd;

-- ============================================================
-- RESULTADO ESPERADO: Exactamente 4 filas
-- delete_authenticated | DELETE
-- insert_authenticated | INSERT
-- select_authenticated | SELECT
-- update_authenticated | UPDATE
-- ============================================================
