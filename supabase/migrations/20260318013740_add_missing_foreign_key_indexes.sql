/*
  # Add Missing Foreign Key Indexes

  1. Performance Improvements
    - Add indexes for all foreign key columns to improve JOIN performance
    - Indexes added for:
      - banned_users.banned_by
      - bids.bidder_id and listing_id
      - comment_likes.user_id
      - comments.listing_id, parent_comment_id, and user_id
      - deal_complaints.accused_id, complainant_id, and reviewed_by
      - listing_likes.user_id
      - listings.seller_id
      - notifications.bid_id and listing_id
      - photos.listing_id
      - search_alerts.user_id
      - two_factor_login_attempts.user_id
      - user_two_factor_settings.phone_verification_id
      - watchlist.listing_id

  2. Important Notes
    - These indexes improve query performance for JOINs and foreign key lookups
    - Using IF NOT EXISTS to prevent errors on re-run
*/

-- banned_users foreign key indexes
CREATE INDEX IF NOT EXISTS idx_banned_users_banned_by ON banned_users(banned_by);

-- bids foreign key indexes
CREATE INDEX IF NOT EXISTS idx_bids_bidder_id ON bids(bidder_id);
CREATE INDEX IF NOT EXISTS idx_bids_listing_id ON bids(listing_id);

-- comment_likes foreign key indexes
CREATE INDEX IF NOT EXISTS idx_comment_likes_user_id ON comment_likes(user_id);

-- comments foreign key indexes
CREATE INDEX IF NOT EXISTS idx_comments_listing_id ON comments(listing_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_comment_id ON comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);

-- deal_complaints foreign key indexes
CREATE INDEX IF NOT EXISTS idx_deal_complaints_accused_id ON deal_complaints(accused_id);
CREATE INDEX IF NOT EXISTS idx_deal_complaints_complainant_id ON deal_complaints(complainant_id);
CREATE INDEX IF NOT EXISTS idx_deal_complaints_reviewed_by ON deal_complaints(reviewed_by);

-- listing_likes foreign key indexes
CREATE INDEX IF NOT EXISTS idx_listing_likes_user_id ON listing_likes(user_id);

-- listings foreign key indexes
CREATE INDEX IF NOT EXISTS idx_listings_seller_id ON listings(seller_id);

-- notifications foreign key indexes
CREATE INDEX IF NOT EXISTS idx_notifications_bid_id ON notifications(bid_id);
CREATE INDEX IF NOT EXISTS idx_notifications_listing_id ON notifications(listing_id);

-- photos foreign key indexes
CREATE INDEX IF NOT EXISTS idx_photos_listing_id ON photos(listing_id);

-- search_alerts foreign key indexes
CREATE INDEX IF NOT EXISTS idx_search_alerts_user_id ON search_alerts(user_id);

-- two_factor_login_attempts foreign key indexes
CREATE INDEX IF NOT EXISTS idx_two_factor_login_attempts_user_id ON two_factor_login_attempts(user_id);

-- user_two_factor_settings foreign key indexes
CREATE INDEX IF NOT EXISTS idx_user_two_factor_settings_phone_verification_id ON user_two_factor_settings(phone_verification_id);

-- watchlist foreign key indexes
CREATE INDEX IF NOT EXISTS idx_watchlist_listing_id ON watchlist(listing_id);