/*
  # Session Recordings and Waitlist

  1. New Tables
    - `session_recordings`
      - `id` (uuid, primary key) - Unique recording identifier
      - `event_id` (uuid, foreign key) - References events
      - `title` (text) - Recording title
      - `description` (text) - Recording description
      - `video_url` (text) - Cloud storage URL for video
      - `duration_minutes` (integer) - Video duration
      - `file_size_mb` (numeric) - File size in megabytes
      - `thumbnail_url` (text) - Preview thumbnail URL
      - `processing_status` (text) - Status: uploading, processing, ready, failed
      - `uploaded_at` (timestamptz) - When recording was uploaded
      - `created_at` (timestamptz) - Record creation time

    - `event_waitlist`
      - `id` (uuid, primary key) - Unique waitlist entry
      - `user_id` (uuid, foreign key) - References auth.users
      - `event_id` (uuid, foreign key) - References events
      - `position` (integer) - Position in waitlist
      - `notified_at` (timestamptz) - When user was notified of spot
      - `expires_at` (timestamptz) - When notification expires
      - `status` (text) - Status: waiting, notified, registered, expired
      - `created_at` (timestamptz) - When added to waitlist

  2. Security
    - Enable RLS on session_recordings
    - Enable RLS on event_waitlist
    - Users can view recordings for registered events
    - Users can manage their own waitlist entries

  3. Indexes
    - Index on event_id for event recordings
    - Index on waitlist position for ordering
*/

CREATE TABLE IF NOT EXISTS session_recordings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  video_url text NOT NULL,
  duration_minutes integer,
  file_size_mb numeric,
  thumbnail_url text,
  processing_status text NOT NULL DEFAULT 'uploading' CHECK (processing_status IN ('uploading', 'processing', 'ready', 'failed')),
  uploaded_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS event_waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  position integer NOT NULL,
  notified_at timestamptz,
  expires_at timestamptz,
  status text NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'notified', 'registered', 'expired')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, event_id)
);

ALTER TABLE session_recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view recordings for registered events"
  ON session_recordings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM registrations
      WHERE registrations.event_id = session_recordings.event_id
      AND registrations.user_id = auth.uid()
      AND registrations.payment_status IN ('completed', 'free')
    )
  );

CREATE POLICY "Admins can manage all recordings"
  ON session_recordings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

CREATE POLICY "Users can view own waitlist entries"
  ON event_waitlist FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own waitlist entries"
  ON event_waitlist FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own waitlist entries"
  ON event_waitlist FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all waitlist entries"
  ON event_waitlist FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

CREATE INDEX IF NOT EXISTS idx_session_recordings_event_id ON session_recordings(event_id);
CREATE INDEX IF NOT EXISTS idx_session_recordings_processing_status ON session_recordings(processing_status);
CREATE INDEX IF NOT EXISTS idx_event_waitlist_event_id ON event_waitlist(event_id);
CREATE INDEX IF NOT EXISTS idx_event_waitlist_user_id ON event_waitlist(user_id);
CREATE INDEX IF NOT EXISTS idx_event_waitlist_position ON event_waitlist(position);
CREATE INDEX IF NOT EXISTS idx_event_waitlist_status ON event_waitlist(status);
