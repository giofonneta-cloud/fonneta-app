-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- 'invoice_update', 'document_upload', etc
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}'::jsonb, -- metadata like invoice_id, etc
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see only their own notifications
CREATE POLICY "Users can view their own notifications"
  ON notifications
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can update their own notifications (e.g. mark as read)
CREATE POLICY "Users can update their own notifications"
  ON notifications
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: System/Admin can insert notifications for anyone
-- In Supabase, if we use the Service Role or a secure function, we can bypass this.
-- But for now, we'll allow Authenticated users to insert if they are admins (optional)
-- Or simpler: Allow insert if auth.uid() is the creator.
-- Ideally, creating notifications for OTHERS is an admin/system action.
-- Let's allow authenticated users to insert, but in practice, this will be controlled by backend logic.
-- Actually, lets strictly control it via policy if possible, or assume backend usage.
-- For simplicity in this stack, we often allow inserts if the user has a role.
CREATE POLICY "Admins and System can insert notifications"
  ON notifications
  FOR INSERT
  WITH CHECK (
    -- Allow admins/administrative/pm to notify others
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'administrativo', 'pm')
    )
    OR
    -- Allow users to notify themselves (maybe for testing or specific flows)
    auth.uid() = user_id
  );
