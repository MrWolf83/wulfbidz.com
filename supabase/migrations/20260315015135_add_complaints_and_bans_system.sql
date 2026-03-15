/*
  # Add Complaints and Bans System

  ## Overview
  This migration adds functionality to track deal complaints and ban users who repeatedly back out of deals.

  ## New Tables
  
  ### `deal_complaints`
  Stores complaints submitted when deals fall through
  - `id` (uuid, primary key) - Unique complaint identifier
  - `listing_id` (uuid, foreign key) - Reference to the listing
  - `complainant_id` (uuid, foreign key) - User submitting the complaint
  - `accused_id` (uuid, foreign key) - User being complained about
  - `complaint_type` (text) - Type: 'buyer_backed_out' or 'seller_backed_out'
  - `description` (text) - Detailed description of what happened
  - `status` (text) - Status: 'pending', 'reviewed', 'resolved', 'dismissed'
  - `admin_notes` (text, nullable) - Internal notes from admin review
  - `created_at` (timestamptz) - When complaint was submitted
  - `reviewed_at` (timestamptz, nullable) - When admin reviewed it
  - `reviewed_by` (uuid, nullable) - Admin who reviewed it

  ### `banned_users`
  Tracks users who have been banned from the platform
  - `id` (uuid, primary key) - Unique ban record identifier
  - `user_id` (uuid, foreign key) - Banned user
  - `banned_by` (uuid, foreign key) - Admin who issued the ban
  - `reason` (text) - Reason for the ban
  - `ban_type` (text) - Type: 'temporary' or 'permanent'
  - `banned_at` (timestamptz) - When ban was issued
  - `expires_at` (timestamptz, nullable) - When temporary ban expires
  - `is_active` (boolean) - Whether ban is currently active

  ## Security
  - Enable RLS on all new tables
  - Users can submit complaints about their own deals
  - Users can view their own complaints
  - Only admins can review complaints and issue bans
  - Banned users cannot create new listings or bids

  ## Indexes
  - Index on accused_id for quick lookup of complaints against a user
  - Index on user_id for quick ban status checks
*/

-- Create deal_complaints table
CREATE TABLE IF NOT EXISTS deal_complaints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid REFERENCES listings(id) ON DELETE CASCADE NOT NULL,
  complainant_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  accused_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  complaint_type text NOT NULL CHECK (complaint_type IN ('buyer_backed_out', 'seller_backed_out')),
  description text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  admin_notes text,
  created_at timestamptz DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES auth.users(id),
  CONSTRAINT different_parties CHECK (complainant_id != accused_id)
);

-- Create banned_users table
CREATE TABLE IF NOT EXISTS banned_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  banned_by uuid REFERENCES auth.users(id) NOT NULL,
  reason text NOT NULL,
  ban_type text DEFAULT 'permanent' CHECK (ban_type IN ('temporary', 'permanent')),
  banned_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  is_active boolean DEFAULT true,
  CONSTRAINT valid_expiry CHECK (
    (ban_type = 'permanent' AND expires_at IS NULL) OR
    (ban_type = 'temporary' AND expires_at IS NOT NULL)
  )
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_complaints_accused ON deal_complaints(accused_id);
CREATE INDEX IF NOT EXISTS idx_complaints_listing ON deal_complaints(listing_id);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON deal_complaints(status);
CREATE INDEX IF NOT EXISTS idx_banned_users_user ON banned_users(user_id);
CREATE INDEX IF NOT EXISTS idx_banned_users_active ON banned_users(is_active);

-- Enable RLS
ALTER TABLE deal_complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE banned_users ENABLE ROW LEVEL SECURITY;

-- RLS Policies for deal_complaints

-- Users can submit complaints if they are involved in the listing
CREATE POLICY "Users can submit complaints about their deals"
  ON deal_complaints
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = complainant_id AND
    EXISTS (
      SELECT 1 FROM listings l
      WHERE l.id = listing_id
      AND (
        l.seller_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM bids b
          WHERE b.listing_id = l.id
          AND b.bidder_id = auth.uid()
        )
      )
    )
  );

-- Users can view complaints they submitted or that are about them
CREATE POLICY "Users can view their own complaints"
  ON deal_complaints
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = complainant_id OR
    auth.uid() = accused_id
  );

-- Only service role can update complaints (admin actions)
CREATE POLICY "Only admins can update complaints"
  ON deal_complaints
  FOR UPDATE
  TO authenticated
  USING (false)
  WITH CHECK (false);

-- RLS Policies for banned_users

-- Users can check if they are banned
CREATE POLICY "Users can view their own ban status"
  ON banned_users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Only service role can manage bans (admin actions)
CREATE POLICY "Only admins can create bans"
  ON banned_users
  FOR INSERT
  TO authenticated
  WITH CHECK (false);

CREATE POLICY "Only admins can update bans"
  ON banned_users
  FOR UPDATE
  TO authenticated
  USING (false)
  WITH CHECK (false);

-- Function to check if user is banned
CREATE OR REPLACE FUNCTION is_user_banned(user_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM banned_users
    WHERE user_id = user_uuid
    AND is_active = true
    AND (
      ban_type = 'permanent' OR
      (ban_type = 'temporary' AND expires_at > now())
    )
  );
END;
$$;

-- Add constraint to prevent banned users from creating listings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'check_seller_not_banned'
    AND table_name = 'listings'
  ) THEN
    ALTER TABLE listings ADD CONSTRAINT check_seller_not_banned
    CHECK (NOT is_user_banned(seller_id));
  END IF;
END $$;

-- Add constraint to prevent banned users from bidding
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'check_bidder_not_banned'
    AND table_name = 'bids'
  ) THEN
    ALTER TABLE bids ADD CONSTRAINT check_bidder_not_banned
    CHECK (NOT is_user_banned(bidder_id));
  END IF;
END $$;