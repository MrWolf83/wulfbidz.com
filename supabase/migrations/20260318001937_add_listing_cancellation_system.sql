/*
  # Add Listing Cancellation System

  1. Changes
    - Add `cancellation_reason` column to listings table to track why a listing was cancelled
    - Add `cancelled_at` timestamp to track when the listing was cancelled
    - Create index on status for better query performance

  2. Security
    - Existing RLS policies will handle access control
    - Only the seller can cancel their own listing
*/

-- Add cancellation tracking columns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'listings' AND column_name = 'cancellation_reason'
  ) THEN
    ALTER TABLE listings ADD COLUMN cancellation_reason text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'listings' AND column_name = 'cancelled_at'
  ) THEN
    ALTER TABLE listings ADD COLUMN cancelled_at timestamptz;
  END IF;
END $$;

-- Create index on status if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'listings' AND indexname = 'idx_listings_status'
  ) THEN
    CREATE INDEX idx_listings_status ON listings(status);
  END IF;
END $$;