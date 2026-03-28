CREATE TABLE IF NOT EXISTS sales_workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES users(id),
  product_id UUID NOT NULL REFERENCES products(id),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (seller_id, product_id)
);

CREATE TABLE IF NOT EXISTS workspace_prospects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES sales_workspaces(id) ON DELETE CASCADE,
  source TEXT NOT NULL DEFAULT 'manual',
  company_name TEXT NOT NULL,
  contact_name TEXT,
  channel_hint TEXT,
  location TEXT,
  website TEXT,
  score INTEGER CHECK (score BETWEEN 0 AND 100),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS workspace_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES sales_workspaces(id) ON DELETE CASCADE,
  asset_type TEXT NOT NULL CHECK (
    asset_type IN ('email_subject', 'email_body', 'wa_message', 'ig_dm', 'call_script', 'objection_reply')
  ),
  content TEXT NOT NULL,
  persona TEXT,
  tone TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS workspace_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES sales_workspaces(id) ON DELETE CASCADE,
  channel TEXT NOT NULL,
  step_no INTEGER NOT NULL CHECK (step_no > 0),
  delay_hours INTEGER NOT NULL DEFAULT 0 CHECK (delay_hours >= 0),
  asset_id UUID REFERENCES workspace_assets(id) ON DELETE SET NULL,
  goal TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS workspace_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES sales_workspaces(id) ON DELETE CASCADE,
  input_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  output_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  credits_spent INTEGER NOT NULL DEFAULT 0 CHECK (credits_spent >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sales_workspaces_seller_product
  ON sales_workspaces (seller_id, product_id);

CREATE INDEX IF NOT EXISTS idx_workspace_prospects_workspace
  ON workspace_prospects (workspace_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_workspace_assets_workspace
  ON workspace_assets (workspace_id, asset_type, version DESC);

CREATE INDEX IF NOT EXISTS idx_workspace_sequences_workspace
  ON workspace_sequences (workspace_id, channel, step_no);

INSERT INTO tool_catalog (tool_key, display_name, credit_cost)
VALUES
  ('workspace_icp', 'Workspace ICP Builder', 3),
  ('workspace_scoring', 'Workspace Scoring Rubric', 2),
  ('workspace_scripts', 'Workspace Script Generator', 4),
  ('workspace_sequences', 'Workspace Sequence Generator', 3),
  ('workspace_asset_regen', 'Workspace Asset Regeneration', 2)
ON CONFLICT (tool_key) DO UPDATE
SET
  display_name = EXCLUDED.display_name,
  credit_cost = EXCLUDED.credit_cost,
  updated_at = NOW();
