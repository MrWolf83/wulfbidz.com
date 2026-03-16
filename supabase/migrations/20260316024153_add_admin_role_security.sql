/*
  # Add Admin Role Security System

  1. Changes
    - Add `is_admin` boolean column to profiles table
    - Set default to false for all users
    - Add helper function to check admin status
    - Update RLS policies for admin-only operations
    - Add secure admin verification

  2. Security
    - Only admins can access sensitive admin functions
    - RLS policies prevent unauthorized admin operations
    - Admin status cannot be self-assigned by users
*/

-- Add is_admin column to profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'is_admin'
  ) THEN
    ALTER TABLE profiles ADD COLUMN is_admin boolean DEFAULT false;
  END IF;
END $$;

-- Create helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_user_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM profiles WHERE id = user_id),
    false
  );
$$;

-- Add RLS policy to prevent users from making themselves admin
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

CREATE POLICY "Users can update own non-admin fields"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id AND
    -- Prevent users from changing their own admin status
    (is_admin IS NULL OR is_admin = (SELECT is_admin FROM profiles WHERE id = auth.uid()))
  );

-- Only admins can update admin status
CREATE POLICY "Only admins can modify admin status"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (is_user_admin(auth.uid()))
  WITH CHECK (is_user_admin(auth.uid()));

-- Create index for faster admin checks
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON profiles(is_admin) WHERE is_admin = true;

-- Add comment
COMMENT ON COLUMN profiles.is_admin IS 'Indicates if user has administrative privileges';
