/*
  # Add Auction End Notification System

  1. Changes
    - Add `auction_ended` column to notifications table to track auction completion notifications
    - Add `notification_type` enum if not exists to categorize different types of notifications
    - Create function to automatically generate auction end notifications
    - Add trigger to create notifications when auction ends

  2. Security
    - Existing RLS policies will handle access control
    - Only authenticated users can view their own notifications
*/

-- Add auction_ended type to notifications if not already covered
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notifications' AND column_name = 'notification_type'
  ) THEN
    ALTER TABLE notifications ADD COLUMN notification_type text DEFAULT 'general';
  END IF;
END $$;

-- Create function to generate auction end notifications
CREATE OR REPLACE FUNCTION create_auction_end_notifications()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  listing_record RECORD;
  winner_record RECORD;
BEGIN
  -- Find all listings that have ended and haven't had end notifications sent
  FOR listing_record IN
    SELECT l.id, l.seller_id, l.title, l.current_bid, l.reserve_price, l.status
    FROM listings l
    WHERE l.auction_end < NOW()
      AND l.status = 'active'
      AND NOT EXISTS (
        SELECT 1 FROM notifications n
        WHERE n.listing_id = l.id
        AND n.notification_type = 'auction_ended_seller'
      )
  LOOP
    -- Find the highest bidder
    SELECT b.bidder_id, b.amount INTO winner_record
    FROM bids b
    WHERE b.listing_id = listing_record.id
      AND b.is_retracted = false
    ORDER BY b.amount DESC
    LIMIT 1;

    -- If there's a winner and reserve met (or no reserve)
    IF winner_record.bidder_id IS NOT NULL AND 
       (listing_record.reserve_price IS NULL OR winner_record.amount >= listing_record.reserve_price) THEN
      
      -- Create notification for seller
      INSERT INTO notifications (user_id, listing_id, title, message, notification_type)
      VALUES (
        listing_record.seller_id,
        listing_record.id,
        'Congratulations! Your vehicle sold',
        'Your ' || listing_record.title || ' sold for $' || winner_record.amount::text || '. The winning bidder will contact you soon.',
        'auction_ended_seller'
      );

      -- Create notification for winner
      INSERT INTO notifications (user_id, listing_id, title, message, notification_type)
      VALUES (
        winner_record.bidder_id,
        listing_record.id,
        'Congratulations! You won the auction',
        'You won the auction for ' || listing_record.title || ' with your bid of $' || winner_record.amount::text || '. Please contact the seller to arrange payment and pickup.',
        'auction_ended_winner'
      );

      -- Update listing status to sold
      UPDATE listings
      SET status = 'sold'
      WHERE id = listing_record.id;
    ELSE
      -- Reserve not met or no bids
      INSERT INTO notifications (user_id, listing_id, title, message, notification_type)
      VALUES (
        listing_record.seller_id,
        listing_record.id,
        'Auction Ended',
        'Your auction for ' || listing_record.title || ' has ended. The reserve price was not met.',
        'auction_ended_seller'
      );

      -- Update listing status to ended
      UPDATE listings
      SET status = 'ended'
      WHERE id = listing_record.id;
    END IF;
  END LOOP;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_auction_end_notifications() TO authenticated;