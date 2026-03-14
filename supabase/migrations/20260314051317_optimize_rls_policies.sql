/*
  # Optimize RLS Policies for Performance

  ## Summary
  This migration optimizes Row Level Security (RLS) policies to prevent
  re-evaluation of auth.uid() for each row, which improves query performance
  at scale.

  ## Changes Made
  
  ### profiles table
  - Updated "Users can insert their own profile" policy
  - Updated "Users can update their own profile" policy
  
  ### listings table
  - Updated "Authenticated users can create listings" policy
  - Updated "Sellers can update their own listings" policy
  - Updated "Sellers can delete their own listings" policy
  
  ### bids table
  - Updated "Authenticated users can place bids" policy
  
  ### photos table
  - Updated "Listing owners can upload photos" policy
  - Updated "Listing owners can delete photos" policy
  
  ### search_alerts table
  - Updated "Users can view their own search alerts" policy
  - Updated "Users can create their own search alerts" policy
  - Updated "Users can update their own search alerts" policy
  - Updated "Users can delete their own search alerts" policy

  ## Performance Improvement
  By wrapping auth.uid() in (SELECT auth.uid()), PostgreSQL evaluates the
  function once per query instead of once per row, significantly improving
  performance on large datasets.
*/

-- Drop and recreate profiles policies
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = id)
  WITH CHECK ((SELECT auth.uid()) = id);

-- Drop and recreate listings policies
DROP POLICY IF EXISTS "Authenticated users can create listings" ON listings;
DROP POLICY IF EXISTS "Sellers can update their own listings" ON listings;
DROP POLICY IF EXISTS "Sellers can delete their own listings" ON listings;

CREATE POLICY "Authenticated users can create listings"
  ON listings FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = seller_id);

CREATE POLICY "Sellers can update their own listings"
  ON listings FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = seller_id)
  WITH CHECK ((SELECT auth.uid()) = seller_id);

CREATE POLICY "Sellers can delete their own listings"
  ON listings FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = seller_id);

-- Drop and recreate bids policies
DROP POLICY IF EXISTS "Authenticated users can place bids" ON bids;

CREATE POLICY "Authenticated users can place bids"
  ON bids FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = bidder_id);

-- Drop and recreate photos policies
DROP POLICY IF EXISTS "Listing owners can upload photos" ON photos;
DROP POLICY IF EXISTS "Listing owners can delete photos" ON photos;

CREATE POLICY "Listing owners can upload photos"
  ON photos FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM listings
      WHERE listings.id = listing_id
      AND listings.seller_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Listing owners can delete photos"
  ON photos FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM listings
      WHERE listings.id = listing_id
      AND listings.seller_id = (SELECT auth.uid())
    )
  );

-- Drop and recreate search_alerts policies
DROP POLICY IF EXISTS "Users can view their own search alerts" ON search_alerts;
DROP POLICY IF EXISTS "Users can create their own search alerts" ON search_alerts;
DROP POLICY IF EXISTS "Users can update their own search alerts" ON search_alerts;
DROP POLICY IF EXISTS "Users can delete their own search alerts" ON search_alerts;

CREATE POLICY "Users can view their own search alerts"
  ON search_alerts FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can create their own search alerts"
  ON search_alerts FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update their own search alerts"
  ON search_alerts FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete their own search alerts"
  ON search_alerts FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);
