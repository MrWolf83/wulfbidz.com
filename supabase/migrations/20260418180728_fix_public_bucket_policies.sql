/*
  # Fix Public Storage Bucket Policies

  1. Issue
    - Public buckets have broad SELECT policies that allow listing all files
    - This is unnecessary since public buckets allow direct URL access
    - May expose more data than intended

  2. Solution
    - Remove the broad SELECT policies from listing-photos and listing-videos buckets
    - Public buckets don't need SELECT policies for object URL access
    - Files will still be accessible via their public URLs
    - This prevents enumeration of all files in the bucket

  3. Security Improvement
    - Prevents users from listing all files in public buckets
    - Files are still publicly accessible via their URLs
    - Reduces attack surface and data exposure
*/

-- Drop the broad SELECT policies on public buckets
DROP POLICY IF EXISTS "Anyone can view listing photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view listing videos" ON storage.objects;
