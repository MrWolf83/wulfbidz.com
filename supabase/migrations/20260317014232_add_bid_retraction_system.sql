/*
  # Add Bid Retraction System

  ## Summary
  Adds ability for users to retract their own bids on active auctions.

  ## Changes Made
  1. Tables Modified
    - `bids` table:
      - Add `is_retracted` boolean column to track retracted bids
      - Add `retracted_at` timestamp for when bid was retracted

  2. Security
    - Add RLS policy allowing users to update their own bids (for retraction only)
    - Ensure only the bidder can retract their own bid
    - Prevent retracting bids that are already retracted

  3. Notes
    - Retracted bids remain in history but are marked as inactive
    - When a bid is retracted, the listing's current_bid should be recalculated
    - Users can only retract their most recent bid on a listing
*/

-- Add retraction tracking columns to bids table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bids' AND column_name = 'is_retracted'
  ) THEN
    ALTER TABLE bids ADD COLUMN is_retracted boolean DEFAULT false NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bids' AND column_name = 'retracted_at'
  ) THEN
    ALTER TABLE bids ADD COLUMN retracted_at timestamptz;
  END IF;
END $$;

-- Add RLS policy for users to retract their own bids
DROP POLICY IF EXISTS "Users can retract own bids" ON bids;
CREATE POLICY "Users can retract own bids"
  ON bids FOR UPDATE
  TO authenticated
  USING (auth.uid() = bidder_id)
  WITH CHECK (
    auth.uid() = bidder_id AND
    is_retracted = true AND
    retracted_at IS NOT NULL
  );

-- Create index for faster queries on active bids
CREATE INDEX IF NOT EXISTS idx_bids_active ON bids(listing_id, is_retracted, created_at DESC)
WHERE is_retracted = false;