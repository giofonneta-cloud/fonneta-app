-- ============================================================
-- MIGRACIÓN: Agregar Soporte para Subtareas (3 Niveles)
-- ============================================================
-- Fecha: 2026-01-21
-- Descripción: Permite crear subtareas con hasta 3 niveles de profundidad

-- Agregar columnas para jerarquía de tareas
ALTER TABLE project_tasks
ADD COLUMN IF NOT EXISTS parent_task_id UUID REFERENCES project_tasks(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS depth_level INTEGER DEFAULT 0 CHECK (depth_level >= 0 AND depth_level <= 2);

-- Crear índice para búsquedas eficientes por parent
CREATE INDEX IF NOT EXISTS idx_project_tasks_parent_id ON project_tasks(parent_task_id);

-- Crear índice compuesto para optimizar queries jerárquicas
CREATE INDEX IF NOT EXISTS idx_project_tasks_hierarchy ON project_tasks(project_id, parent_task_id, depth_level);

-- Función para calcular el nivel de profundidad automáticamente
CREATE OR REPLACE FUNCTION calculate_task_depth()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.parent_task_id IS NULL THEN
        -- Tarea raíz (nivel 0)
        NEW.depth_level := 0;
    ELSE
        -- Obtener el nivel del padre y sumar 1
        SELECT depth_level + 1
        INTO NEW.depth_level
        FROM project_tasks
        WHERE id = NEW.parent_task_id;

        -- Validar que no exceda 3 niveles (0, 1, 2)
        IF NEW.depth_level > 2 THEN
            RAISE EXCEPTION 'No se pueden crear subtareas más allá del nivel 3';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para calcular depth_level automáticamente al insertar/actualizar
DROP TRIGGER IF EXISTS trigger_calculate_task_depth ON project_tasks;
CREATE TRIGGER trigger_calculate_task_depth
    BEFORE INSERT OR UPDATE OF parent_task_id ON project_tasks
    FOR EACH ROW
    EXECUTE FUNCTION calculate_task_depth();

-- Función para obtener todas las subtareas de una tarea (recursiva)
CREATE OR REPLACE FUNCTION get_task_subtree(task_id UUID)
RETURNS TABLE (
    id UUID,
    parent_task_id UUID,
    depth_level INTEGER,
    title TEXT,
    status TEXT
) AS $$
BEGIN
    RETURN QUERY
    WITH RECURSIVE task_tree AS (
        -- Tarea inicial
        SELECT
            t.id,
            t.parent_task_id,
            t.depth_level,
            t.title,
            t.status
        FROM project_tasks t
        WHERE t.id = task_id

        UNION ALL

        -- Subtareas recursivas
        SELECT
            t.id,
            t.parent_task_id,
            t.depth_level,
            t.title,
            t.status
        FROM project_tasks t
        INNER JOIN task_tree tt ON t.parent_task_id = tt.id
    )
    SELECT * FROM task_tree;
END;
$$ LANGUAGE plpgsql;

-- Comentarios
COMMENT ON COLUMN project_tasks.parent_task_id IS 'ID de la tarea padre (NULL si es tarea raíz)';
COMMENT ON COLUMN project_tasks.depth_level IS 'Nivel de profundidad: 0 (raíz), 1 (subtarea), 2 (sub-subtarea)';
COMMENT ON FUNCTION calculate_task_depth() IS 'Calcula automáticamente el nivel de profundidad de una tarea';
COMMENT ON FUNCTION get_task_subtree(UUID) IS 'Obtiene recursivamente todas las subtareas de una tarea';
