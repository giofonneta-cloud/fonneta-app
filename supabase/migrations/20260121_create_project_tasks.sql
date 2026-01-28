-- Migration: Create project_tasks table and project_comments table
-- Date: 2026-01-21
-- Description: Sistema de tareas por proyecto (ClickUp-style) y comentarios

-- =====================================================
-- TABLE: project_tasks
-- =====================================================
CREATE TABLE IF NOT EXISTS project_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,

    -- Información básica
    title TEXT NOT NULL,
    description TEXT,

    -- Seguimiento
    status TEXT CHECK (status IN ('todo', 'in_progress', 'review', 'done')) DEFAULT 'todo',
    priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',

    -- Asignación
    assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,

    -- Fechas
    due_date DATE,
    completed_at TIMESTAMPTZ,

    -- Metadata
    order_index INTEGER DEFAULT 0,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para optimizar queries
CREATE INDEX IF NOT EXISTS idx_project_tasks_project_id ON project_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_project_tasks_assigned_to ON project_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_project_tasks_status ON project_tasks(status);
CREATE INDEX IF NOT EXISTS idx_project_tasks_due_date ON project_tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_project_tasks_order ON project_tasks(project_id, order_index);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_project_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_project_tasks_updated_at
    BEFORE UPDATE ON project_tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_project_tasks_updated_at();

-- =====================================================
-- RLS POLICIES: project_tasks
-- =====================================================
ALTER TABLE project_tasks ENABLE ROW LEVEL SECURITY;

-- Policy: Usuarios pueden ver tareas de proyectos donde son PM o están asignados
CREATE POLICY "Users can view tasks of their projects"
    ON project_tasks FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = project_tasks.project_id
            AND projects.pm_id = auth.uid()
        )
        OR assigned_to = auth.uid()
    );

-- Policy: PM puede crear tareas en sus proyectos
CREATE POLICY "PMs can create tasks in their projects"
    ON project_tasks FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = project_tasks.project_id
            AND projects.pm_id = auth.uid()
        )
    );

-- Policy: Usuarios pueden actualizar tareas que crearon, están asignados o son PM del proyecto
CREATE POLICY "Users can update tasks they created or are assigned to"
    ON project_tasks FOR UPDATE
    USING (
        created_by = auth.uid()
        OR assigned_to = auth.uid()
        OR EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = project_tasks.project_id
            AND projects.pm_id = auth.uid()
        )
    );

-- Policy: PM puede eliminar tareas de sus proyectos
CREATE POLICY "PMs can delete tasks from their projects"
    ON project_tasks FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = project_tasks.project_id
            AND projects.pm_id = auth.uid()
        )
    );

-- =====================================================
-- TABLE: project_comments
-- =====================================================
CREATE TABLE IF NOT EXISTS project_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    comment TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_project_comments_project_id ON project_comments(project_id);
CREATE INDEX IF NOT EXISTS idx_project_comments_user_id ON project_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_project_comments_created_at ON project_comments(created_at DESC);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_project_comments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_project_comments_updated_at
    BEFORE UPDATE ON project_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_project_comments_updated_at();

-- =====================================================
-- RLS POLICIES: project_comments
-- =====================================================
ALTER TABLE project_comments ENABLE ROW LEVEL SECURITY;

-- Policy: Usuarios pueden ver comentarios de proyectos donde son PM
CREATE POLICY "Users can view comments of their projects"
    ON project_comments FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = project_comments.project_id
            AND projects.pm_id = auth.uid()
        )
    );

-- Policy: Usuarios pueden crear comentarios en proyectos donde son PM
CREATE POLICY "Users can create comments in their projects"
    ON project_comments FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = project_comments.project_id
            AND projects.pm_id = auth.uid()
        )
    );

-- Policy: Usuarios solo pueden actualizar sus propios comentarios
CREATE POLICY "Users can update their own comments"
    ON project_comments FOR UPDATE
    USING (user_id = auth.uid());

-- Policy: Usuarios solo pueden eliminar sus propios comentarios
CREATE POLICY "Users can delete their own comments"
    ON project_comments FOR DELETE
    USING (user_id = auth.uid());

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON TABLE project_tasks IS 'Tareas por proyecto para seguimiento detallado tipo ClickUp';
COMMENT ON TABLE project_comments IS 'Comentarios y notas en proyectos';
