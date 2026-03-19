/*
  # Change Auction Fees from Seller to Buyer

  1. Schema Changes
    - Remove seller_fee column from completed_transactions
    - Update buyer_fee to be the primary fee field
    - Remove buyer_fee_cap (will use buyer_fee instead)
    - Rename seller_fee_percentage to buyer_fee_percentage in profiles
    - Rename seller_fee_max to buyer_fee_max in profiles
    - Update all constraints and defaults

  2. Function Updates
    - Rename calculate_seller_fee to calculate_buyer_fee
    - Update function logic to calculate buyer fee instead

  3. Updated Fee Structure
    - 5% buyer fee (instead of seller fee)
    - $4,000 maximum cap

  4. Important Notes
    - Existing transactions keep seller_fee for historical accuracy
    - New transactions will use buyer_fee
    - UI will show "Auction Fees" instead of "Seller Fees"
*/

-- Step 1: Clean up completed_transactions table
-- Remove buyer_fee_cap column (was incorrectly added)
ALTER TABLE completed_transactions 
  DROP COLUMN IF EXISTS buyer_fee_cap;

-- Keep seller_fee for historical transactions, but we'll add buyer_fee with default 0
-- The buyer_fee column already exists, so we just need to update its default
ALTER TABLE completed_transactions 
  ALTER COLUMN buyer_fee SET DEFAULT 0;

ALTER TABLE completed_transactions 
  ALTER COLUMN buyer_fee SET NOT NULL;

-- Add constraint for buyer_fee
ALTER TABLE completed_transactions 
  DROP CONSTRAINT IF EXISTS valid_buyer_fee;

ALTER TABLE completed_transactions 
  ADD CONSTRAINT valid_buyer_fee CHECK (buyer_fee >= 0 AND buyer_fee <= final_price);

-- Step 2: Rename columns in profiles table
ALTER TABLE profiles 
  RENAME COLUMN seller_fee_percentage TO buyer_fee_percentage;

ALTER TABLE profiles 
  RENAME COLUMN seller_fee_max TO buyer_fee_max;

-- Step 3: Drop old function and create new one
DROP FUNCTION IF EXISTS calculate_seller_fee(uuid, numeric);

CREATE OR REPLACE FUNCTION calculate_buyer_fee(
  buyer_id_param uuid,
  final_price_param numeric
)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  fee_percentage numeric;
  fee_max numeric;
  calculated_fee numeric;
BEGIN
  -- Get buyer's fee configuration (from system defaults in profiles)
  SELECT 
    COALESCE(buyer_fee_percentage, 5.0),
    COALESCE(buyer_fee_max, 4000.00)
  INTO fee_percentage, fee_max
  FROM profiles
  WHERE id = buyer_id_param;

  -- Calculate fee: min(price * percentage / 100, max_fee)
  calculated_fee := LEAST(
    final_price_param * (fee_percentage / 100.0),
    fee_max
  );

  RETURN ROUND(calculated_fee, 2);
END;
$$;

GRANT EXECUTE ON FUNCTION calculate_buyer_fee TO authenticated, anon;