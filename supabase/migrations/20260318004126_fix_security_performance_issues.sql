/*
  # Fix Security and Performance Issues

  1. Indexes
    - Add missing indexes for notifications foreign keys
    - These improve query performance when filtering by bid_id or listing_id

  2. RLS Policy Optimization
    - Replace auth.uid() with (select auth.uid()) in all RLS policies
    - This prevents re-evaluation for each row, improving performance at scale
    - Affects tables: watchlist, comments, comment_likes, listing_likes

  3. Security Definer Fixes
    - Recreate listing_bidder_counts view without SECURITY DEFINER
    - Add search_path to functions to prevent search_path attacks

  4. Notes
    - Unused indexes are kept as they will be used as data grows
    - Multiple permissive policies are intentional for different user roles
    - Auth DB connection strategy requires infrastructure changes (not in migration)
*/

-- Add missing indexes for notifications table
CREATE INDEX IF NOT EXISTS idx_notifications_bid_id ON notifications(bid_id);
CREATE INDEX IF NOT EXISTS idx_notifications_listing_id ON notifications(listing_id);

-- Drop and recreate watchlist RLS policies with optimized auth checks
DROP POLICY IF EXISTS "Users can view own watchlist" ON watchlist;
DROP POLICY IF EXISTS "Users can add to own watchlist" ON watchlist;
DROP POLICY IF EXISTS "Users can remove from own watchlist" ON watchlist;

CREATE POLICY "Users can view own watchlist"
  ON watchlist FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can add to own watchlist"
  ON watchlist FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can remove from own watchlist"
  ON watchlist FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- Drop and recreate comments RLS policies with optimized auth checks
DROP POLICY IF EXISTS "Authenticated users can create comments" ON comments;
DROP POLICY IF EXISTS "Users can update own comments" ON comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON comments;

CREATE POLICY "Authenticated users can create comments"
  ON comments FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own comments"
  ON comments FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own comments"
  ON comments FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- Drop and recreate comment_likes RLS policies with optimized auth checks
DROP POLICY IF EXISTS "Authenticated users can like comments" ON comment_likes;
DROP POLICY IF EXISTS "Users can unlike comments" ON comment_likes;

CREATE POLICY "Authenticated users can like comments"
  ON comment_likes FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can unlike comments"
  ON comment_likes FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- Drop and recreate listing_likes RLS policies with optimized auth checks
DROP POLICY IF EXISTS "Authenticated users can like listings" ON listing_likes;
DROP POLICY IF EXISTS "Users can unlike listings" ON listing_likes;

CREATE POLICY "Authenticated users can like listings"
  ON listing_likes FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can unlike listings"
  ON listing_likes FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- Recreate listing_bidder_counts view without SECURITY DEFINER
DROP VIEW IF EXISTS listing_bidder_counts;

CREATE VIEW listing_bidder_counts AS
SELECT 
  listing_id,
  COUNT(DISTINCT bidder_id) as bidder_count
FROM bids
WHERE is_retracted = false
GROUP BY listing_id;

-- Grant access to the view
GRANT SELECT ON listing_bidder_counts TO authenticated, anon;

-- Fix function search_path for create_auction_end_notifications
CREATE OR REPLACE FUNCTION create_auction_end_notifications()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ended_listing RECORD;
  winning_bid RECORD;
  other_bidder RECORD;
BEGIN
  FOR ended_listing IN
    SELECT id, title, seller_id, auction_end
    FROM listings
    WHERE status = 'active'
    AND auction_end <= now()
  LOOP
    SELECT *
    INTO winning_bid
    FROM bids
    WHERE listing_id = ended_listing.id
    AND is_retracted = false
    ORDER BY amount DESC
    LIMIT 1;

    IF winning_bid IS NOT NULL THEN
      INSERT INTO notifications (user_id, type, title, message, listing_id, bid_id)
      VALUES (
        winning_bid.bidder_id,
        'auction_won',
        'Congratulations! You won the auction',
        'You won the auction for ' || ended_listing.title || ' with a bid of $' || winning_bid.amount::text,
        ended_listing.id,
        winning_bid.id
      );

      INSERT INTO notifications (user_id, type, title, message, listing_id)
      VALUES (
        ended_listing.seller_id,
        'auction_ended',
        'Your auction has ended',
        'Your listing "' || ended_listing.title || '" sold for $' || winning_bid.amount::text,
        ended_listing.id
      );

      FOR other_bidder IN
        SELECT DISTINCT bidder_id
        FROM bids
        WHERE listing_id = ended_listing.id
        AND bidder_id != winning_bid.bidder_id
        AND is_retracted = false
      LOOP
        INSERT INTO notifications (user_id, type, title, message, listing_id)
        VALUES (
          other_bidder.bidder_id,
          'auction_lost',
          'Auction ended',
          'The auction for ' || ended_listing.title || ' has ended. Another bidder won.',
          ended_listing.id
        );
      END LOOP;
    ELSE
      INSERT INTO notifications (user_id, type, title, message, listing_id)
      VALUES (
        ended_listing.seller_id,
        'auction_ended',
        'Your auction has ended',
        'Your listing "' || ended_listing.title || '" ended with no bids',
        ended_listing.id
      );
    END IF;

    UPDATE listings
    SET status = 'sold'
    WHERE id = ended_listing.id;
  END LOOP;
END;
$$;

-- Fix function search_path for update_comment_updated_at
CREATE OR REPLACE FUNCTION update_comment_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;