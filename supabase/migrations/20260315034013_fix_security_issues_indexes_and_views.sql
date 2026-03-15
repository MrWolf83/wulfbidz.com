/*
  # Fix Security Issues - Indexes and Views

  1. Changes Made
    - Add missing indexes for foreign keys on `banned_users.banned_by` and `deal_complaints.reviewed_by`
    - Remove unused indexes that are not being utilized by queries
    - Replace SECURITY DEFINER view with SECURITY INVOKER for `admin_complaints_view`

  2. Performance Impact
    - Adding indexes on foreign keys improves JOIN performance
    - Removing unused indexes reduces write overhead and storage

  3. Security Impact
    - SECURITY INVOKER view ensures queries run with caller's permissions (more secure)
    - Relies on RLS policies for access control instead of elevated privileges
*/

-- Add missing indexes for foreign keys
CREATE INDEX IF NOT EXISTS idx_banned_users_banned_by 
  ON public.banned_users(banned_by);

CREATE INDEX IF NOT EXISTS idx_complaints_reviewed_by 
  ON public.deal_complaints(reviewed_by);

-- Drop unused indexes
DROP INDEX IF EXISTS public.idx_complaints_complainant_id;
DROP INDEX IF EXISTS public.idx_listings_seller_id;
DROP INDEX IF EXISTS public.idx_photos_listing_id;
DROP INDEX IF EXISTS public.idx_search_alerts_user_id;
DROP INDEX IF EXISTS public.idx_bids_bidder_id;
DROP INDEX IF EXISTS public.idx_bids_listing_id;
DROP INDEX IF EXISTS public.idx_complaints_accused_id;

-- Replace SECURITY DEFINER view with SECURITY INVOKER
DROP VIEW IF EXISTS public.admin_complaints_view;

CREATE OR REPLACE VIEW public.admin_complaints_view
WITH (security_invoker = true)
AS
SELECT 
  dc.id,
  dc.listing_id,
  dc.complainant_id,
  dc.accused_id,
  dc.complaint_type,
  dc.description,
  dc.status,
  dc.reviewed_by,
  dc.admin_notes,
  dc.created_at,
  dc.reviewed_at,
  complainant.email as complainant_email,
  accused.email as accused_email,
  reviewer.email as reviewer_email,
  l.title as listing_title
FROM public.deal_complaints dc
LEFT JOIN auth.users complainant ON dc.complainant_id = complainant.id
LEFT JOIN auth.users accused ON dc.accused_id = accused.id
LEFT JOIN auth.users reviewer ON dc.reviewed_by = reviewer.id
LEFT JOIN public.listings l ON dc.listing_id = l.id;