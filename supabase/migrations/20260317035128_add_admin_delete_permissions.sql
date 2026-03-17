/*
  # Add Admin Delete Permissions for Listings

  ## Summary
  Allows administrators to delete any listing on the platform for moderation purposes.

  ## Changes
  1. **New RLS Policy**
     - Add "Admins can delete any listing" policy on listings table
     - Admins can delete listings regardless of ownership
     - Uses is_user_admin function to check admin status
  
  ## Security
  - Only users with is_admin = true can delete any listing
  - Regular users can still only delete their own listings (existing policy)
  - Admin status is verified through secure is_user_admin function
*/

-- Add admin delete policy for listings
CREATE POLICY "Admins can delete any listing"
  ON listings FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = (SELECT auth.uid()) AND is_admin = true
    )
  );
