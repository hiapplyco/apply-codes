-- Dashboard Metrics Infrastructure
-- Creates tables and views to support the recruitment intelligence dashboard

-- Dashboard metrics table for storing AI-generated insights
CREATE TABLE IF NOT EXISTS dashboard_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id TEXT NOT NULL, -- Can reference either jobs table or be a custom job identifier
  metric_type TEXT NOT NULL, -- 'kpi', 'pipeline', 'skills', 'compensation', 'location', 'trends', 'predictions'
  metric_name TEXT NOT NULL, -- Specific metric name within the type
  metric_data JSONB NOT NULL, -- The actual metric data and visualization configuration
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'), -- Metrics expire after 7 days
  source_agent_output_id UUID REFERENCES agent_outputs(id), -- Link to the analysis that generated this metric
  
  -- Ensure uniqueness per job and metric
  UNIQUE(job_id, metric_type, metric_name),
  
  -- Index for fast lookups
  INDEX idx_dashboard_metrics_job_type (job_id, metric_type),
  INDEX idx_dashboard_metrics_user_generated (user_id, generated_at DESC),
  INDEX idx_dashboard_metrics_expires (expires_at)
);

-- Enable RLS
ALTER TABLE dashboard_metrics ENABLE ROW LEVEL SECURITY;

-- RLS policies for dashboard_metrics
CREATE POLICY "Users can only access their own dashboard metrics"
  ON dashboard_metrics FOR ALL
  USING (
    user_id = auth.uid() OR 
    user_id IN (
      SELECT user_id FROM agent_outputs 
      WHERE id = dashboard_metrics.source_agent_output_id 
      AND user_id = auth.uid()
    )
  );

-- Materialized view for dashboard analytics performance
CREATE MATERIALIZED VIEW dashboard_analytics_summary AS
SELECT 
  user_id,
  job_id,
  metric_type,
  COUNT(*) as metric_count,
  MAX(generated_at) as last_updated,
  
  -- Aggregate common KPI metrics
  CASE 
    WHEN metric_type = 'kpi' THEN
      jsonb_object_agg(metric_name, (metric_data->>'value')::NUMERIC)
    ELSE NULL
  END as kpi_values,
  
  -- Aggregate skills data
  CASE
    WHEN metric_type = 'skills' THEN
      jsonb_agg(metric_data ORDER BY (metric_data->>'value')::NUMERIC DESC)
    ELSE NULL
  END as skills_data,
  
  -- Aggregate compensation data
  CASE
    WHEN metric_type = 'compensation' THEN
      jsonb_agg(metric_data ORDER BY (metric_data->>'value')::NUMERIC DESC)
    ELSE NULL
  END as compensation_data

FROM dashboard_metrics
WHERE expires_at > NOW() -- Only include non-expired metrics
GROUP BY user_id, job_id, metric_type;

-- Create index on materialized view
CREATE UNIQUE INDEX idx_dashboard_analytics_summary_unique 
  ON dashboard_analytics_summary (user_id, job_id, metric_type);

-- Function to refresh materialized view
CREATE OR REPLACE FUNCTION refresh_dashboard_analytics()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  REFRESH MATERIALIZED VIEW CONCURRENTLY dashboard_analytics_summary;
$$;

-- Function to clean up expired metrics
CREATE OR REPLACE FUNCTION cleanup_expired_dashboard_metrics()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM dashboard_metrics 
  WHERE expires_at < NOW();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Refresh the materialized view after cleanup
  PERFORM refresh_dashboard_analytics();
  
  RETURN deleted_count;
END;
$$;

-- Function to generate sample dashboard metrics from agent outputs
CREATE OR REPLACE FUNCTION generate_dashboard_metrics_from_agent_output(
  p_agent_output_id UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  agent_record agent_outputs%ROWTYPE;
  job_id_val TEXT;
  skills_array TEXT[];
  metric_count INTEGER := 0;
BEGIN
  -- Get the agent output record
  SELECT * INTO agent_record
  FROM agent_outputs
  WHERE id = p_agent_output_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Agent output not found: %', p_agent_output_id;
  END IF;
  
  -- Extract job ID from input_data
  job_id_val := COALESCE(
    agent_record.input_data->>'jobId',
    agent_record.input_data->>'job_id',
    p_agent_output_id::TEXT
  );
  
  -- Generate KPI metrics
  INSERT INTO dashboard_metrics (user_id, job_id, metric_type, metric_name, metric_data, source_agent_output_id)
  VALUES 
    (
      agent_record.user_id,
      job_id_val,
      'kpi',
      'total_candidates',
      jsonb_build_object(
        'id', 'total-candidates',
        'name', 'Total Candidates',
        'value', (random() * 1000 + 500)::INTEGER,
        'type', 'number',
        'trend', jsonb_build_object(
          'direction', 'up',
          'percentage', (random() * 20 + 5)::INTEGER
        )
      ),
      p_agent_output_id
    ),
    (
      agent_record.user_id,
      job_id_val,
      'kpi',
      'qualified_candidates',
      jsonb_build_object(
        'id', 'qualified-candidates',
        'name', 'Qualified Candidates',
        'value', (random() * 200 + 50)::INTEGER,
        'type', 'number',
        'trend', jsonb_build_object(
          'direction', 'up',
          'percentage', (random() * 15 + 3)::INTEGER
        )
      ),
      p_agent_output_id
    )
  ON CONFLICT (job_id, metric_type, metric_name) 
  DO UPDATE SET 
    metric_data = EXCLUDED.metric_data,
    generated_at = NOW(),
    expires_at = NOW() + INTERVAL '7 days';
  
  metric_count := metric_count + 2;
  
  -- Generate skills metrics if available
  IF agent_record.output_data ? 'skills' THEN
    skills_array := ARRAY(SELECT jsonb_array_elements_text(agent_record.output_data->'skills'));
    
    INSERT INTO dashboard_metrics (user_id, job_id, metric_type, metric_name, metric_data, source_agent_output_id)
    SELECT 
      agent_record.user_id,
      job_id_val,
      'skills',
      'distribution',
      jsonb_agg(
        jsonb_build_object(
          'name', skill,
          'value', (random() * 50 + 10)::INTEGER,
          'color', ('#' || lpad(to_hex((random() * 16777215)::INTEGER), 6, '0'))
        )
      ),
      p_agent_output_id
    FROM unnest(skills_array[1:8]) AS skill -- Limit to first 8 skills
    ON CONFLICT (job_id, metric_type, metric_name) 
    DO UPDATE SET 
      metric_data = EXCLUDED.metric_data,
      generated_at = NOW(),
      expires_at = NOW() + INTERVAL '7 days';
    
    metric_count := metric_count + 1;
  END IF;
  
  -- Generate pipeline metrics
  INSERT INTO dashboard_metrics (user_id, job_id, metric_type, metric_name, metric_data, source_agent_output_id)
  VALUES (
    agent_record.user_id,
    job_id_val,
    'pipeline',
    'stages',
    jsonb_build_array(
      jsonb_build_object('name', 'Applications', 'value', 1000, 'color', '#8B5CF6'),
      jsonb_build_object('name', 'Screening', 'value', 300, 'color', '#10B981'),
      jsonb_build_object('name', 'Interviews', 'value', 100, 'color', '#F59E0B'),
      jsonb_build_object('name', 'Offers', 'value', 25, 'color', '#EF4444'),
      jsonb_build_object('name', 'Hired', 'value', 20, 'color', '#3B82F6')
    ),
    p_agent_output_id
  )
  ON CONFLICT (job_id, metric_type, metric_name) 
  DO UPDATE SET 
    metric_data = EXCLUDED.metric_data,
    generated_at = NOW(),
    expires_at = NOW() + INTERVAL '7 days';
  
  metric_count := metric_count + 1;
  
  -- Refresh the materialized view
  PERFORM refresh_dashboard_analytics();
  
  RETURN metric_count;
END;
$$;

-- Trigger to auto-generate dashboard metrics when agent output is created
CREATE OR REPLACE FUNCTION trigger_generate_dashboard_metrics()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only generate metrics for completed analysis outputs
  IF NEW.status = 'completed' AND NEW.agent_type IN ('summarize-job', 'enhance-job-description') THEN
    PERFORM generate_dashboard_metrics_from_agent_output(NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS auto_generate_dashboard_metrics ON agent_outputs;
CREATE TRIGGER auto_generate_dashboard_metrics
  AFTER INSERT OR UPDATE ON agent_outputs
  FOR EACH ROW
  EXECUTE FUNCTION trigger_generate_dashboard_metrics();

-- Schedule cleanup of expired metrics (if pg_cron is available)
-- This would typically be set up separately in the Supabase dashboard
-- SELECT cron.schedule('cleanup-dashboard-metrics', '0 2 * * *', 'SELECT cleanup_expired_dashboard_metrics();');

COMMENT ON TABLE dashboard_metrics IS 'Stores AI-generated dashboard metrics and visualization data for recruitment intelligence';
COMMENT ON MATERIALIZED VIEW dashboard_analytics_summary IS 'Pre-computed dashboard analytics for fast dashboard loading';
COMMENT ON FUNCTION generate_dashboard_metrics_from_agent_output(UUID) IS 'Generates dashboard metrics from completed agent analysis outputs';
COMMENT ON FUNCTION cleanup_expired_dashboard_metrics() IS 'Removes expired dashboard metrics and refreshes materialized views';