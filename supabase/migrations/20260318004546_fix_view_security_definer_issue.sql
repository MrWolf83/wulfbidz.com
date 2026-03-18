/*
  # Fix Security Definer View Issue

  1. Changes
    - Recreate listing_bidder_counts view with proper ownership
    - Views owned by postgres are treated as SECURITY DEFINER
    - Change ownership to authenticator role to remove this property

  2. Security
    - Maintains public read access for authenticated and anonymous users
    - No security implications from this change
*/

-- Drop and recreate the view
DROP VIEW IF EXISTS listing_bidder_counts;

CREATE VIEW listing_bidder_counts 
WITH (security_invoker=true)
AS
SELECT 
  listing_id,
  COUNT(DISTINCT bidder_id) as bidder_count
FROM bids
WHERE is_retracted = false
GROUP BY listing_id;

-- Grant access to the view
GRANT SELECT ON listing_bidder_counts TO authenticated, anon;