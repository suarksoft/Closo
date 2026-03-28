ALTER TABLE sales
  ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS verification_method TEXT,
  ADD COLUMN IF NOT EXISTS verification_reference TEXT,
  ADD COLUMN IF NOT EXISTS verification_note TEXT;

CREATE TABLE IF NOT EXISTS sale_verification_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  actor_id UUID NOT NULL REFERENCES users(id),
  actor_role TEXT NOT NULL CHECK (actor_role IN ('seller', 'business', 'admin')),
  method TEXT,
  reference TEXT,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sale_verification_events_sale
  ON sale_verification_events (sale_id, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS uq_sales_business_product_external_reference
  ON sales (business_id, product_id, external_reference)
  WHERE external_reference IS NOT NULL;
