/*
  # Fix Security and Performance Issues for 2FA System

  1. Performance Optimizations
    - Add missing indexes for foreign keys
    - Optimize RLS policies to use subqueries for auth functions
    - Fix function search paths

  2. Indexes Added
    - `idx_banned_users_banned_by` for banned_users.banned_by
    - `idx_deal_complaints_reviewed_by` for deal_complaints.reviewed_by
    - `idx_two_factor_settings_phone_verification_id` for user_two_factor_settings.phone_verification_id

  3. RLS Policy Optimizations
    - All auth.uid() calls wrapped in subqueries for better performance
    - Applies to user_phone_verification, user_two_factor_settings, two_factor_login_attempts, bids tables

  4. Function Security
    - Fixed search_path for all security definer functions
*/

-- Add missing indexes for foreign keys
CREATE INDEX IF NOT EXISTS idx_banned_users_banned_by 
  ON banned_users(banned_by);

CREATE INDEX IF NOT EXISTS idx_deal_complaints_reviewed_by 
  ON deal_complaints(reviewed_by);

CREATE INDEX IF NOT EXISTS idx_two_factor_settings_phone_verification_id 
  ON user_two_factor_settings(phone_verification_id);

-- Drop existing RLS policies for user_phone_verification and recreate with optimized auth checks
DROP POLICY IF EXISTS "Users can view own phone verification" ON user_phone_verification;
DROP POLICY IF EXISTS "Users can create own phone verification" ON user_phone_verification;
DROP POLICY IF EXISTS "Users can update own phone verification" ON user_phone_verification;
DROP POLICY IF EXISTS "Users can delete own phone verification" ON user_phone_verification;

CREATE POLICY "Users can view own phone verification"
  ON user_phone_verification
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can create own phone verification"
  ON user_phone_verification
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update own phone verification"
  ON user_phone_verification
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete own phone verification"
  ON user_phone_verification
  FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- Drop existing RLS policies for user_two_factor_settings and recreate with optimized auth checks
DROP POLICY IF EXISTS "Users can view own 2FA settings" ON user_two_factor_settings;
DROP POLICY IF EXISTS "Users can create own 2FA settings" ON user_two_factor_settings;
DROP POLICY IF EXISTS "Users can update own 2FA settings" ON user_two_factor_settings;
DROP POLICY IF EXISTS "Users can delete own 2FA settings" ON user_two_factor_settings;

CREATE POLICY "Users can view own 2FA settings"
  ON user_two_factor_settings
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can create own 2FA settings"
  ON user_two_factor_settings
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update own 2FA settings"
  ON user_two_factor_settings
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete own 2FA settings"
  ON user_two_factor_settings
  FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- Drop existing RLS policies for two_factor_login_attempts and recreate with optimized auth checks
DROP POLICY IF EXISTS "Users can view own login attempts" ON two_factor_login_attempts;
DROP POLICY IF EXISTS "Users can create own login attempts" ON two_factor_login_attempts;

CREATE POLICY "Users can view own login attempts"
  ON two_factor_login_attempts
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can create own login attempts"
  ON two_factor_login_attempts
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- Fix the bids policy that was flagged
DROP POLICY IF EXISTS "Users can retract own bids" ON bids;

CREATE POLICY "Users can retract own bids"
  ON bids
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = bidder_id)
  WITH CHECK ((SELECT auth.uid()) = bidder_id);

-- Recreate functions with fixed search_path
CREATE OR REPLACE FUNCTION generate_verification_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN LPAD(FLOOR(RANDOM() * 1000000)::text, 6, '0');
END;
$$;

CREATE OR REPLACE FUNCTION generate_backup_codes()
RETURNS text[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  codes text[];
  i integer;
BEGIN
  codes := ARRAY[]::text[];
  FOR i IN 1..10 LOOP
    codes := array_append(codes, substring(md5(random()::text || clock_timestamp()::text) from 1 for 12));
  END LOOP;
  RETURN codes;
END;
$$;

CREATE OR REPLACE FUNCTION check_verification_rate_limit(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  attempt_count integer;
BEGIN
  SELECT COUNT(*)
  INTO attempt_count
  FROM user_phone_verification
  WHERE user_id = p_user_id
    AND last_attempt_at > now() - interval '1 hour';
  
  RETURN attempt_count < 5;
END;
$$;

CREATE OR REPLACE FUNCTION validate_verification_code(
  p_user_id uuid,
  p_phone_number text,
  p_code text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_record record;
BEGIN
  SELECT * INTO v_record
  FROM user_phone_verification
  WHERE user_id = p_user_id
    AND phone_number = p_phone_number
    AND verification_code = p_code
    AND code_expires_at > now()
    AND is_verified = false;
  
  IF FOUND THEN
    UPDATE user_phone_verification
    SET is_verified = true,
        verified_at = now(),
        updated_at = now()
    WHERE id = v_record.id;
    
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
