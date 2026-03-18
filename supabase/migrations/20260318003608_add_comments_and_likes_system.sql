/*
  # Add Comments and Likes System

  1. New Tables
    - `comments`
      - `id` (uuid, primary key)
      - `listing_id` (uuid, references listings)
      - `user_id` (uuid, references auth.users)
      - `parent_comment_id` (uuid, optional for replies)
      - `content` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `comment_likes`
      - `id` (uuid, primary key)
      - `comment_id` (uuid, references comments)
      - `user_id` (uuid, references auth.users)
      - `created_at` (timestamptz)
    
    - `listing_likes`
      - `id` (uuid, primary key)
      - `listing_id` (uuid, references listings)
      - `user_id` (uuid, references auth.users)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all new tables
    - Anyone can read comments and likes
    - Only authenticated users can create comments and likes
    - Users can only delete their own comments and likes
    - Add indexes for performance

  3. Views
    - Create view to get bidder count per listing
*/

-- Create comments table
CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_comment_id uuid REFERENCES comments(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create comment_likes table
CREATE TABLE IF NOT EXISTS comment_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id uuid NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(comment_id, user_id)
);

-- Create listing_likes table
CREATE TABLE IF NOT EXISTS listing_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(listing_id, user_id)
);

-- Enable RLS
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_likes ENABLE ROW LEVEL SECURITY;

-- Comments policies
CREATE POLICY "Anyone can view comments"
  ON comments FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Authenticated users can create comments"
  ON comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments"
  ON comments FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
  ON comments FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Comment likes policies
CREATE POLICY "Anyone can view comment likes"
  ON comment_likes FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Authenticated users can like comments"
  ON comment_likes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike comments"
  ON comment_likes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Listing likes policies
CREATE POLICY "Anyone can view listing likes"
  ON listing_likes FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Authenticated users can like listings"
  ON listing_likes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike listings"
  ON listing_likes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_comments_listing_id ON comments(listing_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_comment_likes_comment_id ON comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_user_id ON comment_likes(user_id);

CREATE INDEX IF NOT EXISTS idx_listing_likes_listing_id ON listing_likes(listing_id);
CREATE INDEX IF NOT EXISTS idx_listing_likes_user_id ON listing_likes(user_id);

-- Create view for bidder count
CREATE OR REPLACE VIEW listing_bidder_counts AS
SELECT 
  listing_id,
  COUNT(DISTINCT bidder_id) as bidder_count
FROM bids
WHERE is_retracted = false
GROUP BY listing_id;

-- Grant access to the view
GRANT SELECT ON listing_bidder_counts TO authenticated, anon;

-- Function to update comment updated_at timestamp
CREATE OR REPLACE FUNCTION update_comment_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_comments_updated_at ON comments;
CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION update_comment_updated_at();