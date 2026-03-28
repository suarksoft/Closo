CREATE TABLE IF NOT EXISTS auth_wallet_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT NOT NULL,
  nonce TEXT NOT NULL UNIQUE,
  message TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auth_wallet_challenges_wallet
  ON auth_wallet_challenges (wallet_address, created_at DESC);

CREATE TABLE IF NOT EXISTS seller_credits (
  seller_id UUID PRIMARY KEY REFERENCES users(id),
  balance INTEGER NOT NULL DEFAULT 0 CHECK (balance >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tool_catalog (
  tool_key TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  credit_cost INTEGER NOT NULL CHECK (credit_cost > 0),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS credit_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES users(id),
  entry_type TEXT NOT NULL CHECK (entry_type IN ('purchase', 'consume', 'adjustment')),
  tool_key TEXT,
  credits_delta INTEGER NOT NULL,
  mon_amount NUMERIC(12,4),
  tx_hash TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS referral_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  seller_id UUID NOT NULL REFERENCES users(id),
  business_id UUID NOT NULL REFERENCES users(id),
  product_id UUID NOT NULL REFERENCES products(id),
  click_count INTEGER NOT NULL DEFAULT 0,
  conversion_count INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE sales
  ADD COLUMN IF NOT EXISTS referral_code TEXT,
  ADD COLUMN IF NOT EXISTS customer_wallet TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_sales_referral_code'
  ) THEN
    ALTER TABLE sales
    ADD CONSTRAINT fk_sales_referral_code
    FOREIGN KEY (referral_code) REFERENCES referral_links(code);
  END IF;
END $$;

INSERT INTO tool_catalog (tool_key, display_name, credit_cost)
VALUES
  ('sales_message', 'AI Sales Message', 2),
  ('lead_score', 'Lead Scoring', 1),
  ('startup_plan', 'Startup Sales Plan', 4),
  ('places_search', 'Google Places Prospecting', 3)
ON CONFLICT (tool_key) DO UPDATE
SET
  display_name = EXCLUDED.display_name,
  credit_cost = EXCLUDED.credit_cost,
  updated_at = NOW();
