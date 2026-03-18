/*
  # Fix RLS Auth Function Optimization

  1. Performance Improvements
    - Replace auth.uid() with (select auth.uid()) in RLS policies
    - This prevents re-evaluation of auth functions for each row
    - Significantly improves query performance at scale

  2. Policies Updated
    - listings: "Authorized users can delete listings"
    - listings: "Users can delete own listings or admins can delete any"
    - profiles: "Authorized users can update profiles"
    - profiles: "Users can update own profile with admin restrictions"
    - completed_transactions: "Users can view transactions they are part of"

  3. Security Notes
    - No security changes, only performance optimization
    - All policies maintain the same security logic
*/

-- Drop and recreate listings DELETE policies with optimized auth calls
DROP POLICY IF EXISTS "Authorized users can delete listings" ON listings;
DROP POLICY IF EXISTS "Users can delete own listings or admins can delete any" ON listings;

CREATE POLICY "Users can delete own listings or admins can delete any"
  ON listings
  FOR DELETE
  TO authenticated
  USING (
    seller_id = (select auth.uid()) 
    OR 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = (select auth.uid()) 
      AND is_admin = true
    )
  );

-- Drop and recreate profiles UPDATE policies with optimized auth calls
DROP POLICY IF EXISTS "Authorized users can update profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile with admin restrictions" ON profiles;

CREATE POLICY "Users can update own profile with admin restrictions"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (
    id = (select auth.uid())
    OR
    EXISTS (
      SELECT 1 FROM profiles AS p
      WHERE p.id = (select auth.uid())
      AND p.is_admin = true
    )
  )
  WITH CHECK (
    (id = (select auth.uid()) AND is_admin = (SELECT is_admin FROM profiles WHERE id = (select auth.uid())))
    OR
    EXISTS (
      SELECT 1 FROM profiles AS p
      WHERE p.id = (select auth.uid())
      AND p.is_admin = true
    )
  );

-- Drop and recreate completed_transactions SELECT policy with optimized auth calls
DROP POLICY IF EXISTS "Users can view transactions they are part of" ON completed_transactions;

CREATE POLICY "Users can view transactions they are part of"
  ON completed_transactions
  FOR SELECT
  TO authenticated
  USING (
    seller_id = (select auth.uid())
    OR
    buyer_id = (select auth.uid())
    OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = (select auth.uid())
      AND is_admin = true
    )
  );