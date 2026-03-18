/*
  # Transaction Finalization System

  1. New Tables
    - `completed_transactions`
      - `id` (uuid, primary key)
      - `listing_id` (uuid, references listings)
      - `seller_id` (uuid, references profiles)
      - `buyer_id` (uuid, references profiles)
      - `final_price` (numeric) - Final sale price
      - `seller_fee` (numeric) - 5% fee charged to seller (capped at max)
      - `payment_method` (text) - 'auction_win' or 'buy_now'
      - `seller_email` (text) - Cached at transaction time
      - `seller_phone` (text) - Cached at transaction time
      - `buyer_email` (text) - Cached at transaction time
      - `buyer_phone` (text) - Cached at transaction time
      - `notification_sent` (boolean) - Whether emails have been sent
      - `transaction_completed_at` (timestamptz) - When transaction was marked complete
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Configuration
    - Add seller_fee_percentage and seller_fee_max to profiles table
    - Default: 5% fee, $5000 max

  3. Security
    - Enable RLS on completed_transactions
    - Sellers and buyers can view their own transactions
    - Admins can view all transactions
    - Only system/edge functions can create transactions

  4. Indexes
    - Index on listing_id for transaction lookup
    - Index on seller_id and buyer_id for user transaction history

  5. Important Notes
    - Contact information (email, phone) cached at transaction time
    - Seller fee calculated: min(final_price * 0.05, 5000)
    - Notifications sent to both parties with contact details
    - Home addresses are NOT included in transaction details
*/

-- Add fee configuration to profiles if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'seller_fee_percentage'
  ) THEN
    ALTER TABLE profiles ADD COLUMN seller_fee_percentage numeric DEFAULT 5.0 CHECK (seller_fee_percentage >= 0 AND seller_fee_percentage <= 100);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'seller_fee_max'
  ) THEN
    ALTER TABLE profiles ADD COLUMN seller_fee_max numeric DEFAULT 5000.00 CHECK (seller_fee_max >= 0);
  END IF;
END $$;

-- Create completed_transactions table
CREATE TABLE IF NOT EXISTS completed_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  seller_id uuid NOT NULL REFERENCES profiles(id),
  buyer_id uuid NOT NULL REFERENCES profiles(id),
  final_price numeric NOT NULL CHECK (final_price > 0),
  seller_fee numeric NOT NULL DEFAULT 0 CHECK (seller_fee >= 0),
  payment_method text NOT NULL CHECK (payment_method IN ('auction_win', 'buy_now')),
  seller_email text NOT NULL,
  seller_phone text,
  buyer_email text NOT NULL,
  buyer_phone text,
  notification_sent boolean DEFAULT false,
  transaction_completed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT different_parties CHECK (seller_id != buyer_id),
  CONSTRAINT valid_fee CHECK (seller_fee <= final_price)
);

-- Enable RLS
ALTER TABLE completed_transactions ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_completed_transactions_listing ON completed_transactions(listing_id);
CREATE INDEX IF NOT EXISTS idx_completed_transactions_seller ON completed_transactions(seller_id);
CREATE INDEX IF NOT EXISTS idx_completed_transactions_buyer ON completed_transactions(buyer_id);
CREATE INDEX IF NOT EXISTS idx_completed_transactions_notification ON completed_transactions(notification_sent) WHERE notification_sent = false;

-- RLS Policies: Buyers and sellers can view their transactions
CREATE POLICY "Users can view transactions they are part of"
  ON completed_transactions
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = seller_id 
    OR 
    auth.uid() = buyer_id
    OR
    (auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin'
  );

-- Only edge functions can create transactions (using service role)
-- No INSERT policy for regular users

-- Function to calculate seller fee
CREATE OR REPLACE FUNCTION calculate_seller_fee(
  seller_id_param uuid,
  final_price_param numeric
)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  fee_percentage numeric;
  fee_max numeric;
  calculated_fee numeric;
BEGIN
  -- Get seller's fee configuration
  SELECT 
    COALESCE(seller_fee_percentage, 5.0),
    COALESCE(seller_fee_max, 5000.00)
  INTO fee_percentage, fee_max
  FROM profiles
  WHERE id = seller_id_param;

  -- Calculate fee: min(price * percentage / 100, max_fee)
  calculated_fee := LEAST(
    final_price_param * (fee_percentage / 100.0),
    fee_max
  );

  RETURN ROUND(calculated_fee, 2);
END;
$$;

GRANT EXECUTE ON FUNCTION calculate_seller_fee TO authenticated, anon;

-- Function to get contact info for transaction (excluding home address)
CREATE OR REPLACE FUNCTION get_transaction_contact_info(user_id_param uuid)
RETURNS TABLE (
  email text,
  phone text,
  full_name text,
  city text,
  state text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    au.email::text,
    p.phone_number,
    p.full_name,
    p.city,
    p.state
  FROM profiles p
  JOIN auth.users au ON au.id = p.id
  WHERE p.id = user_id_param;
END;
$$;

GRANT EXECUTE ON FUNCTION get_transaction_contact_info TO authenticated, anon;

-- Add trigger to update updated_at
CREATE OR REPLACE FUNCTION update_completed_transactions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER completed_transactions_updated_at
  BEFORE UPDATE ON completed_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_completed_transactions_updated_at();