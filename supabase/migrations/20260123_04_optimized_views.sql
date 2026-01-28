-- ============================================
-- MIGRACIÓN: Vistas Optimizadas y Alertas
-- Fecha: 2026-01-23
-- Descripción: Vistas para eliminar N+1 queries + sistema de alertas
-- ============================================

-- ============================================
-- VISTA: Gastos con entregables (elimina N+1)
-- ============================================
CREATE OR REPLACE VIEW gastos_con_entregables AS
SELECT
    g.*,
    -- Agregar entregables como JSON array
    COALESCE(
        (SELECT jsonb_agg(
            jsonb_build_object(
                'id', e.id,
                'nombre', e.nombre,
                'fecha_entrega_comprometida', e.fecha_entrega_comprometida,
                'fecha_entrega_real', e.fecha_entrega_real,
                'estado', e.estado,
                'archivos_urls', e.archivos_urls
            ) ORDER BY e.fecha_entrega_comprometida
        ) FROM gasto_entregables e WHERE e.gasto_id = g.id),
        '[]'::jsonb
    ) AS entregables,
    -- Conteo de entregables
    (SELECT COUNT(*) FROM gasto_entregables e WHERE e.gasto_id = g.id) AS entregables_count,
    -- Entregables pendientes
    (SELECT COUNT(*) FROM gasto_entregables e WHERE e.gasto_id = g.id AND e.estado = 'pendiente') AS entregables_pendientes,
    -- Nombre del proveedor
    (SELECT business_name FROM providers WHERE id = g.proveedor_id) AS proveedor_nombre,
    -- Nombre del proyecto
    (SELECT name FROM projects WHERE id = g.proyecto_id) AS proyecto_nombre
FROM gastos g;

-- ============================================
-- VISTA: Proyectos con estadísticas de tareas
-- ============================================
CREATE OR REPLACE VIEW projects_with_stats AS
SELECT
    p.*,
    -- Estadísticas de tareas
    COALESCE(task_stats.total_tasks, 0) AS total_tasks,
    COALESCE(task_stats.completed_tasks, 0) AS completed_tasks,
    COALESCE(task_stats.pending_tasks, 0) AS pending_tasks,
    COALESCE(task_stats.overdue_tasks, 0) AS overdue_tasks,
    -- Progreso porcentual
    CASE
        WHEN COALESCE(task_stats.total_tasks, 0) > 0
        THEN ROUND((COALESCE(task_stats.completed_tasks, 0)::DECIMAL / task_stats.total_tasks) * 100, 1)
        ELSE 0
    END AS progress_percentage,
    -- Financieros
    COALESCE(finance_stats.total_ventas, 0) AS total_ventas,
    COALESCE(finance_stats.total_gastos, 0) AS total_gastos,
    COALESCE(finance_stats.total_ventas, 0) - COALESCE(finance_stats.total_gastos, 0) AS utilidad,
    -- Margen real
    CASE
        WHEN COALESCE(finance_stats.total_ventas, 0) > 0
        THEN ROUND(((finance_stats.total_ventas - COALESCE(finance_stats.total_gastos, 0)) / finance_stats.total_ventas) * 100, 2)
        ELSE 0
    END AS margen_real_percentage,
    -- PM info
    (SELECT full_name FROM profiles WHERE id = p.pm_id) AS pm_name,
    (SELECT email FROM profiles WHERE id = p.pm_id) AS pm_email
FROM projects p
LEFT JOIN LATERAL (
    SELECT
        COUNT(*) AS total_tasks,
        COUNT(*) FILTER (WHERE status = 'done') AS completed_tasks,
        COUNT(*) FILTER (WHERE status != 'done') AS pending_tasks,
        COUNT(*) FILTER (WHERE status != 'done' AND due_date < CURRENT_DATE) AS overdue_tasks
    FROM project_tasks
    WHERE project_id = p.id AND parent_task_id IS NULL
) task_stats ON true
LEFT JOIN LATERAL (
    SELECT
        COALESCE(SUM(total_con_iva), 0) AS total_ventas
    FROM ventas
    WHERE proyecto_id = p.id
) AS ventas_sum ON true
LEFT JOIN LATERAL (
    SELECT
        COALESCE(SUM(total_con_iva), 0) AS total_gastos
    FROM gastos
    WHERE proyecto_id = p.id
) AS gastos_sum ON true
LEFT JOIN LATERAL (
    SELECT
        ventas_sum.total_ventas,
        gastos_sum.total_gastos
) finance_stats ON true;

-- ============================================
-- VISTA: Tareas con información de usuario
-- ============================================
CREATE OR REPLACE VIEW tasks_with_users AS
SELECT
    t.*,
    -- Info del asignado
    (SELECT full_name FROM profiles WHERE id = t.assigned_to) AS assigned_to_name,
    (SELECT email FROM profiles WHERE id = t.assigned_to) AS assigned_to_email,
    (SELECT avatar_url FROM profiles WHERE id = t.assigned_to) AS assigned_to_avatar,
    -- Info del creador
    (SELECT full_name FROM profiles WHERE id = t.created_by) AS created_by_name,
    -- Info del proyecto
    (SELECT name FROM projects WHERE id = t.project_id) AS project_name,
    -- Es atrasada?
    CASE
        WHEN t.status != 'done' AND t.due_date < CURRENT_DATE
        THEN true
        ELSE false
    END AS is_overdue,
    -- Días de atraso
    CASE
        WHEN t.status != 'done' AND t.due_date < CURRENT_DATE
        THEN CURRENT_DATE - t.due_date
        ELSE 0
    END AS days_overdue
FROM project_tasks t;

-- ============================================
-- TABLA: Sistema de Alertas
-- ============================================
CREATE TABLE IF NOT EXISTS system_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    type TEXT NOT NULL,             -- 'project_stale', 'task_overdue', 'payment_due', 'low_margin'
    severity TEXT DEFAULT 'info',   -- 'info', 'warning', 'error', 'critical'

    entity_type TEXT,
    entity_id UUID,

    title TEXT NOT NULL,
    message TEXT,

    -- Destinatarios
    target_user_id UUID REFERENCES auth.users(id),
    target_role TEXT,               -- Si es null, va al usuario específico

    -- Estado
    is_read BOOLEAN DEFAULT FALSE,
    is_dismissed BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ          -- Alerta expira automáticamente
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_alerts_user ON system_alerts(target_user_id, is_read) WHERE NOT is_dismissed;
CREATE INDEX IF NOT EXISTS idx_alerts_role ON system_alerts(target_role, is_read) WHERE NOT is_dismissed;
CREATE INDEX IF NOT EXISTS idx_alerts_entity ON system_alerts(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_alerts_created ON system_alerts(created_at DESC);

-- RLS
ALTER TABLE system_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "alerts_select_policy" ON system_alerts FOR SELECT
USING (
    target_user_id = auth.uid()
    OR target_role IN (SELECT role FROM profiles WHERE id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "alerts_update_policy" ON system_alerts FOR UPDATE
USING (target_user_id = auth.uid())
WITH CHECK (target_user_id = auth.uid());

-- ============================================
-- FUNCIÓN: Generar alertas de proyectos estancados
-- ============================================
CREATE OR REPLACE FUNCTION check_stale_projects()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_project RECORD;
    v_count INTEGER := 0;
BEGIN
    -- Proyectos sin cambio por más de 30 días (que no estén completados/facturados)
    FOR v_project IN
        SELECT id, name, pm_id, status, updated_at
        FROM projects
        WHERE status NOT IN ('completado', 'facturado')
        AND updated_at < NOW() - INTERVAL '30 days'
        AND NOT EXISTS (
            SELECT 1 FROM system_alerts
            WHERE entity_id = projects.id
            AND type = 'project_stale'
            AND created_at > NOW() - INTERVAL '7 days'  -- No repetir en 7 días
        )
    LOOP
        INSERT INTO system_alerts (
            type, severity, entity_type, entity_id,
            title, message, target_user_id
        ) VALUES (
            'project_stale',
            'warning',
            'projects',
            v_project.id,
            'Proyecto sin actividad',
            format('El proyecto "%s" lleva más de 30 días en estado "%s" sin actividad.',
                   v_project.name, v_project.status),
            v_project.pm_id
        );
        v_count := v_count + 1;
    END LOOP;

    RETURN v_count;
END;
$$;

-- ============================================
-- FUNCIÓN: Generar alertas de tareas vencidas
-- ============================================
CREATE OR REPLACE FUNCTION check_overdue_tasks()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_task RECORD;
    v_count INTEGER := 0;
BEGIN
    FOR v_task IN
        SELECT t.id, t.title, t.assigned_to, t.due_date, p.name as project_name
        FROM project_tasks t
        JOIN projects p ON p.id = t.project_id
        WHERE t.status != 'done'
        AND t.due_date < CURRENT_DATE
        AND NOT EXISTS (
            SELECT 1 FROM system_alerts
            WHERE entity_id = t.id
            AND type = 'task_overdue'
            AND created_at > NOW() - INTERVAL '1 day'  -- Una alerta por día
        )
    LOOP
        INSERT INTO system_alerts (
            type, severity, entity_type, entity_id,
            title, message, target_user_id
        ) VALUES (
            'task_overdue',
            CASE
                WHEN CURRENT_DATE - v_task.due_date > 7 THEN 'error'
                ELSE 'warning'
            END,
            'project_tasks',
            v_task.id,
            'Tarea vencida',
            format('La tarea "%s" del proyecto "%s" venció hace %s día(s).',
                   v_task.title, v_task.project_name, CURRENT_DATE - v_task.due_date),
            v_task.assigned_to
        );
        v_count := v_count + 1;
    END LOOP;

    RETURN v_count;
END;
$$;

-- ============================================
-- FUNCIÓN: Generar alertas de pagos pendientes
-- ============================================
CREATE OR REPLACE FUNCTION check_pending_payments()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_venta RECORD;
    v_count INTEGER := 0;
BEGIN
    FOR v_venta IN
        SELECT v.id, v.numero_factura, v.fecha_cobro_estimada, v.total_con_iva,
               v.valor_pagado, p.name as project_name, p.pm_id
        FROM ventas v
        JOIN projects p ON p.id = v.proyecto_id
        WHERE v.estado_pago != 'pagado'
        AND v.fecha_cobro_estimada < CURRENT_DATE
        AND NOT EXISTS (
            SELECT 1 FROM system_alerts
            WHERE entity_id = v.id
            AND type = 'payment_due'
            AND created_at > NOW() - INTERVAL '3 days'
        )
    LOOP
        INSERT INTO system_alerts (
            type, severity, entity_type, entity_id,
            title, message, target_role
        ) VALUES (
            'payment_due',
            'warning',
            'ventas',
            v_venta.id,
            'Pago pendiente',
            format('Factura %s del proyecto "%s" por $%s está pendiente de cobro desde %s.',
                   COALESCE(v_venta.numero_factura, 'S/N'),
                   v_venta.project_name,
                   v_venta.total_con_iva - COALESCE(v_venta.valor_pagado, 0),
                   v_venta.fecha_cobro_estimada),
            'administrativo'  -- Alerta para rol administrativo
        );
        v_count := v_count + 1;
    END LOOP;

    RETURN v_count;
END;
$$;

-- ============================================
-- FUNCIÓN: Ejecutar todas las verificaciones de alertas
-- ============================================
CREATE OR REPLACE FUNCTION run_all_alert_checks()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_stale INTEGER;
    v_overdue INTEGER;
    v_payments INTEGER;
BEGIN
    v_stale := check_stale_projects();
    v_overdue := check_overdue_tasks();
    v_payments := check_pending_payments();

    RETURN jsonb_build_object(
        'stale_projects', v_stale,
        'overdue_tasks', v_overdue,
        'pending_payments', v_payments,
        'total', v_stale + v_overdue + v_payments,
        'executed_at', NOW()
    );
END;
$$;

-- ============================================
-- FUNCIÓN: Marcar alerta como leída
-- ============================================
CREATE OR REPLACE FUNCTION mark_alert_read(p_alert_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE system_alerts
    SET is_read = true, read_at = NOW()
    WHERE id = p_alert_id
    AND (target_user_id = auth.uid() OR target_role IN (SELECT role FROM profiles WHERE id = auth.uid()));

    RETURN FOUND;
END;
$$;

-- ============================================
-- FUNCIÓN: Descartar alerta
-- ============================================
CREATE OR REPLACE FUNCTION dismiss_alert(p_alert_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE system_alerts
    SET is_dismissed = true
    WHERE id = p_alert_id
    AND (target_user_id = auth.uid() OR target_role IN (SELECT role FROM profiles WHERE id = auth.uid()));

    RETURN FOUND;
END;
$$;

-- ============================================
-- VISTA: Alertas del usuario actual
-- ============================================
CREATE OR REPLACE VIEW my_alerts AS
SELECT
    a.*,
    CASE
        WHEN a.created_at > NOW() - INTERVAL '1 hour' THEN 'just_now'
        WHEN a.created_at > NOW() - INTERVAL '1 day' THEN 'today'
        WHEN a.created_at > NOW() - INTERVAL '7 days' THEN 'this_week'
        ELSE 'older'
    END AS time_category
FROM system_alerts a
WHERE NOT a.is_dismissed
AND (a.expires_at IS NULL OR a.expires_at > NOW())
AND (
    a.target_user_id = auth.uid()
    OR a.target_role IN (SELECT role FROM profiles WHERE id = auth.uid())
)
ORDER BY a.created_at DESC;

-- ============================================
-- VERIFICACIÓN
-- ============================================
DO $$
BEGIN
    RAISE NOTICE 'Vistas optimizadas y sistema de alertas creados.';
    RAISE NOTICE 'Vistas: gastos_con_entregables, projects_with_stats, tasks_with_users, my_alerts';
    RAISE NOTICE 'Funciones de alerta: check_stale_projects, check_overdue_tasks, check_pending_payments, run_all_alert_checks';
END $$;
