-- SAFE SQL to give all users subscriptions - Execute step by step
-- Execute these queries ONE AT A TIME in Supabase SQL Editor

-- =====================================
-- STEP 1: CHECK CURRENT STATE (SAFE)
-- =====================================
-- Run this first to see how many users need subscriptions
SELECT 
    'Current State Analysis' as step,
    COUNT(DISTINCT p.id) as total_users,
    COUNT(DISTINCT usd.user_id) as users_with_subscriptions,
    COUNT(DISTINCT p.id) - COUNT(DISTINCT usd.user_id) as users_needing_subscriptions
FROM profiles p
LEFT JOIN user_subscription_details usd ON p.id = usd.user_id;

-- =====================================
-- STEP 2: PREVIEW WHAT WILL BE CREATED (SAFE)
-- =====================================
-- Run this to see exactly what subscriptions will be created
SELECT 
    'Preview of New Subscriptions' as step,
    p.id as user_id,
    p.full_name,
    p.created_at as user_created_at,
    'trialing' as new_status,
    'free_trial' as new_tier,
    100 as searches_limit,
    500 as candidates_enriched_limit
FROM profiles p
LEFT JOIN user_subscription_details usd ON p.id = usd.user_id
WHERE usd.user_id IS NULL
ORDER BY p.created_at DESC
LIMIT 10;  -- Show first 10 users as preview

-- =====================================
-- STEP 3: CREATE SUBSCRIPTIONS (EXECUTE CAREFULLY)
-- =====================================
-- This actually creates the subscription records
-- Only run this after reviewing Step 1 and 2 results

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
    video_interviews_count,
    created_at,
    updated_at
)
SELECT 
    p.id,
    'trialing',
    'free_trial',
    NOW(),
    NOW() + INTERVAL '30 days',
    100,    -- 100 searches 
    500,    -- 500 enrichments
    1000,   -- 1000 AI calls
    50,     -- 50 video interviews
    10,     -- 10 projects
    5,      -- 5 team members
    0,      -- Reset usage counters
    0,
    0,
    0,
    NOW(),
    NOW()
FROM profiles p
LEFT JOIN user_subscription_details usd ON p.id = usd.user_id
WHERE usd.user_id IS NULL;

-- =====================================
-- STEP 4: VERIFY RESULTS (SAFE)
-- =====================================
-- Run this to confirm everything worked correctly
SELECT 
    'Final Results' as step,
    COUNT(DISTINCT p.id) as total_users,
    COUNT(DISTINCT usd.user_id) as users_with_subscriptions,
    COUNT(DISTINCT p.id) - COUNT(DISTINCT usd.user_id) as users_still_without_subscriptions
FROM profiles p
LEFT JOIN user_subscription_details usd ON p.id = usd.user_id;

-- =====================================
-- STEP 5: SUBSCRIPTION SUMMARY (SAFE)
-- =====================================
-- Run this to see the subscription distribution
SELECT 
    'Subscription Summary' as step,
    tier,
    status,
    COUNT(*) as user_count,
    MIN(trial_end_date) as earliest_trial_end,
    MAX(trial_end_date) as latest_trial_end
FROM user_subscription_details
GROUP BY tier, status
ORDER BY tier, status;