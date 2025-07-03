-- SQL to give all users in the application a subscription
-- This creates subscription records for users who don't have one yet

-- IMPORTANT: Run this in Supabase SQL Editor
-- This will give all users a free trial subscription with generous limits

-- Step 1: Check how many users currently don't have subscriptions
SELECT 
    COUNT(*) as users_without_subscriptions
FROM profiles p
LEFT JOIN user_subscription_details usd ON p.id = usd.user_id
WHERE usd.user_id IS NULL;

-- Step 2: Create subscriptions for all users who don't have one
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
    team_members_limit,
    searches_count,
    candidates_enriched_count,
    ai_calls_count,
    video_interviews_count
)
SELECT 
    p.id as user_id,
    'trialing' as status,
    'free_trial' as tier,
    NOW() as trial_start_date,
    NOW() + INTERVAL '30 days' as trial_end_date,  -- 30 day trial instead of 7
    100 as searches_limit,                          -- Generous limits
    500 as candidates_enriched_limit,
    1000 as ai_calls_limit,
    50 as video_interviews_limit,
    10 as projects_limit,
    5 as team_members_limit,
    0 as searches_count,                            -- Reset usage counts
    0 as candidates_enriched_count,
    0 as ai_calls_count,
    0 as video_interviews_count
FROM profiles p
LEFT JOIN user_subscription_details usd ON p.id = usd.user_id
WHERE usd.user_id IS NULL;  -- Only insert for users without subscriptions

-- Step 3: Optionally, update existing subscriptions to have better limits
-- Uncomment the following if you want to upgrade existing users too:

/*
UPDATE user_subscription_details 
SET 
    tier = 'free_trial',
    status = 'trialing',
    trial_end_date = GREATEST(trial_end_date, NOW() + INTERVAL '30 days'),
    searches_limit = GREATEST(COALESCE(searches_limit, 0), 100),
    candidates_enriched_limit = GREATEST(COALESCE(candidates_enriched_limit, 0), 500),
    ai_calls_limit = GREATEST(COALESCE(ai_calls_limit, 0), 1000),
    video_interviews_limit = GREATEST(COALESCE(video_interviews_limit, 0), 50),
    projects_limit = GREATEST(COALESCE(projects_limit, 0), 10),
    team_members_limit = GREATEST(COALESCE(team_members_limit, 0), 5),
    updated_at = NOW()
WHERE tier = 'free_trial' AND status IN ('trialing', 'expired');
*/

-- Step 4: Verify the results
SELECT 
    COUNT(*) as total_users,
    COUNT(usd.user_id) as users_with_subscriptions,
    COUNT(*) - COUNT(usd.user_id) as users_without_subscriptions
FROM profiles p
LEFT JOIN user_subscription_details usd ON p.id = usd.user_id;

-- Step 5: Show subscription distribution
SELECT 
    tier,
    status,
    COUNT(*) as user_count,
    AVG(searches_limit) as avg_search_limit,
    AVG(candidates_enriched_limit) as avg_enrichment_limit
FROM user_subscription_details
GROUP BY tier, status
ORDER BY tier, status;