-- Migration: Add credits system for MODEL users
-- Credits allow models to unlock PAID job listings (5 credits/week)

-- Add credits columns to users table
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS credits INTEGER DEFAULT 5,
  ADD COLUMN IF NOT EXISTS last_credit_reset TIMESTAMPTZ DEFAULT NOW();

-- Create unlocked_listings table
CREATE TABLE IF NOT EXISTS unlocked_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  listing_id TEXT NOT NULL,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, listing_id)
);

-- Enable RLS on unlocked_listings
ALTER TABLE unlocked_listings ENABLE ROW LEVEL SECURITY;

-- Users can only see their own unlocked listings
CREATE POLICY "Users can view own unlocked listings"
  ON unlocked_listings FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only unlock listings for themselves
CREATE POLICY "Users can insert own unlocked listings"
  ON unlocked_listings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Function to check and reset credits weekly (called server-side)
CREATE OR REPLACE FUNCTION reset_credits_if_needed(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_last_reset TIMESTAMPTZ;
  v_credits INTEGER;
BEGIN
  SELECT credits, last_credit_reset INTO v_credits, v_last_reset
  FROM users WHERE id = p_user_id;

  IF v_last_reset IS NULL OR NOW() - v_last_reset >= INTERVAL '30 days' THEN
    UPDATE users
    SET credits = 5, last_credit_reset = NOW()
    WHERE id = p_user_id
    RETURNING credits INTO v_credits;
  END IF;

  RETURN v_credits;
END;
$$;

-- Function to unlock a listing (atomically deducts credit and records unlock)
CREATE OR REPLACE FUNCTION unlock_listing(p_user_id UUID, p_listing_id TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_credits INTEGER;
  v_already_unlocked BOOLEAN;
BEGIN
  -- Check if already unlocked
  SELECT EXISTS(
    SELECT 1 FROM unlocked_listings
    WHERE user_id = p_user_id AND listing_id = p_listing_id
  ) INTO v_already_unlocked;

  IF v_already_unlocked THEN
    RETURN TRUE;
  END IF;

  -- Check credits (after potential reset)
  PERFORM reset_credits_if_needed(p_user_id);

  SELECT credits INTO v_credits FROM users WHERE id = p_user_id;

  IF v_credits <= 0 THEN
    RETURN FALSE;
  END IF;

  -- Deduct credit
  UPDATE users SET credits = credits - 1 WHERE id = p_user_id AND credits > 0;

  -- Record unlock
  INSERT INTO unlocked_listings (user_id, listing_id)
  VALUES (p_user_id, p_listing_id)
  ON CONFLICT (user_id, listing_id) DO NOTHING;

  RETURN TRUE;
END;
$$;
