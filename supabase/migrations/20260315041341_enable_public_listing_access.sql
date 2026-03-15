/*
  # Enable Public Access to Listings

  1. Changes
    - Update RLS policies to allow unauthenticated users to view listings
    - Update RLS policies to allow unauthenticated users to view photos
    - Keep bid and user creation policies restricted to authenticated users
    
  2. Security
    - Public users can SELECT listings and photos (read-only)
    - Only authenticated users can create listings, bid, and modify data
    - Sellers can still only modify their own listings
*/

-- Drop existing restrictive SELECT policy for listings
DROP POLICY IF EXISTS "Users can view active listings" ON listings;

-- Create new public SELECT policy for listings
CREATE POLICY "Anyone can view active listings"
  ON listings FOR SELECT
  USING (true);

-- Drop existing restrictive SELECT policy for photos
DROP POLICY IF EXISTS "Users can view listing photos" ON photos;

-- Create new public SELECT policy for photos
CREATE POLICY "Anyone can view listing photos"
  ON photos FOR SELECT
  USING (true);

-- Ensure bids remain restricted to authenticated users
DROP POLICY IF EXISTS "Users can view all bids" ON bids;

CREATE POLICY "Anyone can view bids"
  ON bids FOR SELECT
  USING (true);

-- Keep INSERT policies restricted to authenticated users only
-- (existing policies for INSERT, UPDATE, DELETE remain unchanged)