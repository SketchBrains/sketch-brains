/*
  # Notifications System

  1. New Tables
    - `notifications_queue`
      - `id` (uuid, primary key) - Unique notification identifier
      - `user_id` (uuid, foreign key) - Recipient user
      - `type` (text) - Notification type: email, sms, in_app
      - `channel` (text) - Delivery channel: transactional, marketing, alert
      - `subject` (text) - Notification subject/title
      - `body` (text) - Notification content
      - `status` (text) - Status: pending, sent, failed, cancelled
      - `priority` (text) - Priority: low, medium, high, urgent
      - `scheduled_for` (timestamptz) - When to send notification
      - `sent_at` (timestamptz) - When notification was sent
      - `retry_count` (integer) - Number of retry attempts
      - `error_message` (text) - Error details if failed
      - `metadata` (jsonb) - Additional data (template vars, etc)
      - `created_at` (timestamptz) - Record creation time

    - `notification_preferences`
      - `id` (uuid, primary key) - Unique preference identifier
      - `user_id` (uuid, foreign key) - References auth.users
      - `email_enabled` (boolean) - Enable email notifications
      - `sms_enabled` (boolean) - Enable SMS notifications
      - `in_app_enabled` (boolean) - Enable in-app notifications
      - `marketing_enabled` (boolean) - Enable marketing notifications
      - `updated_at` (timestamptz) - Last update time

    - `in_app_notifications`
      - `id` (uuid, primary key) - Unique notification
      - `user_id` (uuid, foreign key) - Recipient user
      - `title` (text) - Notification title
      - `message` (text) - Notification message
      - `type` (text) - Type: info, success, warning, error
      - `action_url` (text) - Optional URL for action button
      - `read_at` (timestamptz) - When user read the notification
      - `created_at` (timestamptz) - Creation time

  2. Security
    - Enable RLS on all notification tables
    - Users can only view their own notifications
    - Admins can manage notification queue
    - System can insert notifications for any user

  3. Indexes
    - Index on user_id for fast user notification lookup
    - Index on status for queue processing
    - Index on scheduled_for for time-based delivery
*/

CREATE TABLE IF NOT EXISTS notifications_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('email', 'sms', 'in_app')),
  channel text NOT NULL DEFAULT 'transactional' CHECK (channel IN ('transactional', 'marketing', 'alert')),
  subject text,
  body text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  scheduled_for timestamptz DEFAULT now(),
  sent_at timestamptz,
  retry_count integer DEFAULT 0,
  error_message text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email_enabled boolean DEFAULT true,
  sms_enabled boolean DEFAULT false,
  in_app_enabled boolean DEFAULT true,
  marketing_enabled boolean DEFAULT false,
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS in_app_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
  action_url text,
  read_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notifications_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE in_app_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notification queue"
  ON notifications_queue FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all notification queue"
  ON notifications_queue FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

CREATE POLICY "Users can view own notification preferences"
  ON notification_preferences FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notification preferences"
  ON notification_preferences FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert own notification preferences"
  ON notification_preferences FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own in-app notifications"
  ON in_app_notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own in-app notifications"
  ON in_app_notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_queue_user_id ON notifications_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_queue_status ON notifications_queue(status);
CREATE INDEX IF NOT EXISTS idx_notifications_queue_scheduled_for ON notifications_queue(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_in_app_notifications_user_id ON in_app_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_in_app_notifications_read_at ON in_app_notifications(read_at);
CREATE INDEX IF NOT EXISTS idx_in_app_notifications_created_at ON in_app_notifications(created_at DESC);
