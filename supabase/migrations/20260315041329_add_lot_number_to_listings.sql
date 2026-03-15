/*
  # Add Lot Number to Listings

  1. Changes
    - Add `lot_number` column to `listings` table
      - Unique integer identifier for each listing
      - Generated automatically using a sequence
      - Used for easy search and reference
    
  2. Implementation
    - Create a sequence for lot numbers starting at 1000
    - Add lot_number column with default value from sequence
    - Backfill existing listings with lot numbers
    - Add unique constraint to ensure no duplicates
    
  3. Notes
    - Lot numbers start at 1000 for a professional appearance
    - Each new listing automatically gets the next sequential lot number
*/

-- Create sequence for lot numbers starting at 1000
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_sequences 
    WHERE schemaname = 'public' AND sequencename = 'lot_number_seq'
  ) THEN
    CREATE SEQUENCE lot_number_seq START WITH 1000;
  END IF;
END $$;

-- Add lot_number column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'listings' AND column_name = 'lot_number'
  ) THEN
    ALTER TABLE listings 
    ADD COLUMN lot_number INTEGER DEFAULT nextval('lot_number_seq') NOT NULL;
  END IF;
END $$;

-- Backfill lot numbers for any existing listings that don't have one
UPDATE listings 
SET lot_number = nextval('lot_number_seq')
WHERE lot_number IS NULL;

-- Add unique constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'listings_lot_number_key'
  ) THEN
    ALTER TABLE listings ADD CONSTRAINT listings_lot_number_key UNIQUE (lot_number);
  END IF;
END $$;

-- Create index for lot number searches if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_listings_lot_number'
  ) THEN
    CREATE INDEX idx_listings_lot_number ON listings(lot_number);
  END IF;
END $$;