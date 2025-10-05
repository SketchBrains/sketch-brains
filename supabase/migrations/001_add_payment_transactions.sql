/*
  # Payment Transactions Table

  1. New Tables
    - `payment_transactions`
      - `id` (uuid, primary key) - Unique transaction identifier
      - `user_id` (uuid, foreign key) - References auth.users
      - `event_id` (uuid, foreign key) - References events table
      - `registration_id` (uuid, foreign key) - References registrations table
      - `amount` (numeric) - Transaction amount in INR
      - `currency` (text) - Currency code (default INR)
      - `razorpay_order_id` (text) - Razorpay order identifier
      - `razorpay_payment_id` (text) - Razorpay payment identifier
      - `razorpay_signature` (text) - Payment signature for verification
      - `status` (text) - Transaction status: initiated, success, failed, refunded
      - `payment_method` (text) - Payment method used
      - `error_code` (text) - Error code if failed
      - `error_message` (text) - Error description if failed
      - `created_at` (timestamptz) - Transaction creation time
      - `completed_at` (timestamptz) - Transaction completion time
      - `metadata` (jsonb) - Additional metadata storage

  2. Security
    - Enable RLS on payment_transactions table
    - Add policy for users to read their own transactions
    - Add policy for admins to read all transactions
    - Add policy for system to insert and update transactions

  3. Indexes
    - Index on user_id for fast user transaction lookup
    - Index on event_id for event-based queries
    - Index on razorpay_payment_id for webhook verification
    - Index on status for filtering transactions
*/

CREATE TABLE IF NOT EXISTS payment_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  registration_id uuid REFERENCES registrations(id) ON DELETE SET NULL,
  amount numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'INR',
  razorpay_order_id text,
  razorpay_payment_id text,
  razorpay_signature text,
  status text NOT NULL DEFAULT 'initiated' CHECK (status IN ('initiated', 'success', 'failed', 'refunded')),
  payment_method text,
  error_code text,
  error_message text,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb
);

ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payment transactions"
  ON payment_transactions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all payment transactions"
  ON payment_transactions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

CREATE POLICY "System can insert payment transactions"
  ON payment_transactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can update payment transactions"
  ON payment_transactions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_id ON payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_event_id ON payment_transactions(event_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_razorpay_payment_id ON payment_transactions(razorpay_payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_created_at ON payment_transactions(created_at DESC);
