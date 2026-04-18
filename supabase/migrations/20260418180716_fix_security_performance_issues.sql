/*
  # Fix Security and Performance Issues

  1. Add Missing Foreign Key Indexes
    - Add index on `completed_transactions.buyer_id`
    - Add index on `completed_transactions.listing_id`
    - Add index on `completed_transactions.seller_id`

  2. Remove Unused Indexes
    - These indexes consume storage and slow down writes without providing query benefits
    - Safe to remove as they have not been used

  3. Important Notes
    - Foreign key indexes improve JOIN performance and referential integrity checks
    - Removing unused indexes reduces write overhead and storage costs
    - All changes are non-destructive and performance-focused
*/

-- Add missing foreign key indexes on completed_transactions
CREATE INDEX IF NOT EXISTS idx_completed_transactions_buyer_id 
  ON completed_transactions(buyer_id);

CREATE INDEX IF NOT EXISTS idx_completed_transactions_listing_id 
  ON completed_transactions(listing_id);

CREATE INDEX IF NOT EXISTS idx_completed_transactions_seller_id 
  ON completed_transactions(seller_id);

-- Remove unused indexes to reduce overhead
-- Note: These indexes have not been used and can be safely removed

DROP INDEX IF EXISTS idx_deal_complaints_complainant_id;
DROP INDEX IF EXISTS idx_deal_complaints_reviewed_by;
DROP INDEX IF EXISTS idx_listing_likes_user_id;
DROP INDEX IF EXISTS idx_banned_users_banned_by;
DROP INDEX IF EXISTS idx_bids_bidder_id;
DROP INDEX IF EXISTS idx_bids_listing_id;
DROP INDEX IF EXISTS idx_comment_likes_user_id;
DROP INDEX IF EXISTS idx_comments_listing_id;
DROP INDEX IF EXISTS idx_comments_parent_comment_id;
DROP INDEX IF EXISTS idx_comments_user_id;
DROP INDEX IF EXISTS idx_deal_complaints_accused_id;
DROP INDEX IF EXISTS idx_listings_seller_id;
DROP INDEX IF EXISTS idx_notifications_bid_id;
DROP INDEX IF EXISTS idx_notifications_listing_id;
DROP INDEX IF EXISTS idx_photos_listing_id;
DROP INDEX IF EXISTS idx_search_alerts_user_id;
DROP INDEX IF EXISTS idx_two_factor_login_attempts_user_id;
DROP INDEX IF EXISTS idx_user_two_factor_settings_phone_verification_id;
DROP INDEX IF EXISTS idx_watchlist_listing_id;
