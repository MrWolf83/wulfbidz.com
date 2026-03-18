/*
  # Fix Function Search Path Mutability

  1. Security Improvements
    - Set search_path on update_completed_transactions_updated_at function
    - Prevents potential security issues from role-mutable search paths
    - Ensures function always uses the correct schema

  2. Changes
    - Drop trigger first, then function, then recreate both
    - Set function search_path to pg_catalog and public for security

  3. Important Notes
    - Function behavior remains the same
    - Only adds security hardening
*/

-- Drop trigger first
DROP TRIGGER IF EXISTS update_completed_transactions_updated_at_trigger ON completed_transactions;

-- Drop existing function
DROP FUNCTION IF EXISTS update_completed_transactions_updated_at();

-- Recreate function with explicit search_path
CREATE OR REPLACE FUNCTION update_completed_transactions_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Recreate trigger
CREATE TRIGGER update_completed_transactions_updated_at_trigger
  BEFORE UPDATE ON completed_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_completed_transactions_updated_at();