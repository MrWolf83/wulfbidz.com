/*
  # WULFBIDZ Car Auction Platform - Database Schema

  ## Overview
  Complete database schema for a car auction platform with user profiles,
  vehicle listings, bidding system, photo storage, and search alerts.

  ## New Tables
  
  ### profiles
  - `id` (uuid, primary key) - Links to auth.users
  - `username` (text, unique) - Public username
  - `full_name` (text) - User's full name
  - `email` (text) - Contact email
  - `phone` (text) - Phone number
  - `bio` (text) - User biography
  - `city` (text) - City location
  - `state` (text) - State location
  - `photo_url` (text) - Profile photo URL
  - `id_front_url` (text) - Driver's license front photo
  - `id_back_url` (text) - Driver's license back photo
  - `id_verified` (boolean, default false) - ID verification status
  - `created_at` (timestamptz) - Account creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### listings
  - `id` (uuid, primary key) - Listing identifier
  - `seller_id` (uuid) - Foreign key to profiles
  - `title` (text) - Listing title
  - `year` (integer) - Vehicle year
  - `make` (text) - Vehicle make
  - `model` (text) - Vehicle model
  - `trim` (text) - Vehicle trim level
  - `vin` (text) - Vehicle identification number
  - `mileage` (integer) - Odometer reading
  - `transmission` (text) - Transmission type
  - `condition` (text) - Vehicle condition
  - `description` (text) - Detailed description
  - `reserve_price` (decimal) - Minimum sale price
  - `starting_bid` (decimal) - Initial bid amount
  - `current_bid` (decimal) - Current highest bid
  - `buy_now_price` (decimal) - Optional instant purchase price
  - `auction_end` (timestamptz) - Auction end time
  - `location_city` (text) - Vehicle location city
  - `location_state` (text) - Vehicle location state
  - `status` (text, default 'active') - Listing status
  - `created_at` (timestamptz) - Listing creation time

  ### bids
  - `id` (uuid, primary key) - Bid identifier
  - `listing_id` (uuid) - Foreign key to listings
  - `bidder_id` (uuid) - Foreign key to profiles
  - `amount` (decimal) - Bid amount
  - `created_at` (timestamptz) - Bid timestamp

  ### photos
  - `id` (uuid, primary key) - Photo identifier
  - `listing_id` (uuid) - Foreign key to listings
  - `url` (text) - Photo URL
  - `position` (integer, default 0) - Display order
  - `created_at` (timestamptz) - Upload timestamp

  ### search_alerts
  - `id` (uuid, primary key) - Alert identifier
  - `user_id` (uuid) - Foreign key to profiles
  - `name` (text) - Alert name
  - `filters` (jsonb) - Search criteria as JSON
  - `email_notifications` (boolean, default true) - Email notification preference
  - `created_at` (timestamptz) - Alert creation time

  ## Security
  - Enable RLS on all tables
  - Profiles: users can read all, but only update their own
  - Listings: public read, authenticated users can create
  - Bids: public read, authenticated users can create
  - Photos: public read, listing owners can create/delete
  - Search alerts: users can only access their own alerts
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  bio text DEFAULT '',
  city text,
  state text,
  photo_url text,
  id_front_url text,
  id_back_url text,
  id_verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create listings table
CREATE TABLE IF NOT EXISTS listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  year integer NOT NULL,
  make text NOT NULL,
  model text NOT NULL,
  trim text,
  vin text,
  mileage integer NOT NULL,
  transmission text NOT NULL,
  condition text NOT NULL,
  description text NOT NULL,
  reserve_price decimal(10,2),
  starting_bid decimal(10,2) NOT NULL,
  current_bid decimal(10,2) DEFAULT 0,
  buy_now_price decimal(10,2),
  auction_end timestamptz NOT NULL,
  location_city text NOT NULL,
  location_state text NOT NULL,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now()
);

-- Create bids table
CREATE TABLE IF NOT EXISTS bids (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid REFERENCES listings(id) ON DELETE CASCADE NOT NULL,
  bidder_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  amount decimal(10,2) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create photos table
CREATE TABLE IF NOT EXISTS photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid REFERENCES listings(id) ON DELETE CASCADE NOT NULL,
  url text NOT NULL,
  position integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create search_alerts table
CREATE TABLE IF NOT EXISTS search_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  filters jsonb NOT NULL DEFAULT '{}',
  email_notifications boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_alerts ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Profiles are viewable by everyone"
  ON profiles FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Listings policies
CREATE POLICY "Listings are viewable by everyone"
  ON listings FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Authenticated users can create listings"
  ON listings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Sellers can update their own listings"
  ON listings FOR UPDATE
  TO authenticated
  USING (auth.uid() = seller_id)
  WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Sellers can delete their own listings"
  ON listings FOR DELETE
  TO authenticated
  USING (auth.uid() = seller_id);

-- Bids policies
CREATE POLICY "Bids are viewable by everyone"
  ON bids FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Authenticated users can place bids"
  ON bids FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = bidder_id);

-- Photos policies
CREATE POLICY "Photos are viewable by everyone"
  ON photos FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Listing owners can upload photos"
  ON photos FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM listings
      WHERE listings.id = listing_id
      AND listings.seller_id = auth.uid()
    )
  );

CREATE POLICY "Listing owners can delete photos"
  ON photos FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM listings
      WHERE listings.id = listing_id
      AND listings.seller_id = auth.uid()
    )
  );

-- Search alerts policies
CREATE POLICY "Users can view their own search alerts"
  ON search_alerts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own search alerts"
  ON search_alerts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own search alerts"
  ON search_alerts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own search alerts"
  ON search_alerts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_listings_seller ON listings(seller_id);
CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_auction_end ON listings(auction_end);
CREATE INDEX IF NOT EXISTS idx_listings_make_model ON listings(make, model);
CREATE INDEX IF NOT EXISTS idx_bids_listing ON bids(listing_id);
CREATE INDEX IF NOT EXISTS idx_bids_bidder ON bids(bidder_id);
CREATE INDEX IF NOT EXISTS idx_photos_listing ON photos(listing_id);
CREATE INDEX IF NOT EXISTS idx_search_alerts_user ON search_alerts(user_id);