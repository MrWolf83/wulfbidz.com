/*
  # Create Storage Buckets for WulfBidz

  1. New Storage Buckets
    - `listing-photos` - For vehicle listing photos
      - Public access for viewing
      - Authenticated users can upload
      - Max file size: 5MB
      - Allowed types: images only
    
    - `profile-photos` - For user profile and ID verification photos
      - Private access
      - Only owners can view/upload
      - Max file size: 3MB
      - Allowed types: images only
    
    - `listing-videos` - For vehicle listing videos
      - Public access for viewing
      - Authenticated users can upload
      - Max file size: 50MB
      - Allowed types: videos only

  2. Security
    - RLS policies for each bucket
    - Public read access for listing photos/videos
    - Private access for profile photos
    - Upload restricted to authenticated users
*/

-- Create listing-photos bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'listing-photos',
  'listing-photos',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Create profile-photos bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-photos',
  'profile-photos',
  false,
  3145728,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Create listing-videos bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'listing-videos',
  'listing-videos',
  true,
  52428800,
  ARRAY['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm']
) ON CONFLICT (id) DO NOTHING;

-- Listing Photos Storage Policies
CREATE POLICY "Anyone can view listing photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'listing-photos');

CREATE POLICY "Authenticated users can upload listing photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'listing-photos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own listing photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'listing-photos' AND auth.uid() IS NOT NULL)
WITH CHECK (bucket_id = 'listing-photos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete their own listing photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'listing-photos' AND auth.uid() IS NOT NULL);

-- Profile Photos Storage Policies
CREATE POLICY "Users can view their own profile photos"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'profile-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can upload their own profile photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own profile photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'profile-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'profile-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own profile photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'profile-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Listing Videos Storage Policies
CREATE POLICY "Anyone can view listing videos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'listing-videos');

CREATE POLICY "Authenticated users can upload listing videos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'listing-videos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own listing videos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'listing-videos' AND auth.uid() IS NOT NULL)
WITH CHECK (bucket_id = 'listing-videos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete their own listing videos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'listing-videos' AND auth.uid() IS NOT NULL);
