/*
  # Fix Security and Performance Issues

  1. Performance Improvements
    - Add missing indexes for foreign keys on banned_users and deal_complaints tables
    - Optimize RLS policies to use (SELECT auth.uid()) instead of auth.uid() for better performance
    
  2. Security Fixes
    - Set search_path for functions to prevent search path vulnerabilities
    - Remove unused indexes to reduce maintenance overhead
    
  ## Changes Made:
  
  ### New Indexes
  - `idx_banned_users_banned_by` - Index on banned_by foreign key
  - `idx_complaints_reviewed_by` - Index on reviewed_by foreign key
  
  ### RLS Policy Optimizations
  - Updated banned_users policies to use (SELECT auth.uid())
  - Updated deal_complaints policies to use (SELECT auth.uid())
  
  ### Function Security
  - Update is_user_banned and count_recent_complaints to use SET search_path
  
  ### Cleanup
  - Drop unused indexes that are not being utilized
*/

-- Add missing indexes for foreign keys
CREATE INDEX IF NOT EXISTS idx_banned_users_banned_by ON public.banned_users(banned_by);
CREATE INDEX IF NOT EXISTS idx_complaints_reviewed_by ON public.deal_complaints(reviewed_by);

-- Drop existing RLS policies that need optimization
DROP POLICY IF EXISTS "Users can view their own ban status" ON public.banned_users;
DROP POLICY IF EXISTS "Users can submit complaints about their deals" ON public.deal_complaints;
DROP POLICY IF EXISTS "Users can view their own complaints" ON public.deal_complaints;

-- Recreate RLS policies with optimized auth function calls
CREATE POLICY "Users can view their own ban status"
  ON public.banned_users
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can submit complaints about their deals"
  ON public.deal_complaints
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) = complainant_id 
    AND complainant_id <> accused_id 
    AND (
      (
        complaint_type = 'seller_backed_out' 
        AND EXISTS (
          SELECT 1 FROM listings l
          WHERE l.id = listing_id 
          AND l.seller_id = accused_id
          AND EXISTS (
            SELECT 1 FROM bids b
            WHERE b.listing_id = l.id 
            AND b.bidder_id = (SELECT auth.uid())
          )
        )
      )
      OR
      (
        complaint_type = 'buyer_backed_out' 
        AND EXISTS (
          SELECT 1 FROM listings l
          WHERE l.id = listing_id 
          AND l.seller_id = (SELECT auth.uid())
          AND EXISTS (
            SELECT 1 FROM bids b
            WHERE b.listing_id = l.id 
            AND b.bidder_id = accused_id
            AND b.amount = (
              SELECT MAX(b2.amount) FROM bids b2 WHERE b2.listing_id = l.id
            )
          )
        )
      )
    )
  );

CREATE POLICY "Users can view their own complaints"
  ON public.deal_complaints
  FOR SELECT
  TO authenticated
  USING (
    complainant_id = (SELECT auth.uid()) OR
    accused_id = (SELECT auth.uid())
  );

-- Update function search paths for security
ALTER FUNCTION public.is_user_banned(uuid) SET search_path = public;
ALTER FUNCTION public.count_recent_complaints(uuid, integer) SET search_path = public;

-- Drop unused indexes to reduce maintenance overhead
DROP INDEX IF EXISTS public.idx_listings_seller;
DROP INDEX IF EXISTS public.idx_listings_auction_end;
DROP INDEX IF EXISTS public.idx_bids_listing;
DROP INDEX IF EXISTS public.idx_bids_bidder;
DROP INDEX IF EXISTS public.idx_photos_listing;
DROP INDEX IF EXISTS public.idx_search_alerts_user;
DROP INDEX IF EXISTS public.idx_complaints_accused;
DROP INDEX IF EXISTS public.idx_complaints_listing;
DROP INDEX IF EXISTS public.idx_complaints_status;
DROP INDEX IF EXISTS public.idx_banned_users_user;
DROP INDEX IF EXISTS public.idx_banned_users_active;
DROP INDEX IF EXISTS public.idx_complaints_complainant_created;