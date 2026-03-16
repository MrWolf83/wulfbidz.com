/*
  # Fix All Security and Performance Issues

  ## Changes Made

  1. **Add Missing Foreign Key Indexes**
     - Add index on bids(bidder_id)
     - Add index on bids(listing_id)
     - Add index on deal_complaints(accused_id)
     - Add index on deal_complaints(complainant_id)
     - Add index on listings(seller_id)
     - Add index on photos(listing_id)
     - Add index on search_alerts(user_id)

  2. **Remove Unused Indexes**
     - Drop idx_listings_lot_number
     - Drop idx_banned_users_banned_by
     - Drop idx_complaints_reviewed_by
     - Drop idx_profiles_is_admin

  3. **Fix RLS Policy Performance Issues**
     - Update profiles policies to use (select auth.uid()) instead of auth.uid()
     - This prevents re-evaluation for each row

  4. **Remove Duplicate Permissive Policies**
     - Remove duplicate SELECT policies on bids table
     - Remove duplicate SELECT policies on listings table
     - Remove duplicate SELECT policies on photos table
     - Remove duplicate UPDATE policies on profiles table

  5. **Fix Function Search Path**
     - Set immutable search_path for is_user_admin function

  ## Security Impact
  - Improved query performance with proper indexes
  - Better RLS policy performance at scale
  - Cleaner policy structure without duplicates
  - Secure function execution path
*/

-- =====================================================
-- 1. ADD MISSING FOREIGN KEY INDEXES
-- =====================================================

-- Bids table indexes
CREATE INDEX IF NOT EXISTS idx_bids_bidder_id ON public.bids(bidder_id);
CREATE INDEX IF NOT EXISTS idx_bids_listing_id ON public.bids(listing_id);

-- Deal complaints table indexes
CREATE INDEX IF NOT EXISTS idx_deal_complaints_accused_id ON public.deal_complaints(accused_id);
CREATE INDEX IF NOT EXISTS idx_deal_complaints_complainant_id ON public.deal_complaints(complainant_id);

-- Listings table index
CREATE INDEX IF NOT EXISTS idx_listings_seller_id ON public.listings(seller_id);

-- Photos table index
CREATE INDEX IF NOT EXISTS idx_photos_listing_id ON public.photos(listing_id);

-- Search alerts table index
CREATE INDEX IF NOT EXISTS idx_search_alerts_user_id ON public.search_alerts(user_id);

-- =====================================================
-- 2. REMOVE UNUSED INDEXES
-- =====================================================

DROP INDEX IF EXISTS public.idx_listings_lot_number;
DROP INDEX IF EXISTS public.idx_banned_users_banned_by;
DROP INDEX IF EXISTS public.idx_complaints_reviewed_by;
DROP INDEX IF EXISTS public.idx_profiles_is_admin;

-- =====================================================
-- 3. FIX RLS POLICY PERFORMANCE ISSUES
-- =====================================================

-- Drop and recreate profiles policies with optimized auth.uid() calls

DROP POLICY IF EXISTS "Only admins can modify admin status" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own non-admin fields" ON public.profiles;

CREATE POLICY "Only admins can modify admin status"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid()) AND is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid()) AND is_admin = true
    )
  );

CREATE POLICY "Users can update own non-admin fields"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (id = (SELECT auth.uid()))
  WITH CHECK (
    id = (SELECT auth.uid())
    AND is_admin = (SELECT is_admin FROM public.profiles WHERE id = (SELECT auth.uid()))
  );

-- =====================================================
-- 4. REMOVE DUPLICATE PERMISSIVE POLICIES
-- =====================================================

-- Bids table - remove duplicate SELECT policies
DROP POLICY IF EXISTS "Bids are viewable by everyone" ON public.bids;
-- Keep "Anyone can view bids" policy

-- Listings table - remove duplicate SELECT policies
DROP POLICY IF EXISTS "Listings are viewable by everyone" ON public.listings;
-- Keep "Anyone can view active listings" policy

-- Photos table - remove duplicate SELECT policies
DROP POLICY IF EXISTS "Photos are viewable by everyone" ON public.photos;
-- Keep "Anyone can view listing photos" policy

-- Profiles table - remove duplicate UPDATE policy
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
-- Keep the two specific policies above for admin and non-admin field updates

-- =====================================================
-- 5. FIX FUNCTION SEARCH PATH
-- =====================================================

-- Recreate is_user_admin function with immutable search_path
CREATE OR REPLACE FUNCTION public.is_user_admin(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = user_id AND is_admin = true
  );
END;
$$;
