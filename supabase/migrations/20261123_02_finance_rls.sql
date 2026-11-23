-- =====================================================================
-- PRP-001 Fase 2.4: finanzas y proyectos solo para personal interno
-- Hallazgos que corrige: H9 (ventas/gastos/cxc/tareas abiertos a cualquier autenticado)
-- Las políticas "Staff or project owner..." ya existentes se conservan.
-- =====================================================================

-- ventas
DROP POLICY IF EXISTS ventas_select_authenticated ON public.ventas;
DROP POLICY IF EXISTS ventas_insert_authenticated ON public.ventas;
DROP POLICY IF EXISTS ventas_update_authenticated ON public.ventas;
DROP POLICY IF EXISTS ventas_delete_authenticated ON public.ventas;
CREATE POLICY ventas_select_staff ON public.ventas FOR SELECT TO authenticated USING (public.is_staff());
CREATE POLICY ventas_insert_staff ON public.ventas FOR INSERT TO authenticated WITH CHECK (public.is_staff());
CREATE POLICY ventas_update_staff ON public.ventas FOR UPDATE TO authenticated USING (public.is_staff()) WITH CHECK (public.is_staff());
CREATE POLICY ventas_delete_staff ON public.ventas FOR DELETE TO authenticated USING (public.is_staff());

-- gastos
DROP POLICY IF EXISTS gastos_select_authenticated ON public.gastos;
DROP POLICY IF EXISTS gastos_insert_authenticated ON public.gastos;
DROP POLICY IF EXISTS gastos_update_authenticated ON public.gastos;
DROP POLICY IF EXISTS gastos_delete_authenticated ON public.gastos;
CREATE POLICY gastos_select_staff ON public.gastos FOR SELECT TO authenticated USING (public.is_staff());
CREATE POLICY gastos_insert_staff ON public.gastos FOR INSERT TO authenticated WITH CHECK (public.is_staff());
CREATE POLICY gastos_update_staff ON public.gastos FOR UPDATE TO authenticated USING (public.is_staff()) WITH CHECK (public.is_staff());
CREATE POLICY gastos_delete_staff ON public.gastos FOR DELETE TO authenticated USING (public.is_staff());

-- cuentas por cobrar: seguimiento
DROP POLICY IF EXISTS "Authenticated users can manage cxc_seguimiento" ON public.cxc_seguimiento;
CREATE POLICY cxc_seguimiento_staff ON public.cxc_seguimiento
  FOR ALL TO authenticated USING (public.is_staff()) WITH CHECK (public.is_staff());

-- tareas y comentarios de proyectos
DROP POLICY IF EXISTS tasks_select_all ON public.project_tasks;
DROP POLICY IF EXISTS tasks_insert_all ON public.project_tasks;
DROP POLICY IF EXISTS tasks_update_all ON public.project_tasks;
DROP POLICY IF EXISTS tasks_delete_all ON public.project_tasks;
CREATE POLICY tasks_select_staff ON public.project_tasks FOR SELECT TO authenticated USING (public.is_staff());
CREATE POLICY tasks_insert_staff ON public.project_tasks FOR INSERT TO authenticated WITH CHECK (public.is_staff());
CREATE POLICY tasks_update_staff ON public.project_tasks FOR UPDATE TO authenticated USING (public.is_staff()) WITH CHECK (public.is_staff());
CREATE POLICY tasks_delete_staff ON public.project_tasks FOR DELETE TO authenticated USING (public.is_staff());

DROP POLICY IF EXISTS comments_select_all ON public.project_comments;
DROP POLICY IF EXISTS comments_insert_all ON public.project_comments;
DROP POLICY IF EXISTS comments_update_all ON public.project_comments;
DROP POLICY IF EXISTS comments_delete_all ON public.project_comments;
CREATE POLICY comments_select_staff ON public.project_comments FOR SELECT TO authenticated USING (public.is_staff());
CREATE POLICY comments_insert_staff ON public.project_comments FOR INSERT TO authenticated WITH CHECK (public.is_staff());
CREATE POLICY comments_update_staff ON public.project_comments FOR UPDATE TO authenticated USING (public.is_staff()) WITH CHECK (public.is_staff());
CREATE POLICY comments_delete_staff ON public.project_comments FOR DELETE TO authenticated USING (public.is_staff());
