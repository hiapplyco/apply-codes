-- Simple SQL to create user_subscription_details table
-- Execute this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS user_subscription_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    subscription_id TEXT,
    customer_id TEXT,
    status TEXT NOT NULL DEFAULT 'trialing',
    tier TEXT NOT NULL DEFAULT 'free_trial',
    trial_start_date TIMESTAMPTZ DEFAULT NOW(),
    trial_end_date TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
    current_period_end TIMESTAMPTZ,
    canceled_at TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    searches_limit INTEGER,
    candidates_enriched_limit INTEGER,
    ai_calls_limit INTEGER,
    video_interviews_limit INTEGER,
    projects_limit INTEGER,
    team_members_limit INTEGER,
    searches_count INTEGER DEFAULT 0,
    candidates_enriched_count INTEGER DEFAULT 0,
    ai_calls_count INTEGER DEFAULT 0,
    video_interviews_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_subscription_details_user_id ON user_subscription_details(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscription_details_status ON user_subscription_details(status);

-- Enable RLS
ALTER TABLE user_subscription_details ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policy
CREATE POLICY "Users can access their own subscription details" ON user_subscription_details
    FOR ALL USING (auth.uid() = user_id);

-- Create functions
CREATE OR REPLACE FUNCTION check_usage_limit(user_uuid UUID, usage_type TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    current_usage INTEGER;
    usage_limit INTEGER;
BEGIN
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
    
    IF usage_limit IS NULL THEN
        RETURN TRUE;
    END IF;
    
    RETURN COALESCE(current_usage, 0) < usage_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_usage(user_uuid UUID, usage_type TEXT)
RETURNS VOID AS $$
BEGIN
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