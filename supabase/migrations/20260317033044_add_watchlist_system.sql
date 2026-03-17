/*
  # Add Watchlist System

  ## Summary
  Creates a watchlist feature that allows users to favorite/heart vehicles and track them in a personalized list.

  ## 1. New Tables
    - `watchlist`
      - `id` (uuid, primary key) - Unique identifier for each watchlist entry
      - `user_id` (uuid, foreign key) - References auth.users, the user who favorited the listing
      - `listing_id` (uuid, foreign key) - References listings table, the favorited vehicle
      - `created_at` (timestamptz) - When the listing was added to watchlist
      - Unique constraint on (user_id, listing_id) to prevent duplicates

  ## 2. Security (RLS Policies)
    - Enable RLS on watchlist table
    - Users can view only their own watchlist items
    - Users can add items to their own watchlist
    - Users can remove items from their own watchlist
    - All policies require authentication

  ## 3. Performance
    - Index on user_id for fast watchlist lookups
    - Index on listing_id for tracking popularity
    - Composite index on (user_id, listing_id) for quick duplicate checks

  ## 4. Important Notes
    - Watchlist entries are automatically removed if the listing is deleted (CASCADE)
    - Users cannot favorite the same listing twice
    - Only authenticated users can use the watchlist feature
*/

-- Create watchlist table
CREATE TABLE IF NOT EXISTS watchlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id uuid NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, listing_id)
);

-- Enable RLS
ALTER TABLE watchlist ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own watchlist"
  ON watchlist FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add to own watchlist"
  ON watchlist FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove from own watchlist"
  ON watchlist FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_watchlist_user_id ON watchlist(user_id);
CREATE INDEX IF NOT EXISTS idx_watchlist_listing_id ON watchlist(listing_id);
CREATE INDEX IF NOT EXISTS idx_watchlist_user_listing ON watchlist(user_id, listing_id);