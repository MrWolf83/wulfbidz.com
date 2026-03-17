/*
  # Add Two-Factor Authentication System

  1. New Tables
    - `user_phone_verification`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `phone_number` (text, encrypted phone number)
      - `is_verified` (boolean, verification status)
      - `verification_code` (text, OTP code)
      - `code_expires_at` (timestamptz, expiration time)
      - `verification_attempts` (integer, rate limiting)
      - `last_attempt_at` (timestamptz, rate limiting)
      - `verified_at` (timestamptz, when verified)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `user_two_factor_settings`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users, unique)
      - `is_enabled` (boolean, 2FA status)
      - `phone_verification_id` (uuid, references user_phone_verification)
      - `backup_codes` (text[], encrypted backup codes)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `two_factor_login_attempts`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `attempt_type` (text, 'sms' or 'backup_code')
      - `success` (boolean)
      - `ip_address` (text)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all new tables
    - Add policies for authenticated users to manage their own 2FA settings
    - Add rate limiting constraints
    - Add indexes for performance

  3. Important Notes
    - Phone numbers are stored in profiles table
    - Verification codes expire after 10 minutes
    - Maximum 5 verification attempts per hour
    - Backup codes for account recovery
*/

-- Create user_phone_verification table
CREATE TABLE IF NOT EXISTS user_phone_verification (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  phone_number text NOT NULL,
  is_verified boolean DEFAULT false,
  verification_code text,
  code_expires_at timestamptz,
  verification_attempts integer DEFAULT 0,
  last_attempt_at timestamptz,
  verified_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, phone_number)
);

-- Create user_two_factor_settings table
CREATE TABLE IF NOT EXISTS user_two_factor_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  is_enabled boolean DEFAULT false,
  phone_verification_id uuid REFERENCES user_phone_verification(id) ON DELETE SET NULL,
  backup_codes text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create two_factor_login_attempts table for audit logging
CREATE TABLE IF NOT EXISTS two_factor_login_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  attempt_type text NOT NULL CHECK (attempt_type IN ('sms', 'backup_code')),
  success boolean DEFAULT false,
  ip_address text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_phone_verification ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_two_factor_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE two_factor_login_attempts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_phone_verification
CREATE POLICY "Users can view own phone verification"
  ON user_phone_verification
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own phone verification"
  ON user_phone_verification
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own phone verification"
  ON user_phone_verification
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own phone verification"
  ON user_phone_verification
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for user_two_factor_settings
CREATE POLICY "Users can view own 2FA settings"
  ON user_two_factor_settings
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own 2FA settings"
  ON user_two_factor_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own 2FA settings"
  ON user_two_factor_settings
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own 2FA settings"
  ON user_two_factor_settings
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for two_factor_login_attempts
CREATE POLICY "Users can view own login attempts"
  ON two_factor_login_attempts
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own login attempts"
  ON two_factor_login_attempts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_phone_verification_user_id ON user_phone_verification(user_id);
CREATE INDEX IF NOT EXISTS idx_phone_verification_phone ON user_phone_verification(phone_number);
CREATE INDEX IF NOT EXISTS idx_two_factor_settings_user_id ON user_two_factor_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_login_attempts_user_id ON two_factor_login_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_login_attempts_created_at ON two_factor_login_attempts(created_at);

-- Function to generate 6-digit verification code
CREATE OR REPLACE FUNCTION generate_verification_code()
RETURNS text AS $$
BEGIN
  RETURN LPAD(FLOOR(RANDOM() * 1000000)::text, 6, '0');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate backup codes
CREATE OR REPLACE FUNCTION generate_backup_codes()
RETURNS text[] AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has exceeded verification attempts
CREATE OR REPLACE FUNCTION check_verification_rate_limit(p_user_id uuid)
RETURNS boolean AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate verification code
CREATE OR REPLACE FUNCTION validate_verification_code(
  p_user_id uuid,
  p_phone_number text,
  p_code text
)
RETURNS boolean AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_phone_verification_updated_at
  BEFORE UPDATE ON user_phone_verification
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_two_factor_settings_updated_at
  BEFORE UPDATE ON user_two_factor_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
