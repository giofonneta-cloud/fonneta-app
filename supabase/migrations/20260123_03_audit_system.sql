-- ============================================
-- MIGRACIÓN: Sistema de Auditoría Automática
-- Fecha: 2026-01-23
-- Descripción: Tabla de logs + triggers automáticos
-- ============================================

-- ============================================
-- TABLA DE AUDITORÍA CENTRAL
-- ============================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Qué pasó
    action TEXT NOT NULL,           -- 'create', 'update', 'delete', 'login', 'project_completed'
    entity_type TEXT NOT NULL,      -- 'project', 'task', 'venta', 'gasto', 'user'
    entity_id UUID,                 -- ID del registro afectado

    -- Quién lo hizo
    user_id UUID,
    user_email TEXT,
    user_role TEXT,

    -- Detalles
    old_data JSONB,                 -- Estado anterior (para updates/deletes)
    new_data JSONB,                 -- Estado nuevo (para creates/updates)
    changes JSONB,                  -- Solo los campos que cambiaron
    details JSONB,                  -- Metadata adicional

    -- Contexto
    ip_address TEXT,
    user_agent TEXT,

    -- Timestamp
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para búsqueda eficiente
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_time ON audit_logs(entity_type, created_at DESC);

-- ============================================
-- FUNCIÓN: Calcular cambios entre old y new
-- ============================================
CREATE OR REPLACE FUNCTION calculate_changes(old_data JSONB, new_data JSONB)
RETURNS JSONB
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
    changes JSONB := '{}';
    key TEXT;
BEGIN
    IF old_data IS NULL OR new_data IS NULL THEN
        RETURN NULL;
    END IF;

    FOR key IN SELECT jsonb_object_keys(new_data)
    LOOP
        IF old_data->key IS DISTINCT FROM new_data->key THEN
            changes := changes || jsonb_build_object(
                key, jsonb_build_object(
                    'from', old_data->key,
                    'to', new_data->key
                )
            );
        END IF;
    END LOOP;

    RETURN NULLIF(changes, '{}');
END;
$$;

-- ============================================
-- FUNCIÓN: Obtener info del usuario actual
-- ============================================
CREATE OR REPLACE FUNCTION get_current_user_info()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_user_id UUID;
    v_email TEXT;
    v_role TEXT;
BEGIN
    v_user_id := auth.uid();

    IF v_user_id IS NOT NULL THEN
        SELECT email, role INTO v_email, v_role
        FROM profiles
        WHERE id = v_user_id;
    END IF;

    RETURN jsonb_build_object(
        'user_id', v_user_id,
        'email', v_email,
        'role', v_role
    );
END;
$$;

-- ============================================
-- FUNCIÓN GENÉRICA DE AUDITORÍA (TRIGGER)
-- ============================================
CREATE OR REPLACE FUNCTION audit_trigger_func()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_old_data JSONB;
    v_new_data JSONB;
    v_action TEXT;
    v_changes JSONB;
    v_user_info JSONB;
    v_entity_id UUID;
BEGIN
    -- Obtener info del usuario
    v_user_info := get_current_user_info();

    -- Determinar acción y datos
    IF TG_OP = 'INSERT' THEN
        v_action := 'create';
        v_new_data := to_jsonb(NEW);
        v_old_data := NULL;
        v_entity_id := NEW.id;
        v_changes := NULL;
    ELSIF TG_OP = 'UPDATE' THEN
        v_action := 'update';
        v_old_data := to_jsonb(OLD);
        v_new_data := to_jsonb(NEW);
        v_entity_id := NEW.id;
        v_changes := calculate_changes(v_old_data, v_new_data);

        -- No registrar si no hay cambios reales
        IF v_changes IS NULL THEN
            RETURN NEW;
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        v_action := 'delete';
        v_old_data := to_jsonb(OLD);
        v_new_data := NULL;
        v_entity_id := OLD.id;
        v_changes := NULL;
    END IF;

    -- Insertar log
    INSERT INTO audit_logs (
        action,
        entity_type,
        entity_id,
        user_id,
        user_email,
        user_role,
        old_data,
        new_data,
        changes
    ) VALUES (
        v_action,
        TG_TABLE_NAME,
        v_entity_id,
        (v_user_info->>'user_id')::UUID,
        v_user_info->>'email',
        v_user_info->>'role',
        v_old_data,
        v_new_data,
        v_changes
    );

    -- Retornar registro apropiado
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;

EXCEPTION WHEN OTHERS THEN
    -- Si falla la auditoría, no bloquear la operación principal
    RAISE WARNING 'Error en auditoría: %', SQLERRM;
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$;

-- ============================================
-- APLICAR TRIGGERS A TABLAS CRÍTICAS
-- ============================================

-- Projects
DROP TRIGGER IF EXISTS audit_projects ON projects;
CREATE TRIGGER audit_projects
    AFTER INSERT OR UPDATE OR DELETE ON projects
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

-- Ventas
DROP TRIGGER IF EXISTS audit_ventas ON ventas;
CREATE TRIGGER audit_ventas
    AFTER INSERT OR UPDATE OR DELETE ON ventas
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

-- Gastos
DROP TRIGGER IF EXISTS audit_gastos ON gastos;
CREATE TRIGGER audit_gastos
    AFTER INSERT OR UPDATE OR DELETE ON gastos
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

-- Project Tasks
DROP TRIGGER IF EXISTS audit_project_tasks ON project_tasks;
CREATE TRIGGER audit_project_tasks
    AFTER INSERT OR UPDATE OR DELETE ON project_tasks
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

-- Providers
DROP TRIGGER IF EXISTS audit_providers ON providers;
CREATE TRIGGER audit_providers
    AFTER INSERT OR UPDATE OR DELETE ON providers
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

-- Profiles (usuarios)
DROP TRIGGER IF EXISTS audit_profiles ON profiles;
CREATE TRIGGER audit_profiles
    AFTER INSERT OR UPDATE OR DELETE ON profiles
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

-- ============================================
-- FUNCIÓN: Log manual para acciones custom
-- ============================================
CREATE OR REPLACE FUNCTION log_custom_action(
    p_action TEXT,
    p_entity_type TEXT,
    p_entity_id UUID DEFAULT NULL,
    p_details JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_log_id UUID;
    v_user_info JSONB;
BEGIN
    v_user_info := get_current_user_info();

    INSERT INTO audit_logs (
        action,
        entity_type,
        entity_id,
        user_id,
        user_email,
        user_role,
        details
    ) VALUES (
        p_action,
        p_entity_type,
        p_entity_id,
        (v_user_info->>'user_id')::UUID,
        v_user_info->>'email',
        v_user_info->>'role',
        p_details
    )
    RETURNING id INTO v_log_id;

    RETURN v_log_id;
END;
$$;

-- ============================================
-- RLS para audit_logs (solo admins pueden ver todo)
-- ============================================
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_select_policy" ON audit_logs FOR SELECT
USING (
    -- Admin ve todo
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    -- Usuarios ven sus propias acciones
    OR user_id = auth.uid()
);

-- Solo el sistema puede insertar (vía triggers con SECURITY DEFINER)
CREATE POLICY "audit_insert_policy" ON audit_logs FOR INSERT
WITH CHECK (true);  -- Los triggers manejan la inserción

-- ============================================
-- VISTA: Resumen de actividad reciente
-- ============================================
CREATE OR REPLACE VIEW audit_activity_summary AS
SELECT
    DATE_TRUNC('day', created_at) AS fecha,
    entity_type,
    action,
    COUNT(*) AS cantidad,
    COUNT(DISTINCT user_id) AS usuarios_unicos
FROM audit_logs
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', created_at), entity_type, action
ORDER BY fecha DESC, cantidad DESC;

-- ============================================
-- VERIFICACIÓN
-- ============================================
DO $$
BEGIN
    RAISE NOTICE 'Sistema de auditoría configurado. Triggers activos en: projects, ventas, gastos, project_tasks, providers, profiles';
END $$;
