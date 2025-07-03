-- Update subscription table to include proper tier configurations
-- Add function to create subscription with specific tier limits

CREATE OR REPLACE FUNCTION create_subscription_for_tier(
    user_uuid UUID,
    subscription_tier TEXT,
    stripe_subscription_id TEXT DEFAULT NULL,
    stripe_customer_id TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    subscription_id UUID;
BEGIN
    -- Delete existing subscription if any
    DELETE FROM user_subscription_details WHERE user_id = user_uuid;
    
    -- Create new subscription based on tier
    CASE subscription_tier
        WHEN 'free_trial' THEN
            INSERT INTO user_subscription_details (
                user_id, status, tier, trial_start_date, trial_end_date,
                subscription_id, customer_id,
                searches_limit, candidates_enriched_limit, ai_calls_limit,
                video_interviews_limit, projects_limit, team_members_limit
            ) VALUES (
                user_uuid, 'trialing', 'free_trial', NOW(), NOW() + INTERVAL '7 days',
                stripe_subscription_id, stripe_customer_id,
                10, 50, 100, 5, 3, 1
            ) RETURNING id INTO subscription_id;
            
        WHEN 'starter' THEN
            INSERT INTO user_subscription_details (
                user_id, status, tier, current_period_end,
                subscription_id, customer_id,
                searches_limit, candidates_enriched_limit, ai_calls_limit,
                video_interviews_limit, projects_limit, team_members_limit
            ) VALUES (
                user_uuid, 'active', 'starter', NOW() + INTERVAL '1 month',
                stripe_subscription_id, stripe_customer_id,
                100, 200, 500, 10, 10, 3
            ) RETURNING id INTO subscription_id;
            
        WHEN 'professional' THEN
            INSERT INTO user_subscription_details (
                user_id, status, tier, current_period_end,
                subscription_id, customer_id,
                searches_limit, candidates_enriched_limit, ai_calls_limit,
                video_interviews_limit, projects_limit, team_members_limit
            ) VALUES (
                user_uuid, 'active', 'professional', NOW() + INTERVAL '1 month',
                stripe_subscription_id, stripe_customer_id,
                NULL, NULL, NULL, NULL, NULL, 10 -- NULL means unlimited
            ) RETURNING id INTO subscription_id;
            
        WHEN 'enterprise' THEN
            INSERT INTO user_subscription_details (
                user_id, status, tier, current_period_end,
                subscription_id, customer_id,
                searches_limit, candidates_enriched_limit, ai_calls_limit,
                video_interviews_limit, projects_limit, team_members_limit
            ) VALUES (
                user_uuid, 'active', 'enterprise', NOW() + INTERVAL '1 month',
                stripe_subscription_id, stripe_customer_id,
                NULL, NULL, NULL, NULL, NULL, NULL -- All unlimited
            ) RETURNING id INTO subscription_id;
            
        ELSE
            RAISE EXCEPTION 'Invalid subscription tier: %', subscription_tier;
    END CASE;
    
    RETURN subscription_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to upgrade/downgrade subscription
CREATE OR REPLACE FUNCTION change_subscription_tier(
    user_uuid UUID,
    new_tier TEXT,
    stripe_subscription_id TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    current_usage_searches INTEGER;
    current_usage_enriched INTEGER;
    current_usage_ai INTEGER;
    current_usage_videos INTEGER;
BEGIN
    -- Get current usage
    SELECT 
        COALESCE(searches_count, 0),
        COALESCE(candidates_enriched_count, 0),
        COALESCE(ai_calls_count, 0),
        COALESCE(video_interviews_count, 0)
    INTO 
        current_usage_searches,
        current_usage_enriched,
        current_usage_ai,
        current_usage_videos
    FROM user_subscription_details 
    WHERE user_id = user_uuid;
    
    -- Create new subscription with same usage counts
    PERFORM create_subscription_for_tier(user_uuid, new_tier, stripe_subscription_id);
    
    -- Restore usage counts
    UPDATE user_subscription_details SET
        searches_count = current_usage_searches,
        candidates_enriched_count = current_usage_enriched,
        ai_calls_count = current_usage_ai,
        video_interviews_count = current_usage_videos
    WHERE user_id = user_uuid;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reset monthly usage (for cron job)
CREATE OR REPLACE FUNCTION reset_monthly_usage()
RETURNS INTEGER AS $$
DECLARE
    reset_count INTEGER;
BEGIN
    UPDATE user_subscription_details SET
        searches_count = 0,
        candidates_enriched_count = 0,
        ai_calls_count = 0,
        video_interviews_count = 0,
        updated_at = NOW()
    WHERE 
        tier IN ('starter') -- Only reset for plans with monthly limits
        AND status = 'active'
        AND DATE_TRUNC('month', updated_at) < DATE_TRUNC('month', NOW());
    
    GET DIAGNOSTICS reset_count = ROW_COUNT;
    RETURN reset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle trial expiration
CREATE OR REPLACE FUNCTION handle_trial_expiration()
RETURNS INTEGER AS $$
DECLARE
    expired_count INTEGER;
BEGIN
    UPDATE user_subscription_details SET
        status = 'expired',
        updated_at = NOW()
    WHERE 
        status = 'trialing'
        AND trial_end_date < NOW();
    
    GET DIAGNOSTICS expired_count = ROW_COUNT;
    RETURN expired_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the default subscription creation to use the new function
DROP TRIGGER IF EXISTS create_subscription_on_profile_creation ON profiles;
DROP FUNCTION IF EXISTS create_default_subscription();

CREATE OR REPLACE FUNCTION create_default_subscription()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM create_subscription_for_tier(NEW.id, 'free_trial');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER create_subscription_on_profile_creation
    AFTER INSERT ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION create_default_subscription();