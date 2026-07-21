-- Migration: Listing quota system for BRAND / PHOTOGRAPHER users
-- 1 annonce gratuite par mois + credits supplementaires achetables

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS listings_posted INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS listings_reset_date TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS listing_credits INTEGER DEFAULT 0;

-- Fonction : reset mensuel + renvoie le quota courant
CREATE OR REPLACE FUNCTION get_listing_quota(p_user_id UUID)
RETURNS TABLE(listings_posted INTEGER, listing_credits INTEGER, listings_reset_date TIMESTAMPTZ)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Reset si 30 jours ecoules
  UPDATE users
  SET listings_posted = 0,
      listings_reset_date = NOW()
  WHERE id = p_user_id
    AND NOW() - listings_reset_date >= INTERVAL '30 days';

  RETURN QUERY
  SELECT u.listings_posted, u.listing_credits, u.listings_reset_date
  FROM users u WHERE u.id = p_user_id;
END;
$$;

-- Fonction : tenter de poster une annonce (verifie la limite, decremente credits)
-- Retourne TRUE si autorise, FALSE si bloque
CREATE OR REPLACE FUNCTION consume_listing_slot(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_posted INTEGER;
  v_credits INTEGER;
  v_reset TIMESTAMPTZ;
BEGIN
  -- Reset mensuel si necessaire
  UPDATE users
  SET listings_posted = 0,
      listings_reset_date = NOW()
  WHERE id = p_user_id
    AND NOW() - listings_reset_date >= INTERVAL '30 days';

  SELECT listings_posted, listing_credits, listings_reset_date
  INTO v_posted, v_credits, v_reset
  FROM users WHERE id = p_user_id;

  -- 1 gratuite + credits achetes
  IF v_posted < (1 + v_credits) THEN
    UPDATE users SET listings_posted = listings_posted + 1 WHERE id = p_user_id;
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$;

-- Fonction : ajouter des credits achetes
CREATE OR REPLACE FUNCTION add_listing_credits(p_user_id UUID, p_amount INTEGER)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE users
  SET listing_credits = listing_credits + p_amount
  WHERE id = p_user_id;
END;
$$;
