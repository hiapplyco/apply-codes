-- Create chat_messages table for storing AI chat history
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    message TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    tool_used TEXT, -- Name of the tool/agent used (e.g., 'boolean_search', 'enrichment', 'compensation')
    tool_input JSONB, -- Input parameters sent to the tool
    tool_output JSONB, -- Raw output from the tool
    created_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}', -- Additional metadata (e.g., model used, token count, latency)
    parent_message_id UUID REFERENCES public.chat_messages(id) ON DELETE SET NULL, -- For threaded conversations
    is_error BOOLEAN DEFAULT FALSE, -- Flag for error messages
    error_details JSONB, -- Store error information if is_error is true
    session_id UUID, -- Group messages by chat session
    search_history_id UUID REFERENCES public.search_history(id) ON DELETE SET NULL, -- Link to related search
    job_id INTEGER REFERENCES public.jobs(id) ON DELETE SET NULL -- Link to related job posting
);

-- Create indexes for performance
CREATE INDEX idx_chat_messages_user_id ON public.chat_messages(user_id);
CREATE INDEX idx_chat_messages_project_id ON public.chat_messages(project_id) WHERE project_id IS NOT NULL;
CREATE INDEX idx_chat_messages_created_at ON public.chat_messages(created_at DESC);
CREATE INDEX idx_chat_messages_session_id ON public.chat_messages(session_id) WHERE session_id IS NOT NULL;
CREATE INDEX idx_chat_messages_role ON public.chat_messages(role);
CREATE INDEX idx_chat_messages_tool_used ON public.chat_messages(tool_used) WHERE tool_used IS NOT NULL;
CREATE INDEX idx_chat_messages_parent_message ON public.chat_messages(parent_message_id) WHERE parent_message_id IS NOT NULL;
CREATE INDEX idx_chat_messages_search_history ON public.chat_messages(search_history_id) WHERE search_history_id IS NOT NULL;
CREATE INDEX idx_chat_messages_job ON public.chat_messages(job_id) WHERE job_id IS NOT NULL;

-- Composite indexes for common query patterns
CREATE INDEX idx_chat_messages_user_session ON public.chat_messages(user_id, session_id, created_at DESC);
CREATE INDEX idx_chat_messages_user_project ON public.chat_messages(user_id, project_id, created_at DESC) WHERE project_id IS NOT NULL;

-- Enable Row Level Security
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for chat_messages
CREATE POLICY "Users can view own chat messages" ON public.chat_messages
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own chat messages" ON public.chat_messages
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own chat messages" ON public.chat_messages
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own chat messages" ON public.chat_messages
    FOR DELETE USING (auth.uid() = user_id);

-- Create chat_sessions table for grouping conversations
CREATE TABLE IF NOT EXISTS public.chat_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    title TEXT,
    summary TEXT, -- AI-generated summary of the conversation
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_message_at TIMESTAMPTZ DEFAULT NOW(),
    message_count INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}', -- Store session-level metadata
    is_archived BOOLEAN DEFAULT FALSE,
    tags TEXT[] DEFAULT '{}'
);

-- Create indexes for chat_sessions
CREATE INDEX idx_chat_sessions_user_id ON public.chat_sessions(user_id);
CREATE INDEX idx_chat_sessions_project_id ON public.chat_sessions(project_id) WHERE project_id IS NOT NULL;
CREATE INDEX idx_chat_sessions_last_message_at ON public.chat_sessions(last_message_at DESC);
CREATE INDEX idx_chat_sessions_is_archived ON public.chat_sessions(is_archived);

-- Enable RLS for chat_sessions
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for chat_sessions
CREATE POLICY "Users can view own chat sessions" ON public.chat_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own chat sessions" ON public.chat_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own chat sessions" ON public.chat_sessions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own chat sessions" ON public.chat_sessions
    FOR DELETE USING (auth.uid() = user_id);

-- Add foreign key constraint to link messages to sessions
ALTER TABLE public.chat_messages 
    ADD CONSTRAINT fk_chat_messages_session 
    FOREIGN KEY (session_id) 
    REFERENCES public.chat_sessions(id) 
    ON DELETE CASCADE;

-- Create function to update session statistics
CREATE OR REPLACE FUNCTION update_chat_session_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.chat_sessions
        SET message_count = message_count + 1,
            last_message_at = NEW.created_at,
            updated_at = NOW()
        WHERE id = NEW.session_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.chat_sessions
        SET message_count = GREATEST(message_count - 1, 0),
            updated_at = NOW()
        WHERE id = OLD.session_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating session statistics
CREATE TRIGGER update_chat_session_stats_trigger
AFTER INSERT OR DELETE ON public.chat_messages
FOR EACH ROW
WHEN (NEW.session_id IS NOT NULL OR OLD.session_id IS NOT NULL)
EXECUTE FUNCTION update_chat_session_stats();

-- Create function to auto-generate session title from first message
CREATE OR REPLACE FUNCTION generate_session_title()
RETURNS TRIGGER AS $$
BEGIN
    -- Only generate title if it's the first message and title is null
    IF NEW.role = 'user' AND NEW.session_id IS NOT NULL THEN
        UPDATE public.chat_sessions
        SET title = CASE 
            WHEN title IS NULL THEN 
                LEFT(NEW.message, 100) || CASE WHEN LENGTH(NEW.message) > 100 THEN '...' ELSE '' END
            ELSE title
        END
        WHERE id = NEW.session_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-generating session titles
CREATE TRIGGER generate_session_title_trigger
AFTER INSERT ON public.chat_messages
FOR EACH ROW
WHEN (NEW.role = 'user' AND NEW.session_id IS NOT NULL)
EXECUTE FUNCTION generate_session_title();

-- Create view for chat messages with session info
CREATE OR REPLACE VIEW public.chat_messages_with_session AS
SELECT 
    cm.*,
    cs.title as session_title,
    cs.summary as session_summary,
    cs.message_count as session_message_count,
    cs.is_archived as session_is_archived
FROM public.chat_messages cm
LEFT JOIN public.chat_sessions cs ON cm.session_id = cs.id;

-- Grant access to the view
GRANT SELECT ON public.chat_messages_with_session TO authenticated;

-- Create function to clean up orphaned sessions (sessions with no messages)
CREATE OR REPLACE FUNCTION cleanup_empty_chat_sessions()
RETURNS void AS $$
BEGIN
    DELETE FROM public.chat_sessions
    WHERE message_count = 0
    AND created_at < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql;

-- Update triggers for updated_at
CREATE TRIGGER update_chat_sessions_updated_at
BEFORE UPDATE ON public.chat_sessions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE public.chat_messages IS 'Stores all AI chat messages between users and the system';
COMMENT ON COLUMN public.chat_messages.tool_used IS 'Identifier for the AI agent/tool used (e.g., boolean_search, enrichment, compensation)';
COMMENT ON COLUMN public.chat_messages.tool_input IS 'JSON object containing the input parameters sent to the tool';
COMMENT ON COLUMN public.chat_messages.tool_output IS 'JSON object containing the raw output from the tool';
COMMENT ON COLUMN public.chat_messages.session_id IS 'Groups messages into chat sessions for conversation threading';
COMMENT ON COLUMN public.chat_messages.parent_message_id IS 'References parent message for threaded conversations';

COMMENT ON TABLE public.chat_sessions IS 'Groups chat messages into sessions/conversations';
COMMENT ON COLUMN public.chat_sessions.summary IS 'AI-generated summary of the conversation for quick reference';
COMMENT ON COLUMN public.chat_sessions.last_message_at IS 'Timestamp of the most recent message in the session';