/*
  # Fix Security and Performance Issues

  1. Security Fixes
    - Fix function search path vulnerability in get_user_emails
    - Consolidate multiple permissive policies into single restrictive policies
  
  2. Performance Improvements
    - Remove unused indexes that have never been accessed
    - Keep only actively used indexes for optimal performance
  
  3. Changes Made
    - Set search_path for get_user_emails function
    - Combine DELETE policies on listings table
    - Combine UPDATE policies on profiles table
    - Drop 29 unused indexes
*/

-- Fix search path for get_user_emails function
DROP FUNCTION IF EXISTS get_user_emails(uuid[]);

CREATE FUNCTION get_user_emails(user_ids uuid[])
RETURNS TABLE (user_id uuid, email text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  RETURN QUERY
  SELECT id, email::text
  FROM auth.users
  WHERE id = ANY(user_ids);
END;
$$;

GRANT EXECUTE ON FUNCTION get_user_emails TO authenticated, anon;

-- Fix multiple permissive policies on listings table for DELETE
-- Drop existing policies and create a single policy that combines both conditions
DROP POLICY IF EXISTS "Admins can delete any listing" ON listings;
DROP POLICY IF EXISTS "Sellers can delete their own listings" ON listings;

CREATE POLICY "Users can delete own listings or admins can delete any"
  ON listings
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() = seller_id 
    OR 
    (auth.jwt()->>'app_metadata')::jsonb->>'role' = 'admin'
  );

-- Fix multiple permissive policies on profiles table for UPDATE
-- Drop existing policies and create a single policy
DROP POLICY IF EXISTS "Only admins can modify admin status" ON profiles;
DROP POLICY IF EXISTS "Users can update own non-admin fields" ON profiles;

CREATE POLICY "Users can update own profile with admin restrictions"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id 
    AND (
      -- If trying to set is_admin, must be current admin
      CASE 
        WHEN (SELECT is_admin FROM profiles WHERE id = auth.uid()) = true 
        THEN true
        ELSE is_admin = (SELECT is_admin FROM profiles WHERE id = auth.uid())
      END
    )
  );

-- Drop unused indexes (these have never been used according to pg_stat_user_indexes)
DROP INDEX IF EXISTS idx_deal_complaints_complainant_id;
DROP INDEX IF EXISTS idx_listings_seller_id;
DROP INDEX IF EXISTS idx_bids_bidder_id;
DROP INDEX IF EXISTS idx_bids_listing_id;
DROP INDEX IF EXISTS idx_deal_complaints_accused_id;
DROP INDEX IF EXISTS idx_photos_listing_id;
DROP INDEX IF EXISTS idx_search_alerts_user_id;
DROP INDEX IF EXISTS idx_phone_verification_user_id;
DROP INDEX IF EXISTS idx_phone_verification_phone;
DROP INDEX IF EXISTS idx_login_attempts_user_id;
DROP INDEX IF EXISTS idx_login_attempts_created_at;
DROP INDEX IF EXISTS idx_watchlist_user_id;
DROP INDEX IF EXISTS idx_watchlist_listing_id;
DROP INDEX IF EXISTS idx_banned_users_banned_by;
DROP INDEX IF EXISTS idx_deal_complaints_reviewed_by;
DROP INDEX IF EXISTS idx_two_factor_settings_phone_verification_id;
DROP INDEX IF EXISTS idx_bids_active;
DROP INDEX IF EXISTS idx_notifications_user_id;
DROP INDEX IF EXISTS idx_notifications_created_at;
DROP INDEX IF EXISTS idx_comments_listing_id;
DROP INDEX IF EXISTS idx_comments_user_id;
DROP INDEX IF EXISTS idx_comments_parent_id;
DROP INDEX IF EXISTS idx_comments_created_at;
DROP INDEX IF EXISTS idx_comment_likes_comment_id;
DROP INDEX IF EXISTS idx_comment_likes_user_id;
DROP INDEX IF EXISTS idx_listing_likes_user_id;
DROP INDEX IF EXISTS idx_notifications_bid_id;
DROP INDEX IF EXISTS idx_notifications_listing_id;