/*
  # Fix Complaints and Bans Security Issues

  ## Security Improvements

  1. **Prevent Duplicate Complaints**
     - Add unique constraint to prevent users from submitting multiple complaints for the same listing
     - One complaint per user per listing

  2. **Validate Complaint Type Matches Role**
     - Sellers can only report buyers (buyer_backed_out)
     - Buyers can only report sellers (seller_backed_out)
     - Prevent fraudulent complaint types

  3. **Prevent Complaints Against Self**
     - Already handled by different_parties constraint
     - Add additional validation in policy

  4. **Limit Complaint Abuse**
     - Add constraint to ensure only one active complaint per listing per user
     - Prevent spam complaints

  5. **Validate Accused Party**
     - Ensure accused party is actually involved in the deal
     - Buyers can only accuse sellers, sellers can only accuse highest bidders

  6. **Add Anti-Spam Protection**
     - Prevent users from submitting too many complaints in short time
*/

-- Add unique constraint to prevent duplicate complaints per listing per user
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'unique_complaint_per_listing_per_user'
  ) THEN
    ALTER TABLE deal_complaints 
    ADD CONSTRAINT unique_complaint_per_listing_per_user 
    UNIQUE (listing_id, complainant_id);
  END IF;
END $$;

-- Drop existing insert policy
DROP POLICY IF EXISTS "Users can submit complaints about their deals" ON deal_complaints;

-- Create improved insert policy with proper validation
CREATE POLICY "Users can submit complaints about their deals"
  ON deal_complaints
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = complainant_id AND
    complainant_id != accused_id AND
    (
      (
        complaint_type = 'seller_backed_out' AND
        EXISTS (
          SELECT 1 FROM listings l
          WHERE l.id = listing_id
          AND l.seller_id = accused_id
          AND EXISTS (
            SELECT 1 FROM bids b
            WHERE b.listing_id = l.id
            AND b.bidder_id = auth.uid()
          )
        )
      )
      OR
      (
        complaint_type = 'buyer_backed_out' AND
        EXISTS (
          SELECT 1 FROM listings l
          WHERE l.id = listing_id
          AND l.seller_id = auth.uid()
          AND EXISTS (
            SELECT 1 FROM bids b
            WHERE b.listing_id = l.id
            AND b.bidder_id = accused_id
            AND b.amount = (
              SELECT MAX(b2.amount)
              FROM bids b2
              WHERE b2.listing_id = l.id
            )
          )
        )
      )
    )
  );

-- Add function to count recent complaints from a user
CREATE OR REPLACE FUNCTION count_recent_complaints(user_uuid uuid, hours integer DEFAULT 24)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  complaint_count integer;
BEGIN
  SELECT COUNT(*)
  INTO complaint_count
  FROM deal_complaints
  WHERE complainant_id = user_uuid
  AND created_at > now() - (hours || ' hours')::interval;
  
  RETURN complaint_count;
END;
$$;

-- Add check constraint to prevent complaint spam (max 5 complaints per 24 hours)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'check_complaint_rate_limit'
  ) THEN
    ALTER TABLE deal_complaints 
    ADD CONSTRAINT check_complaint_rate_limit 
    CHECK (count_recent_complaints(complainant_id, 24) < 5);
  END IF;
END $$;

-- Add constraint to ensure description has meaningful content
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'check_description_length'
  ) THEN
    ALTER TABLE deal_complaints 
    ADD CONSTRAINT check_description_length 
    CHECK (length(trim(description)) >= 50);
  END IF;
END $$;

-- Add index for rate limiting checks
CREATE INDEX IF NOT EXISTS idx_complaints_complainant_created 
  ON deal_complaints(complainant_id, created_at DESC);

-- Create view for admin complaint management (only accessible via service role)
CREATE OR REPLACE VIEW admin_complaints_view AS
SELECT 
  dc.id,
  dc.listing_id,
  dc.complaint_type,
  dc.description,
  dc.status,
  dc.created_at,
  dc.reviewed_at,
  l.year || ' ' || l.make || ' ' || l.model as listing_title,
  complainant.username as complainant_username,
  complainant.email as complainant_email,
  accused.username as accused_username,
  accused.email as accused_email,
  (SELECT COUNT(*) FROM deal_complaints WHERE accused_id = dc.accused_id) as accused_complaint_count
FROM deal_complaints dc
LEFT JOIN listings l ON dc.listing_id = l.id
LEFT JOIN profiles complainant ON dc.complainant_id = complainant.id
LEFT JOIN profiles accused ON dc.accused_id = accused.id;

-- Grant access to admin view (service role only)
ALTER VIEW admin_complaints_view OWNER TO postgres;
GRANT SELECT ON admin_complaints_view TO service_role;