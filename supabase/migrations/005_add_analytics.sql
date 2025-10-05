/*
  # Analytics and Tracking

  1. New Tables
    - `analytics_events`
      - `id` (uuid, primary key) - Unique event identifier
      - `user_id` (uuid, foreign key) - User who performed action (nullable for anonymous)
      - `event_name` (text) - Event name: page_view, button_click, course_register, etc
      - `event_category` (text) - Category: engagement, conversion, navigation
      - `event_data` (jsonb) - Additional event data
      - `session_id` (text) - Session identifier for grouping
      - `ip_address` (text) - User IP address
      - `user_agent` (text) - Browser/device information
      - `referrer` (text) - Referring URL
      - `created_at` (timestamptz) - Event timestamp

    - `webhook_logs`
      - `id` (uuid, primary key) - Unique log identifier
      - `source` (text) - Webhook source: razorpay, sendgrid, etc
      - `event_type` (text) - Event type from source
      - `payload` (jsonb) - Complete webhook payload
      - `status` (text) - Processing status: received, processed, failed
      - `error_message` (text) - Error details if failed
      - `processed_at` (timestamptz) - When webhook was processed
      - `created_at` (timestamptz) - When webhook was received

    - `admin_audit_logs`
      - `id` (uuid, primary key) - Unique log identifier
      - `admin_id` (uuid, foreign key) - Admin who performed action
      - `action` (text) - Action performed
      - `resource_type` (text) - Type of resource: event, user, coupon
      - `resource_id` (text) - Identifier of affected resource
      - `old_values` (jsonb) - Previous values before change
      - `new_values` (jsonb) - New values after change
      - `ip_address` (text) - Admin IP address
      - `created_at` (timestamptz) - Action timestamp

  2. Security
    - Enable RLS on analytics_events (admins only)
    - Enable RLS on webhook_logs (admins only)
    - Enable RLS on admin_audit_logs (admins only)

  3. Indexes
    - Index on event_name for aggregation queries
    - Index on user_id for user analytics
    - Index on created_at for time-based queries
    - Index on source and event_type for webhook filtering
*/

CREATE TABLE IF NOT EXISTS analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  event_name text NOT NULL,
  event_category text NOT NULL DEFAULT 'engagement' CHECK (event_category IN ('engagement', 'conversion', 'navigation', 'error')),
  event_data jsonb DEFAULT '{}'::jsonb,
  session_id text,
  ip_address text,
  user_agent text,
  referrer text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS webhook_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL,
  event_type text NOT NULL,
  payload jsonb NOT NULL,
  status text NOT NULL DEFAULT 'received' CHECK (status IN ('received', 'processed', 'failed')),
  error_message text,
  processed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id text,
  old_values jsonb,
  new_values jsonb,
  ip_address text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all analytics events"
  ON analytics_events FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

CREATE POLICY "Admins can view all webhook logs"
  ON webhook_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

CREATE POLICY "Admins can view all audit logs"
  ON admin_audit_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

CREATE INDEX IF NOT EXISTS idx_analytics_events_event_name ON analytics_events(event_name);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_source ON webhook_logs(source);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_event_type ON webhook_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_created_at ON webhook_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_admin_id ON admin_audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_resource_type ON admin_audit_logs(resource_type);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_created_at ON admin_audit_logs(created_at DESC);
