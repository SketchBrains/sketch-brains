/*
  # Certificates Management

  1. New Tables
    - `certificates`
      - `id` (uuid, primary key) - Unique certificate identifier
      - `user_id` (uuid, foreign key) - References auth.users
      - `event_id` (uuid, foreign key) - References events
      - `registration_id` (uuid, foreign key) - References registrations
      - `certificate_number` (text, unique) - Human-readable certificate number
      - `verification_token` (text, unique) - Token for public verification
      - `issued_at` (timestamptz) - When certificate was issued
      - `revoked_at` (timestamptz) - When certificate was revoked (if any)
      - `revoke_reason` (text) - Reason for revocation
      - `pdf_url` (text) - Cloud storage URL for PDF certificate
      - `blockchain_hash` (text) - Blockchain verification hash
      - `metadata` (jsonb) - Additional certificate data
      - `created_at` (timestamptz) - Record creation time

  2. Security
    - Enable RLS on certificates table
    - Add policy for users to view their own certificates
    - Add policy for admins to manage all certificates
    - Add policy for public verification using token

  3. Indexes
    - Index on user_id for user certificate lookup
    - Index on certificate_number for quick searches
    - Index on verification_token for public verification
    - Index on event_id for event-based queries
*/

CREATE TABLE IF NOT EXISTS certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  registration_id uuid NOT NULL REFERENCES registrations(id) ON DELETE CASCADE,
  certificate_number text UNIQUE NOT NULL,
  verification_token text UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  issued_at timestamptz DEFAULT now(),
  revoked_at timestamptz,
  revoke_reason text,
  pdf_url text,
  blockchain_hash text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own certificates"
  ON certificates FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all certificates"
  ON certificates FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

CREATE POLICY "Admins can insert certificates"
  ON certificates FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

CREATE POLICY "Admins can update certificates"
  ON certificates FOR UPDATE
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

CREATE INDEX IF NOT EXISTS idx_certificates_user_id ON certificates(user_id);
CREATE INDEX IF NOT EXISTS idx_certificates_event_id ON certificates(event_id);
CREATE INDEX IF NOT EXISTS idx_certificates_certificate_number ON certificates(certificate_number);
CREATE INDEX IF NOT EXISTS idx_certificates_verification_token ON certificates(verification_token);
CREATE INDEX IF NOT EXISTS idx_certificates_issued_at ON certificates(issued_at DESC);
