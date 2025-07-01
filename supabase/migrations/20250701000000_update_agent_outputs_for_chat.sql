-- Update agent_outputs table to support tool-aware chat assistant
ALTER TABLE public.agent_outputs
ADD COLUMN IF NOT EXISTS agent_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS output_data JSONB,
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS session_id INTEGER REFERENCES public.chat_sessions(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_agent_outputs_agent_type ON public.agent_outputs(agent_type);
CREATE INDEX IF NOT EXISTS idx_agent_outputs_user_id ON public.agent_outputs(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_outputs_session_id ON public.agent_outputs(session_id);
CREATE INDEX IF NOT EXISTS idx_agent_outputs_created_at ON public.agent_outputs(created_at);

-- Add RLS policy for agent_outputs
ALTER TABLE public.agent_outputs ENABLE ROW LEVEL SECURITY;

-- Users can view their own agent outputs
CREATE POLICY "Users can view own agent outputs" ON public.agent_outputs
    FOR SELECT USING (
        auth.uid() = user_id OR 
        auth.uid() = created_by OR
        (project_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM public.projects 
            WHERE projects.id = agent_outputs.project_id 
            AND projects.user_id = auth.uid()
        ))
    );

-- Users can create agent outputs
CREATE POLICY "Users can create agent outputs" ON public.agent_outputs
    FOR INSERT WITH CHECK (
        auth.uid() = user_id OR
        auth.uid() = created_by
    );

-- Create a view for easier querying of chat-related agent outputs
CREATE OR REPLACE VIEW chat_agent_outputs AS
SELECT 
    ao.id,
    ao.agent_type,
    ao.output_data,
    ao.job_id,
    ao.project_id,
    ao.session_id,
    ao.user_id,
    ao.created_at,
    ao.updated_at,
    -- Extract common fields from output_data
    (ao.output_data->>'response')::TEXT as response,
    (ao.output_data->'intent')::JSONB as intent,
    (ao.output_data->'toolCalls')::JSONB as tool_calls,
    (ao.output_data->'metadata')::JSONB as metadata,
    -- Join with related tables
    j.content as job_content,
    j.search_string as job_search_string,
    cs.title as session_title,
    p.name as project_name
FROM public.agent_outputs ao
LEFT JOIN public.jobs j ON ao.job_id = j.id
LEFT JOIN public.chat_sessions cs ON ao.session_id = cs.id
LEFT JOIN public.projects p ON ao.project_id = p.id
WHERE ao.agent_type = 'chat_assistant';

-- Grant access to the view
GRANT SELECT ON chat_agent_outputs TO authenticated;

-- Function to get tool usage statistics
CREATE OR REPLACE FUNCTION get_tool_usage_stats(
    p_user_id UUID DEFAULT NULL,
    p_project_id UUID DEFAULT NULL,
    p_days_back INTEGER DEFAULT 30
)
RETURNS TABLE (
    tool_name TEXT,
    usage_count BIGINT,
    success_count BIGINT,
    failure_count BIGINT,
    avg_confidence NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    WITH tool_data AS (
        SELECT 
            jsonb_array_elements(output_data->'toolCalls') as tool_call,
            (output_data->'intent'->>'confidence')::NUMERIC as confidence
        FROM public.agent_outputs
        WHERE agent_type = 'chat_assistant'
        AND created_at >= NOW() - INTERVAL '1 day' * p_days_back
        AND (p_user_id IS NULL OR user_id = p_user_id)
        AND (p_project_id IS NULL OR project_id = p_project_id)
    )
    SELECT 
        tool_call->>'tool' as tool_name,
        COUNT(*) as usage_count,
        COUNT(*) FILTER (WHERE NOT (tool_call->'result'->>'error') IS NOT NULL) as success_count,
        COUNT(*) FILTER (WHERE (tool_call->'result'->>'error') IS NOT NULL) as failure_count,
        AVG(confidence)::NUMERIC(3,2) as avg_confidence
    FROM tool_data
    GROUP BY tool_call->>'tool'
    ORDER BY usage_count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get chat session summary with tool usage
CREATE OR REPLACE FUNCTION get_chat_session_summary(p_session_id INTEGER)
RETURNS TABLE (
    session_id INTEGER,
    message_count BIGINT,
    tools_used JSONB,
    intents JSONB,
    first_message TIMESTAMP WITH TIME ZONE,
    last_message TIMESTAMP WITH TIME ZONE,
    agent_outputs JSONB
) AS $$
BEGIN
    RETURN QUERY
    WITH session_data AS (
        SELECT 
            cs.id as session_id,
            COUNT(DISTINCT cm.id) as message_count,
            MIN(cm.created_at) as first_message,
            MAX(cm.created_at) as last_message
        FROM public.chat_sessions cs
        LEFT JOIN public.chat_messages cm ON cs.id = cm.session_id
        WHERE cs.id = p_session_id
        GROUP BY cs.id
    ),
    tool_usage AS (
        SELECT 
            session_id,
            jsonb_agg(DISTINCT tool_call->>'tool') as tools_used,
            jsonb_agg(DISTINCT output_data->'intent'->>'intent') as intents,
            jsonb_agg(
                jsonb_build_object(
                    'id', id,
                    'created_at', created_at,
                    'intent', output_data->'intent'->>'intent',
                    'confidence', output_data->'intent'->>'confidence',
                    'tools', output_data->'toolCalls'
                ) ORDER BY created_at
            ) as agent_outputs
        FROM public.agent_outputs,
        LATERAL jsonb_array_elements(CASE 
            WHEN jsonb_typeof(output_data->'toolCalls') = 'array' 
            THEN output_data->'toolCalls' 
            ELSE '[]'::jsonb 
        END) as tool_call
        WHERE session_id = p_session_id
        AND agent_type = 'chat_assistant'
        GROUP BY session_id
    )
    SELECT 
        sd.session_id,
        sd.message_count,
        COALESCE(tu.tools_used, '[]'::jsonb) as tools_used,
        COALESCE(tu.intents, '[]'::jsonb) as intents,
        sd.first_message,
        sd.last_message,
        COALESCE(tu.agent_outputs, '[]'::jsonb) as agent_outputs
    FROM session_data sd
    LEFT JOIN tool_usage tu ON sd.session_id = tu.session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;