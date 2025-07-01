-- Create subscription system tables for 21-day trial and Stripe integration

-- Create enum for subscription status
CREATE TYPE subscription_status AS ENUM (
  'trialing',      -- User is in 21-day free trial
  'active',        -- User has active paid subscription
  'past_due',      -- Payment failed but grace period
  'canceled',      -- User canceled but still has access until period end
  'expired'        -- Subscription fully expired
);

-- Create enum for subscription tier
CREATE TYPE subscription_tier AS ENUM (
  'free_trial',    -- 21-day trial
  'starter',       -- Basic tier
  'professional',  -- Mid tier
  'enterprise'     -- Top tier
);

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Stripe fields
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  stripe_price_id TEXT,
  
  -- Subscription details
  status subscription_status NOT NULL DEFAULT 'trialing',
  tier subscription_tier NOT NULL DEFAULT 'free_trial',
  
  -- Trial information
  trial_start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  trial_end_date TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '21 days'),
  
  -- Subscription period
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  
  -- Cancellation
  canceled_at TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one subscription per user
  UNIQUE(user_id)
);

-- Create billing history table
CREATE TABLE IF NOT EXISTS billing_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  
  -- Stripe fields
  stripe_invoice_id TEXT UNIQUE,
  stripe_payment_intent_id TEXT,
  stripe_charge_id TEXT,
  
  -- Payment details
  amount_paid INTEGER NOT NULL, -- Amount in cents
  currency TEXT DEFAULT 'usd',
  description TEXT,
  
  -- Status
  status TEXT NOT NULL, -- paid, pending, failed
  failure_reason TEXT,
  
  -- Dates
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Metadata
  invoice_pdf_url TEXT,
  receipt_url TEXT
);

-- Create usage tracking table for limits
CREATE TABLE IF NOT EXISTS usage_tracking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Usage counters (reset monthly)
  searches_count INTEGER DEFAULT 0,
  candidates_enriched_count INTEGER DEFAULT 0,
  ai_calls_count INTEGER DEFAULT 0,
  video_interviews_count INTEGER DEFAULT 0,
  
  -- Usage period
  period_start TIMESTAMPTZ NOT NULL DEFAULT date_trunc('month', NOW()),
  period_end TIMESTAMPTZ NOT NULL DEFAULT (date_trunc('month', NOW()) + INTERVAL '1 month'),
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique constraint for user and period
  UNIQUE(user_id, period_start)
);

-- Create subscription limits table
CREATE TABLE IF NOT EXISTS subscription_limits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tier subscription_tier NOT NULL UNIQUE,
  
  -- Monthly limits
  searches_limit INTEGER,
  candidates_enriched_limit INTEGER,
  ai_calls_limit INTEGER,
  video_interviews_limit INTEGER,
  projects_limit INTEGER,
  team_members_limit INTEGER,
  
  -- Features
  boolean_search_enabled BOOLEAN DEFAULT TRUE,
  candidate_enrichment_enabled BOOLEAN DEFAULT TRUE,
  ai_chat_enabled BOOLEAN DEFAULT TRUE,
  video_interviews_enabled BOOLEAN DEFAULT TRUE,
  bulk_operations_enabled BOOLEAN DEFAULT FALSE,
  api_access_enabled BOOLEAN DEFAULT FALSE,
  custom_integrations_enabled BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default subscription limits
INSERT INTO subscription_limits (tier, searches_limit, candidates_enriched_limit, ai_calls_limit, video_interviews_limit, projects_limit, team_members_limit, boolean_search_enabled, candidate_enrichment_enabled, ai_chat_enabled, video_interviews_enabled, bulk_operations_enabled, api_access_enabled, custom_integrations_enabled)
VALUES 
  ('free_trial', 100, 50, 500, 10, 3, 1, TRUE, TRUE, TRUE, TRUE, FALSE, FALSE, FALSE),
  ('starter', 500, 200, 2000, 50, 10, 3, TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, FALSE),
  ('professional', 2000, 1000, 10000, 200, 50, 10, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, FALSE),
  ('enterprise', NULL, NULL, NULL, NULL, NULL, NULL, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE);

-- Create function to automatically create subscription on user signup
CREATE OR REPLACE FUNCTION handle_new_user_subscription()
RETURNS TRIGGER AS $$
BEGIN
  -- Create a trial subscription for new user
  INSERT INTO subscriptions (user_id, status, tier)
  VALUES (NEW.id, 'trialing', 'free_trial');
  
  -- Initialize usage tracking for current month
  INSERT INTO usage_tracking (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new user subscription
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user_subscription();

-- Create function to check if user has active subscription
CREATE OR REPLACE FUNCTION has_active_subscription(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM subscriptions
    WHERE user_id = user_uuid
    AND status IN ('trialing', 'active', 'past_due')
    AND (
      (status = 'trialing' AND trial_end_date > NOW()) OR
      (status IN ('active', 'past_due') AND current_period_end > NOW())
    )
  );
END;
$$ LANGUAGE plpgsql;

-- Create function to check usage limits
CREATE OR REPLACE FUNCTION check_usage_limit(
  user_uuid UUID,
  usage_type TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  current_usage INTEGER;
  usage_limit INTEGER;
  user_tier subscription_tier;
BEGIN
  -- Get user's subscription tier
  SELECT tier INTO user_tier
  FROM subscriptions
  WHERE user_id = user_uuid
  AND status IN ('trialing', 'active', 'past_due');
  
  -- Get current usage
  EXECUTE format('SELECT %I FROM usage_tracking WHERE user_id = $1 AND period_start = date_trunc(''month'', NOW())', usage_type || '_count')
  INTO current_usage
  USING user_uuid;
  
  -- Get limit for tier
  EXECUTE format('SELECT %I FROM subscription_limits WHERE tier = $1', usage_type || '_limit')
  INTO usage_limit
  USING user_tier;
  
  -- NULL limit means unlimited
  IF usage_limit IS NULL THEN
    RETURN TRUE;
  END IF;
  
  -- Check if under limit
  RETURN current_usage < usage_limit;
END;
$$ LANGUAGE plpgsql;

-- Create function to increment usage
CREATE OR REPLACE FUNCTION increment_usage(
  user_uuid UUID,
  usage_type TEXT
) RETURNS VOID AS $$
BEGIN
  -- Update or insert usage tracking
  INSERT INTO usage_tracking (user_id)
  VALUES (user_uuid)
  ON CONFLICT (user_id, period_start) DO NOTHING;
  
  -- Increment the usage counter
  EXECUTE format('UPDATE usage_tracking SET %I = %I + 1, updated_at = NOW() WHERE user_id = $1 AND period_start = date_trunc(''month'', NOW())', usage_type || '_count', usage_type || '_count')
  USING user_uuid;
END;
$$ LANGUAGE plpgsql;

-- Create view for user subscription details
CREATE OR REPLACE VIEW user_subscription_details AS
SELECT 
  s.user_id,
  s.status,
  s.tier,
  s.trial_start_date,
  s.trial_end_date,
  s.current_period_end,
  s.canceled_at,
  s.cancel_at_period_end,
  CASE 
    WHEN s.status = 'trialing' THEN s.trial_end_date - NOW()
    WHEN s.status IN ('active', 'past_due') THEN s.current_period_end - NOW()
    ELSE INTERVAL '0'
  END AS time_remaining,
  sl.searches_limit,
  sl.candidates_enriched_limit,
  sl.ai_calls_limit,
  sl.video_interviews_limit,
  sl.projects_limit,
  sl.team_members_limit,
  ut.searches_count,
  ut.candidates_enriched_count,
  ut.ai_calls_count,
  ut.video_interviews_count
FROM subscriptions s
LEFT JOIN subscription_limits sl ON s.tier = sl.tier
LEFT JOIN usage_tracking ut ON s.user_id = ut.user_id 
  AND ut.period_start = date_trunc('month', NOW());

-- Add RLS policies
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;

-- Subscriptions policies
CREATE POLICY "Users can view own subscription" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage subscriptions" ON subscriptions
  FOR ALL USING (auth.role() = 'service_role');

-- Billing history policies  
CREATE POLICY "Users can view own billing history" ON billing_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage billing" ON billing_history
  FOR ALL USING (auth.role() = 'service_role');

-- Usage tracking policies
CREATE POLICY "Users can view own usage" ON usage_tracking
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage usage" ON usage_tracking
  FOR ALL USING (auth.role() = 'service_role');

-- Create indexes for performance
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_stripe_customer_id ON subscriptions(stripe_customer_id);
CREATE INDEX idx_billing_history_user_id ON billing_history(user_id);
CREATE INDEX idx_usage_tracking_user_period ON usage_tracking(user_id, period_start);

-- Add updated_at triggers
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_usage_tracking_updated_at BEFORE UPDATE ON usage_tracking
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscription_limits_updated_at BEFORE UPDATE ON subscription_limits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();