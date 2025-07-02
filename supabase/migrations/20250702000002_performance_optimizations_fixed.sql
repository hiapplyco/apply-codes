-- Additional Performance Optimizations (FIXED VERSION)
-- Enhances the data structure improvements with advanced indexing and query optimization

-- =====================================================
-- ADVANCED PERFORMANCE INDEXES
-- =====================================================

-- Search-oriented indexes for candidate discovery
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_candidates_search_compound') THEN
        CREATE INDEX idx_candidates_search_compound 
          ON public.saved_candidates(user_id, status, created_at DESC)
          WHERE status IS NOT NULL;
    END IF;
END $$;

-- Project-based filtering
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_project_candidates_performance') THEN
        CREATE INDEX idx_project_candidates_performance 
          ON public.project_candidates(project_id, added_at DESC);
    END IF;
END $$;

-- Search history optimization
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_search_history_performance') THEN
        CREATE INDEX idx_search_history_performance 
          ON public.search_history(user_id, created_at DESC, is_favorite);
    END IF;
END $$;

-- Chat optimization (checking for column existence first)
DO $$
BEGIN
    -- Check if chat_sessions table exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'chat_sessions') THEN
        -- Check for both is_active and updated_at columns
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'chat_sessions' AND column_name = 'is_active') 
           AND EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'chat_sessions' AND column_name = 'updated_at') THEN
            IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_chat_sessions_active') THEN
                CREATE INDEX idx_chat_sessions_active 
                  ON public.chat_sessions(user_id, updated_at DESC)
                  WHERE is_active = true;
            END IF;
        ELSIF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'chat_sessions' AND column_name = 'updated_at') THEN
            -- Create index with updated_at but without is_active filter
            IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_chat_sessions_user_updated') THEN
                CREATE INDEX idx_chat_sessions_user_updated 
                  ON public.chat_sessions(user_id, updated_at DESC);
            END IF;
        ELSIF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'chat_sessions' AND column_name = 'created_at') THEN
            -- Fall back to created_at if updated_at doesn't exist
            IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_chat_sessions_user_created') THEN
                CREATE INDEX idx_chat_sessions_user_created 
                  ON public.chat_sessions(user_id, created_at DESC);
            END IF;
        ELSE
            -- Just index on user_id if no timestamp columns exist
            IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_chat_sessions_user') THEN
                CREATE INDEX idx_chat_sessions_user 
                  ON public.chat_sessions(user_id);
            END IF;
        END IF;
    END IF;
END $$;

-- Chat messages optimization
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'chat_messages') THEN
        IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_chat_messages_session') THEN
            CREATE INDEX idx_chat_messages_session 
              ON public.chat_messages(session_id, created_at ASC);
        END IF;
    END IF;
END $$;

-- Subscription and billing performance (without date predicates for immutability)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'usage_tracking') THEN
        IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_usage_tracking_user_period') THEN
            CREATE INDEX idx_usage_tracking_user_period 
              ON public.usage_tracking(user_id, period_start DESC);
        END IF;
    END IF;
END $$;

-- Agent outputs optimization (checking column existence first)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'agent_outputs') THEN
        -- Check what columns actually exist and create appropriate indexes
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'agent_outputs' AND column_name = 'user_id') 
           AND EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'agent_outputs' AND column_name = 'created_at') THEN
            IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_agent_outputs_user_created') THEN
                CREATE INDEX idx_agent_outputs_user_created 
                  ON public.agent_outputs(user_id, created_at DESC);
            END IF;
        ELSIF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'agent_outputs' AND column_name = 'job_id') 
              AND EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'agent_outputs' AND column_name = 'created_at') THEN
            -- Use job_id instead of user_id if that's what exists
            IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_agent_outputs_job_created') THEN
                CREATE INDEX idx_agent_outputs_job_created 
                  ON public.agent_outputs(job_id, created_at DESC);
            END IF;
        ELSIF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'agent_outputs' AND column_name = 'created_at') THEN
            -- Just index on created_at if no foreign key columns exist
            IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_agent_outputs_created') THEN
                CREATE INDEX idx_agent_outputs_created 
                  ON public.agent_outputs(created_at DESC);
            END IF;
        ELSIF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'agent_outputs' AND column_name = 'id') THEN
            -- Fallback to just indexing the primary key if it exists
            IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_agent_outputs_id') THEN
                CREATE INDEX idx_agent_outputs_id 
                  ON public.agent_outputs(id);
            END IF;
        END IF;
    END IF;
END $$;

-- =====================================================
-- PARTITIONING HELPER FUNCTIONS
-- =====================================================

-- Create function to auto-create partitions (for future use)
CREATE OR REPLACE FUNCTION create_monthly_partition(
  table_name TEXT,
  start_date DATE
) RETURNS VOID AS $$
DECLARE
  partition_name TEXT;
  end_date DATE;
BEGIN
  end_date := start_date + INTERVAL '1 month';
  partition_name := table_name || '_' || to_char(start_date, 'YYYY_MM');
  
  EXECUTE format('CREATE TABLE IF NOT EXISTS %I PARTITION OF %I 
                  FOR VALUES FROM (%L) TO (%L)',
                 partition_name, table_name, start_date, end_date);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- QUERY OPTIMIZATION VIEWS
-- =====================================================

-- View for candidate search with all normalized data
CREATE OR REPLACE VIEW candidate_search_view AS
SELECT 
  sc.id,
  sc.name,
  sc.linkedin_url,
  sc.job_title,
  sc.experience_years,
  sc.seniority_level,
  sc.enrichment_status,
  sc.profile_summary,
  sc.skills,
  sc.work_email,
  sc.personal_emails,
  sc.mobile_phone,
  sc.created_at,
  sc.updated_at,
  sc.user_id,
  
  -- Normalized company data
  c.canonical_name as company_name,
  c.domain as company_domain,
  c.industry as company_industry,
  
  -- Normalized location data
  l.canonical_name as location_name,
  l.city as location_city,
  l.state as location_state,
  l.country as location_country,
  
  -- Search vector for full-text search
  to_tsvector('english', 
    sc.name || ' ' || 
    COALESCE(sc.job_title, '') || ' ' ||
    COALESCE(c.canonical_name, sc.company, '') || ' ' ||
    COALESCE(l.canonical_name, sc.location, '') || ' ' ||
    COALESCE(array_to_string(sc.skills, ' '), '')
  ) as search_vector

FROM public.saved_candidates sc
LEFT JOIN public.companies c ON sc.company_id = c.id
LEFT JOIN public.locations l ON sc.location_id = l.id;

-- Create immutable function for candidate search text (if not already created)
CREATE OR REPLACE FUNCTION candidate_search_text_simple(name TEXT, job_title TEXT, company TEXT, location TEXT, skills_array TEXT[])
RETURNS TEXT
LANGUAGE SQL
IMMUTABLE
AS $$
  SELECT name || ' ' || 
         COALESCE(job_title, '') || ' ' ||
         COALESCE(company, '') || ' ' ||
         COALESCE(location, '') || ' ' ||
         COALESCE(array_to_string(skills_array, ' '), '');
$$;

-- Index on the search view (using immutable function)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_candidate_search_vector') THEN
        CREATE INDEX idx_candidate_search_vector 
          ON public.saved_candidates USING gin(
            to_tsvector('english', candidate_search_text_simple(name, job_title, company, location, skills))
          );
    END IF;
END $$;

-- View for project analytics
CREATE OR REPLACE VIEW project_analytics_view AS
SELECT 
  p.id as project_id,
  p.name as project_name,
  p.user_id,
  p.candidates_count,
  p.created_at,
  
  -- Candidate statistics
  COUNT(DISTINCT pc.candidate_id) as actual_candidate_count,
  COUNT(DISTINCT sc.company_id) as unique_companies,
  COUNT(DISTINCT sc.location_id) as unique_locations,
  
  -- Seniority distribution
  COUNT(DISTINCT sc.id) FILTER (WHERE sc.seniority_level = 'Junior') as junior_count,
  COUNT(DISTINCT sc.id) FILTER (WHERE sc.seniority_level = 'Mid') as mid_count,
  COUNT(DISTINCT sc.id) FILTER (WHERE sc.seniority_level = 'Senior') as senior_count,
  COUNT(DISTINCT sc.id) FILTER (WHERE sc.seniority_level = 'Lead') as lead_count,
  
  -- Experience distribution  
  AVG(sc.experience_years) as avg_experience,
  MIN(sc.experience_years) as min_experience,
  MAX(sc.experience_years) as max_experience,
  
  -- Enrichment status
  COUNT(DISTINCT sc.id) FILTER (WHERE sc.enrichment_status = 'enriched') as enriched_count,
  COUNT(DISTINCT sc.id) FILTER (WHERE sc.work_email IS NOT NULL) as with_email_count

FROM public.projects p
LEFT JOIN public.project_candidates pc ON p.id = pc.project_id
LEFT JOIN public.saved_candidates sc ON pc.candidate_id = sc.id
GROUP BY p.id, p.name, p.user_id, p.candidates_count, p.created_at;

-- =====================================================
-- MATERIALIZED VIEWS FOR HEAVY ANALYTICS
-- =====================================================

-- Materialized view for user statistics (refreshed daily)
CREATE MATERIALIZED VIEW IF NOT EXISTS user_stats_materialized AS
SELECT 
  u.id as user_id,
  COUNT(DISTINCT sc.id) as total_candidates,
  COUNT(DISTINCT p.id) as total_projects,
  COUNT(DISTINCT sh.id) as total_searches,
  COUNT(DISTINCT sc.company_id) as unique_companies_found,
  COUNT(DISTINCT sc.location_id) as unique_locations_found,
  COUNT(DISTINCT sc.id) FILTER (WHERE sc.enrichment_status = 'enriched') as enriched_candidates,
  COUNT(DISTINCT sc.id) FILTER (WHERE sc.work_email IS NOT NULL) as candidates_with_email,
  MAX(sc.created_at) as last_candidate_added,
  MAX(sh.created_at) as last_search_performed
  
FROM auth.users u
LEFT JOIN public.saved_candidates sc ON u.id = sc.user_id
LEFT JOIN public.projects p ON u.id = p.user_id
LEFT JOIN public.search_history sh ON u.id = sh.user_id
GROUP BY u.id;

-- Index for the materialized view
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_user_stats_materialized_user_id') THEN
        CREATE UNIQUE INDEX idx_user_stats_materialized_user_id 
          ON user_stats_materialized(user_id);
    END IF;
END $$;

-- Refresh function for materialized view
CREATE OR REPLACE FUNCTION refresh_user_stats() RETURNS VOID AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY user_stats_materialized;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- QUERY OPTIMIZATION FUNCTIONS
-- =====================================================

-- Function for optimized candidate search with filters
CREATE OR REPLACE FUNCTION search_candidates_optimized(
  p_user_id UUID,
  p_search_text TEXT DEFAULT NULL,
  p_company_ids UUID[] DEFAULT NULL,
  p_location_ids UUID[] DEFAULT NULL,
  p_seniority_levels TEXT[] DEFAULT NULL,
  p_experience_min INTEGER DEFAULT NULL,
  p_experience_max INTEGER DEFAULT NULL,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
) RETURNS TABLE (
  candidate_id BIGINT,
  name TEXT,
  job_title TEXT,
  company_name TEXT,
  location_name TEXT,
  seniority_level TEXT,
  experience_years INTEGER,
  relevance_score REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sc.id as candidate_id,
    sc.name,
    sc.job_title,
    COALESCE(c.canonical_name, sc.company) as company_name,
    COALESCE(l.canonical_name, sc.location) as location_name,
    sc.seniority_level,
    sc.experience_years,
    CASE 
      WHEN p_search_text IS NOT NULL THEN
        ts_rank(
          to_tsvector('english', 
            sc.name || ' ' || 
            COALESCE(sc.job_title, '') || ' ' ||
            COALESCE(c.canonical_name, sc.company, '') || ' ' ||
            COALESCE(array_to_string(sc.skills, ' '), '')
          ),
          plainto_tsquery('english', p_search_text)
        )
      ELSE 1.0
    END as relevance_score
    
  FROM public.saved_candidates sc
  LEFT JOIN public.companies c ON sc.company_id = c.id
  LEFT JOIN public.locations l ON sc.location_id = l.id
  
  WHERE sc.user_id = p_user_id
    AND (p_search_text IS NULL OR 
         to_tsvector('english', 
           sc.name || ' ' || 
           COALESCE(sc.job_title, '') || ' ' ||
           COALESCE(c.canonical_name, sc.company, '') || ' ' ||
           COALESCE(array_to_string(sc.skills, ' '), '')
         ) @@ plainto_tsquery('english', p_search_text))
    AND (p_company_ids IS NULL OR sc.company_id = ANY(p_company_ids))
    AND (p_location_ids IS NULL OR sc.location_id = ANY(p_location_ids))
    AND (p_seniority_levels IS NULL OR sc.seniority_level = ANY(p_seniority_levels))
    AND (p_experience_min IS NULL OR sc.experience_years >= p_experience_min)
    AND (p_experience_max IS NULL OR sc.experience_years <= p_experience_max)
    
  ORDER BY 
    CASE WHEN p_search_text IS NOT NULL THEN relevance_score ELSE 1 END DESC,
    sc.created_at DESC
    
  LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- PERFORMANCE MONITORING
-- =====================================================

-- Function to analyze query performance
CREATE OR REPLACE FUNCTION analyze_query_performance() RETURNS TABLE (
  table_name TEXT,
  query_type TEXT,
  avg_duration_ms NUMERIC,
  call_count BIGINT
) AS $$
BEGIN
  -- This would integrate with pg_stat_statements in production
  -- For now, return basic table statistics
  RETURN QUERY
  SELECT 
    schemaname || '.' || tablename as table_name,
    'SELECT' as query_type,
    0.0 as avg_duration_ms,
    seq_scan + idx_scan as call_count
  FROM pg_stat_user_tables 
  WHERE schemaname = 'public'
  ORDER BY call_count DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get index usage statistics
CREATE OR REPLACE FUNCTION get_index_usage() RETURNS TABLE (
  table_name TEXT,
  index_name TEXT,
  size_mb NUMERIC,
  usage_count BIGINT,
  usage_ratio NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    schemaname || '.' || tablename as table_name,
    indexname as index_name,
    round(pg_relation_size(indexrelid) / 1024.0 / 1024.0, 2) as size_mb,
    idx_scan as usage_count,
    CASE 
      WHEN (seq_scan + idx_scan) > 0 
      THEN round(idx_scan::numeric / (seq_scan + idx_scan), 4) * 100
      ELSE 0 
    END as usage_ratio
  FROM pg_stat_user_indexes 
  WHERE schemaname = 'public'
  ORDER BY usage_count DESC, size_mb DESC;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- AUTOMATED MAINTENANCE
-- =====================================================

-- Function to update table statistics
CREATE OR REPLACE FUNCTION update_table_statistics() RETURNS VOID AS $$
BEGIN
  -- Analyze all tables to update query planner statistics
  ANALYZE public.saved_candidates;
  ANALYZE public.companies;
  ANALYZE public.locations;
  ANALYZE public.projects;
  ANALYZE public.search_history;
  
  -- Analyze chat tables if they exist
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'chat_sessions') THEN
    ANALYZE public.chat_sessions;
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'agent_outputs') THEN
    ANALYZE public.agent_outputs;
  END IF;
  
  -- Refresh materialized views
  PERFORM refresh_user_stats();
  
  -- Log the maintenance
  RAISE NOTICE 'Table statistics updated at %', NOW();
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON VIEW candidate_search_view IS 'Optimized view for candidate search with normalized company and location data';
COMMENT ON VIEW project_analytics_view IS 'Aggregated analytics for project performance and candidate distributions';
COMMENT ON MATERIALIZED VIEW user_stats_materialized IS 'Pre-computed user statistics, refreshed daily for performance';
COMMENT ON FUNCTION search_candidates_optimized IS 'High-performance candidate search with full-text search and filters';
COMMENT ON FUNCTION analyze_query_performance IS 'Monitor and analyze database query performance';
COMMENT ON FUNCTION get_index_usage IS 'Analyze index usage patterns and efficiency';
COMMENT ON FUNCTION update_table_statistics IS 'Automated maintenance function for optimal query planning';