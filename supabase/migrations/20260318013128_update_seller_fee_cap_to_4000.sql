/*
  # Update Seller Fee Cap to $4,000

  1. Changes
    - Update default seller_fee_max from $5,000 to $4,000 in profiles table
    - Update existing profiles to use new $4,000 cap

  2. Important Notes
    - All sellers will now have a maximum fee of $4,000 (5% capped at $4,000)
    - This applies to all future and existing transactions
*/

-- Update the default value for new profiles
ALTER TABLE profiles 
  ALTER COLUMN seller_fee_max SET DEFAULT 4000.00;

-- Update existing profiles that have the old $5,000 cap to the new $4,000 cap
UPDATE profiles 
SET seller_fee_max = 4000.00 
WHERE seller_fee_max = 5000.00 OR seller_fee_max IS NULL;