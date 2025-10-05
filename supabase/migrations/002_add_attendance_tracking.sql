/*
  # Session Attendance Tracking

  1. New Tables
    - `session_attendance`
      - `id` (uuid, primary key) - Unique attendance record
      - `registration_id` (uuid, foreign key) - References registrations
      - `user_id` (uuid, foreign key) - References auth.users
      - `event_id` (uuid, foreign key) - References events
      - `check_in_time` (timestamptz) - When student joined session
      - `check_out_time` (timestamptz) - When student left session
      - `duration_minutes` (integer) - Calculated attendance duration
      - `ip_address` (text) - IP address for verification
      - `user_agent` (text) - Browser/device information
      - `created_at` (timestamptz) - Record creation time

  2. Security
    - Enable RLS on session_attendance table
    - Add policy for users to insert their own attendance
    - Add policy for users to view their own attendance
    - Add policy for admins to view all attendance

  3. Indexes
    - Index on user_id for user attendance history
    - Index on event_id for event attendance reports
    - Index on check_in_time for temporal queries
*/

CREATE TABLE IF NOT EXISTS session_attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id uuid NOT NULL REFERENCES registrations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  check_in_time timestamptz DEFAULT now(),
  check_out_time timestamptz,
  duration_minutes integer,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE session_attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own attendance"
  ON session_attendance FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own attendance"
  ON session_attendance FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own attendance"
  ON session_attendance FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all attendance"
  ON session_attendance FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

CREATE INDEX IF NOT EXISTS idx_session_attendance_user_id ON session_attendance(user_id);
CREATE INDEX IF NOT EXISTS idx_session_attendance_event_id ON session_attendance(event_id);
CREATE INDEX IF NOT EXISTS idx_session_attendance_check_in_time ON session_attendance(check_in_time DESC);
