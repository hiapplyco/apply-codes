-- Create user_subscription_details table for subscription system
CREATE TABLE user_subscription_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    subscription_id TEXT, -- Stripe subscription ID
    customer_id TEXT, -- Stripe customer ID
    status TEXT NOT NULL DEFAULT 'trialing', -- trialing, active, past_due, canceled, expired
    tier TEXT NOT NULL DEFAULT 'free_trial', -- free_trial, starter, professional, enterprise
    trial_start_date TIMESTAMPTZ DEFAULT NOW(),
    trial_end_date TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
    current_period_end TIMESTAMPTZ,
    canceled_at TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    
    -- Usage limits
    searches_limit INTEGER,
    candidates_enriched_limit INTEGER,
    ai_calls_limit INTEGER,
    video_interviews_limit INTEGER,
    projects_limit INTEGER,
    team_members_limit INTEGER,
    
    -- Current usage counts
    searches_count INTEGER DEFAULT 0,
    candidates_enriched_count INTEGER DEFAULT 0,
    ai_calls_count INTEGER DEFAULT 0,
    video_interviews_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure one subscription per user
    UNIQUE(user_id)
);

-- Create indexes for better performance
CREATE INDEX idx_user_subscription_details_user_id ON user_subscription_details(user_id);
CREATE INDEX idx_user_subscription_details_subscription_id ON user_subscription_details(subscription_id);
CREATE INDEX idx_user_subscription_details_customer_id ON user_subscription_details(customer_id);
CREATE INDEX idx_user_subscription_details_status ON user_subscription_details(status);
CREATE INDEX idx_user_subscription_details_plan_type ON user_subscription_details(plan_type);

-- Enable Row Level Security
ALTER TABLE user_subscription_details ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own subscription details" ON user_subscription_details
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscription details" ON user_subscription_details
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscription details" ON user_subscription_details
    FOR UPDATE USING (auth.uid() = user_id);

-- Admin policy for service operations (used by edge functions)
CREATE POLICY "Service role can manage all subscription details" ON user_subscription_details
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Function to automatically create free trial subscription for new users
CREATE OR REPLACE FUNCTION create_default_subscription()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_subscription_details (
        user_id,
        status,
        tier,
        trial_start_date,
        trial_end_date,
        searches_limit,
        candidates_enriched_limit,
        ai_calls_limit,
        video_interviews_limit,
        projects_limit,
        team_members_limit
    ) VALUES (
        NEW.id,
        'trialing',
        'free_trial',
        NOW(),
        NOW() + INTERVAL '7 days',
        10, -- 10 searches during trial
        50, -- 50 candidate enrichments
        100, -- 100 AI calls
        5, -- 5 video interviews
        3, -- 3 projects
        1 -- 1 team member (just the user)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create default subscription when profile is created
CREATE TRIGGER create_subscription_on_profile_creation
    AFTER INSERT ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION create_default_subscription();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_subscription_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on changes
CREATE TRIGGER update_user_subscription_details_updated_at
    BEFORE UPDATE ON user_subscription_details
    FOR EACH ROW
    EXECUTE FUNCTION update_user_subscription_updated_at();

-- Create function to check usage limit
CREATE OR REPLACE FUNCTION check_usage_limit(
    user_uuid UUID,
    usage_type TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    current_usage INTEGER;
    usage_limit INTEGER;
BEGIN
    -- Get current usage and limit based on usage type
    CASE usage_type
        WHEN 'searches' THEN
            SELECT searches_count, searches_limit INTO current_usage, usage_limit
            FROM user_subscription_details WHERE user_id = user_uuid;
        WHEN 'candidates_enriched' THEN
            SELECT candidates_enriched_count, candidates_enriched_limit INTO current_usage, usage_limit
            FROM user_subscription_details WHERE user_id = user_uuid;
        WHEN 'ai_calls' THEN
            SELECT ai_calls_count, ai_calls_limit INTO current_usage, usage_limit
            FROM user_subscription_details WHERE user_id = user_uuid;
        WHEN 'video_interviews' THEN
            SELECT video_interviews_count, video_interviews_limit INTO current_usage, usage_limit
            FROM user_subscription_details WHERE user_id = user_uuid;
        ELSE
            RETURN FALSE;
    END CASE;
    
    -- If no limit is set (NULL), allow unlimited usage
    IF usage_limit IS NULL THEN
        RETURN TRUE;
    END IF;
    
    -- Check if current usage is below limit
    RETURN COALESCE(current_usage, 0) < usage_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to increment usage
CREATE OR REPLACE FUNCTION increment_usage(
    user_uuid UUID,
    usage_type TEXT
)
RETURNS VOID AS $$
BEGIN
    -- Increment usage based on type
    CASE usage_type
        WHEN 'searches' THEN
            UPDATE user_subscription_details 
            SET searches_count = COALESCE(searches_count, 0) + 1
            WHERE user_id = user_uuid;
        WHEN 'candidates_enriched' THEN
            UPDATE user_subscription_details 
            SET candidates_enriched_count = COALESCE(candidates_enriched_count, 0) + 1
            WHERE user_id = user_uuid;
        WHEN 'ai_calls' THEN
            UPDATE user_subscription_details 
            SET ai_calls_count = COALESCE(ai_calls_count, 0) + 1
            WHERE user_id = user_uuid;
        WHEN 'video_interviews' THEN
            UPDATE user_subscription_details 
            SET video_interviews_count = COALESCE(video_interviews_count, 0) + 1
            WHERE user_id = user_uuid;
    END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;