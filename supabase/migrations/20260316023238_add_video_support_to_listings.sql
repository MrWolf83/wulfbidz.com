/*
  # Add Video Support to Listings

  1. Changes
    - Add `video_urls` column to `listings` table to store up to 2 video URLs
    - Videos are optional and stored as a JSON array
    - Each video URL is a data URL or external URL string

  2. Notes
    - Videos are limited to 30 seconds (enforced in frontend)
    - Maximum of 2 videos per listing
    - Videos are part of the gallery presentation
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'listings' AND column_name = 'video_urls'
  ) THEN
    ALTER TABLE listings ADD COLUMN video_urls jsonb DEFAULT '[]'::jsonb;
  END IF;
END $$;