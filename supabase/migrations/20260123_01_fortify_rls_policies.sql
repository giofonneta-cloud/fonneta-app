-- ============================================
-- MIGRACIÓN: Políticas RLS Fortificadas para Producción
-- Fecha: 2026-01-23
-- Descripción: Reemplaza políticas permisivas con políticas basadas en roles
-- ============================================

-- ============================================
-- 1. PROJECTS: Solo PM, asignados y admins
-- ============================================
DROP POLICY IF EXISTS "select_authenticated" ON projects;
DROP POLICY IF EXISTS "insert_authenticated" ON projects;
DROP POLICY IF EXISTS "update_authenticated" ON projects;
DROP POLICY IF EXISTS "delete_authenticated" ON projects;
DROP POLICY IF EXISTS "projects_select_policy" ON projects;
DROP POLICY IF EXISTS "projects_insert_policy" ON projects;
DROP POLICY IF EXISTS "projects_update_policy" ON projects;
DROP POLICY IF EXISTS "projects_delete_policy" ON projects;

-- Admins ven todo, PMs ven sus proyectos, usuarios ven proyectos donde tienen tareas
CREATE POLICY "projects_select_policy" ON projects FOR SELECT
USING (
    -- Admin ve todo
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    -- PM del proyecto
    OR pm_id = auth.uid()
    -- Usuario tiene tareas asignadas en el proyecto
    OR id IN (
        SELECT DISTINCT project_id FROM project_tasks WHERE assigned_to = auth.uid()
    )
    -- Administrativo ve todo para finanzas
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'administrativo')
);

-- Solo admins y PMs pueden crear proyectos
CREATE POLICY "projects_insert_policy" ON projects FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND role IN ('admin', 'pm')
    )
);

-- PM del proyecto o admin puede actualizar
CREATE POLICY "projects_update_policy" ON projects FOR UPDATE
USING (
    pm_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
)
WITH CHECK (
    pm_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Solo admin puede eliminar proyectos
CREATE POLICY "projects_delete_policy" ON projects FOR DELETE
USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ============================================
-- 2. PROJECT_TASKS: Creador, asignado, o PM del proyecto
-- ============================================
DROP POLICY IF EXISTS "allow_all_authenticated_select" ON project_tasks;
DROP POLICY IF EXISTS "allow_all_authenticated_insert" ON project_tasks;
DROP POLICY IF EXISTS "allow_all_authenticated_update" ON project_tasks;
DROP POLICY IF EXISTS "allow_all_authenticated_delete" ON project_tasks;
DROP POLICY IF EXISTS "tasks_select_policy" ON project_tasks;
DROP POLICY IF EXISTS "tasks_insert_policy" ON project_tasks;
DROP POLICY IF EXISTS "tasks_update_policy" ON project_tasks;
DROP POLICY IF EXISTS "tasks_delete_policy" ON project_tasks;

CREATE POLICY "tasks_select_policy" ON project_tasks FOR SELECT
USING (
    -- Admin ve todo
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    -- PM del proyecto ve todas las tareas
    OR project_id IN (SELECT id FROM projects WHERE pm_id = auth.uid())
    -- Usuario asignado ve su tarea
    OR assigned_to = auth.uid()
    -- Creador ve su tarea
    OR created_by = auth.uid()
);

CREATE POLICY "tasks_insert_policy" ON project_tasks FOR INSERT
WITH CHECK (
    -- Admin puede crear en cualquier proyecto
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    -- PM puede crear en sus proyectos
    OR project_id IN (SELECT id FROM projects WHERE pm_id = auth.uid())
    -- Usuarios autenticados pueden crear tareas en proyectos donde participan
    OR project_id IN (
        SELECT DISTINCT project_id FROM project_tasks WHERE assigned_to = auth.uid()
    )
);

CREATE POLICY "tasks_update_policy" ON project_tasks FOR UPDATE
USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    OR project_id IN (SELECT id FROM projects WHERE pm_id = auth.uid())
    OR assigned_to = auth.uid()
    OR created_by = auth.uid()
)
WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    OR project_id IN (SELECT id FROM projects WHERE pm_id = auth.uid())
    OR assigned_to = auth.uid()
    OR created_by = auth.uid()
);

CREATE POLICY "tasks_delete_policy" ON project_tasks FOR DELETE
USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    OR project_id IN (SELECT id FROM projects WHERE pm_id = auth.uid())
    OR created_by = auth.uid()
);

-- ============================================
-- 3. PROJECT_COMMENTS: Similar a tasks
-- ============================================
DROP POLICY IF EXISTS "allow_all_authenticated_select_comments" ON project_comments;
DROP POLICY IF EXISTS "allow_all_authenticated_insert_comments" ON project_comments;
DROP POLICY IF EXISTS "allow_all_authenticated_update_comments" ON project_comments;
DROP POLICY IF EXISTS "allow_all_authenticated_delete_comments" ON project_comments;

CREATE POLICY "comments_select_policy" ON project_comments FOR SELECT
USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    OR project_id IN (SELECT id FROM projects WHERE pm_id = auth.uid())
    OR project_id IN (SELECT DISTINCT project_id FROM project_tasks WHERE assigned_to = auth.uid())
    OR user_id = auth.uid()
);

CREATE POLICY "comments_insert_policy" ON project_comments FOR INSERT
WITH CHECK (
    user_id = auth.uid()
    AND (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'pm'))
        OR project_id IN (SELECT DISTINCT project_id FROM project_tasks WHERE assigned_to = auth.uid())
    )
);

CREATE POLICY "comments_update_policy" ON project_comments FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "comments_delete_policy" ON project_comments FOR DELETE
USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ============================================
-- 4. VENTAS: Admin y Administrativo ven todo, PM solo sus proyectos
-- ============================================
ALTER TABLE ventas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ventas_select_policy" ON ventas;
DROP POLICY IF EXISTS "ventas_insert_policy" ON ventas;
DROP POLICY IF EXISTS "ventas_update_policy" ON ventas;
DROP POLICY IF EXISTS "ventas_delete_policy" ON ventas;

CREATE POLICY "ventas_select_policy" ON ventas FOR SELECT
USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'administrativo'))
    OR proyecto_id IN (SELECT id FROM projects WHERE pm_id = auth.uid())
);

CREATE POLICY "ventas_insert_policy" ON ventas FOR INSERT
WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'administrativo', 'pm'))
);

CREATE POLICY "ventas_update_policy" ON ventas FOR UPDATE
USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'administrativo'))
)
WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'administrativo'))
);

CREATE POLICY "ventas_delete_policy" ON ventas FOR DELETE
USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ============================================
-- 5. GASTOS: Similar a ventas
-- ============================================
ALTER TABLE gastos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "gastos_select_policy" ON gastos;
DROP POLICY IF EXISTS "gastos_insert_policy" ON gastos;
DROP POLICY IF EXISTS "gastos_update_policy" ON gastos;
DROP POLICY IF EXISTS "gastos_delete_policy" ON gastos;

CREATE POLICY "gastos_select_policy" ON gastos FOR SELECT
USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'administrativo'))
    OR proyecto_id IN (SELECT id FROM projects WHERE pm_id = auth.uid())
);

CREATE POLICY "gastos_insert_policy" ON gastos FOR INSERT
WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'administrativo', 'pm'))
);

CREATE POLICY "gastos_update_policy" ON gastos FOR UPDATE
USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'administrativo'))
    -- No permitir editar gastos de proyectos completados (se implementa en trigger)
)
WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'administrativo'))
);

CREATE POLICY "gastos_delete_policy" ON gastos FOR DELETE
USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ============================================
-- 6. PROVIDERS: Proveedor ve solo sus datos
-- ============================================
ALTER TABLE providers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "providers_select_policy" ON providers;
DROP POLICY IF EXISTS "providers_insert_policy" ON providers;
DROP POLICY IF EXISTS "providers_update_policy" ON providers;
DROP POLICY IF EXISTS "providers_delete_policy" ON providers;

CREATE POLICY "providers_select_policy" ON providers FOR SELECT
USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'administrativo', 'pm'))
    OR user_id = auth.uid()
);

CREATE POLICY "providers_insert_policy" ON providers FOR INSERT
WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'administrativo'))
);

CREATE POLICY "providers_update_policy" ON providers FOR UPDATE
USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'administrativo'))
)
WITH CHECK (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'administrativo'))
);

CREATE POLICY "providers_delete_policy" ON providers FOR DELETE
USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ============================================
-- 7. GASTO_ENTREGABLES: Hereda permisos de gastos
-- ============================================
ALTER TABLE gasto_entregables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "entregables_select_policy" ON gasto_entregables FOR SELECT
USING (
    gasto_id IN (SELECT id FROM gastos)  -- Hereda de gastos RLS
);

CREATE POLICY "entregables_insert_policy" ON gasto_entregables FOR INSERT
WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'administrativo', 'pm'))
);

CREATE POLICY "entregables_update_policy" ON gasto_entregables FOR UPDATE
USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'administrativo'))
);

CREATE POLICY "entregables_delete_policy" ON gasto_entregables FOR DELETE
USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ============================================
-- VERIFICACIÓN
-- ============================================
DO $$
BEGIN
    RAISE NOTICE 'RLS policies aplicadas exitosamente a: projects, project_tasks, project_comments, ventas, gastos, providers, gasto_entregables';
END $$;
