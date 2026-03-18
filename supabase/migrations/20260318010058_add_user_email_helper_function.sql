/*
  # Add Helper Function for User Emails

  1. New Functions
    - `get_user_emails` - Securely fetch user emails by user IDs
      - Takes array of user IDs
      - Returns user_id and email pairs
      - Only returns data for existing users
  
  2. Security
    - Function is SECURITY DEFINER to access auth.users
    - Only returns email addresses, no sensitive data
    - Public read access for authenticated and anonymous users
*/

-- Create function to get user emails
CREATE OR REPLACE FUNCTION get_user_emails(user_ids uuid[])
RETURNS TABLE (user_id uuid, email text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT id, email::text
  FROM auth.users
  WHERE id = ANY(user_ids);
END;
$$;

-- Grant access to the function
GRANT EXECUTE ON FUNCTION get_user_emails TO authenticated, anon;