/*
  # Add Bid Notifications System

  1. New Tables
    - `notifications`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `type` (text, notification type)
      - `title` (text, notification title)
      - `message` (text, notification message)
      - `listing_id` (uuid, references listings)
      - `bid_id` (uuid, references bids)
      - `is_read` (boolean, default false)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `notifications` table
    - Add policy for users to read their own notifications
    - Add policy for users to update their own notifications (mark as read)

  3. Triggers
    - Create trigger to automatically send notifications when a bid is placed
    - Notify both seller and bidder

  4. Performance
    - Add indexes for user_id and is_read for efficient querying
    - Add index for created_at for ordering
*/

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  listing_id uuid REFERENCES listings(id) ON DELETE CASCADE,
  bid_id uuid REFERENCES bids(id) ON DELETE CASCADE,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own notifications"
  ON notifications
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update own notifications"
  ON notifications
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id 
  ON notifications(user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_is_read 
  ON notifications(user_id, is_read);

CREATE INDEX IF NOT EXISTS idx_notifications_created_at 
  ON notifications(created_at DESC);

-- Add updated_at trigger
DROP TRIGGER IF EXISTS update_notifications_updated_at ON notifications;
CREATE TRIGGER update_notifications_updated_at
  BEFORE UPDATE ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to create bid notifications
CREATE OR REPLACE FUNCTION create_bid_notifications()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_listing record;
  v_bidder_name text;
  v_seller_name text;
BEGIN
  -- Get listing details
  SELECT l.*, p.full_name as seller_name
  INTO v_listing
  FROM listings l
  JOIN profiles p ON p.id = l.seller_id
  WHERE l.id = NEW.listing_id;

  -- Get bidder name
  SELECT full_name INTO v_bidder_name
  FROM profiles
  WHERE id = NEW.bidder_id;

  -- Create notification for seller
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    listing_id,
    bid_id
  ) VALUES (
    v_listing.seller_id,
    'new_bid',
    'New Bid Received',
    v_bidder_name || ' placed a bid of $' || NEW.amount || ' on your listing: ' || v_listing.title,
    NEW.listing_id,
    NEW.id
  );

  -- Create notification for bidder
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    listing_id,
    bid_id
  ) VALUES (
    NEW.bidder_id,
    'bid_placed',
    'Bid Placed Successfully',
    'Your bid of $' || NEW.amount || ' has been placed on: ' || v_listing.title,
    NEW.listing_id,
    NEW.id
  );

  RETURN NEW;
END;
$$;

-- Create trigger for bid notifications
DROP TRIGGER IF EXISTS trigger_bid_notifications ON bids;
CREATE TRIGGER trigger_bid_notifications
  AFTER INSERT ON bids
  FOR EACH ROW
  WHEN (NEW.is_retracted = false)
  EXECUTE FUNCTION create_bid_notifications();
