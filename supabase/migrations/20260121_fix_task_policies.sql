-- Fix RLS Policies for project_tasks
-- Allow authenticated users to create/edit tasks in any project (for testing)

-- Drop existing policies
DROP POLICY IF EXISTS "PMs can create tasks in their projects" ON project_tasks;
DROP POLICY IF EXISTS "Users can view tasks of their projects" ON project_tasks;
DROP POLICY IF EXISTS "Users can update tasks they created or are assigned to" ON project_tasks;
DROP POLICY IF EXISTS "PMs can delete tasks from their projects" ON project_tasks;

-- New more permissive policies (for testing)

-- SELECT: Any authenticated user can view tasks
CREATE POLICY "Authenticated users can view tasks"
    ON project_tasks FOR SELECT
    USING (auth.uid() IS NOT NULL);

-- INSERT: Any authenticated user can create tasks
CREATE POLICY "Authenticated users can create tasks"
    ON project_tasks FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- UPDATE: Any authenticated user can update tasks
CREATE POLICY "Authenticated users can update tasks"
    ON project_tasks FOR UPDATE
    USING (auth.uid() IS NOT NULL);

-- DELETE: Any authenticated user can delete tasks
CREATE POLICY "Authenticated users can delete tasks"
    ON project_tasks FOR DELETE
    USING (auth.uid() IS NOT NULL);

-- Fix comments policies too
DROP POLICY IF EXISTS "Users can view comments of their projects" ON project_comments;
DROP POLICY IF EXISTS "Users can create comments in their projects" ON project_comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON project_comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON project_comments;

-- Comments policies
CREATE POLICY "Authenticated users can view comments"
    ON project_comments FOR SELECT
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create comments"
    ON project_comments FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own comments"
    ON project_comments FOR UPDATE
    USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own comments"
    ON project_comments FOR DELETE
    USING (user_id = auth.uid());
