-- Create context_items table for storing search context from various sources (safe version)
CREATE TABLE IF NOT EXISTS public.context_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE, -- NULL means saved to user profile
    
    -- Context metadata
    type TEXT NOT NULL CHECK (type IN ('url_scrape', 'file_upload', 'perplexity_search', 'manual_input')),
    title TEXT NOT NULL,
    source_url TEXT, -- Original URL for scrapes and searches
    file_name TEXT, -- Original file name for uploads
    file_type TEXT, -- MIME type for uploads
    
    -- Content data
    content TEXT NOT NULL, -- The actual content/text extracted
    summary TEXT, -- Optional AI-generated summary
    metadata JSONB DEFAULT '{}', -- Additional metadata (file size, scrape success, etc.)
    
    -- Organization
    tags TEXT[] DEFAULT '{}',
    is_favorite BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Search optimization
    search_vector tsvector GENERATED ALWAYS AS (
        setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(content, '')), 'B') ||
        setweight(to_tsvector('english', coalesce(summary, '')), 'C')
    ) STORED
);

-- Create indexes for performance (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_context_items_user_id ON public.context_items(user_id);
CREATE INDEX IF NOT EXISTS idx_context_items_project_id ON public.context_items(project_id);
CREATE INDEX IF NOT EXISTS idx_context_items_type ON public.context_items(type);
CREATE INDEX IF NOT EXISTS idx_context_items_created_at ON public.context_items(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_context_items_search_vector ON public.context_items USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_context_items_user_project ON public.context_items(user_id, project_id);

-- Enable Row Level Security
ALTER TABLE public.context_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (safe version)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'context_items' 
        AND policyname = 'Users can view own context items'
    ) THEN
        CREATE POLICY "Users can view own context items" ON public.context_items
            FOR SELECT USING (auth.uid() = user_id);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'context_items' 
        AND policyname = 'Users can create own context items'
    ) THEN
        CREATE POLICY "Users can create own context items" ON public.context_items
            FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'context_items' 
        AND policyname = 'Users can update own context items'
    ) THEN
        CREATE POLICY "Users can update own context items" ON public.context_items
            FOR UPDATE USING (auth.uid() = user_id);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'context_items' 
        AND policyname = 'Users can delete own context items'
    ) THEN
        CREATE POLICY "Users can delete own context items" ON public.context_items
            FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_context_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_context_items_updated_at_trigger ON public.context_items;
CREATE TRIGGER update_context_items_updated_at_trigger
BEFORE UPDATE ON public.context_items
FOR EACH ROW
EXECUTE FUNCTION update_context_items_updated_at();

-- Create function to get user's context items for boolean search
CREATE OR REPLACE FUNCTION get_user_context_for_search(
    p_user_id UUID,
    p_project_id UUID DEFAULT NULL,
    p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    type TEXT,
    title TEXT,
    content TEXT,
    summary TEXT,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ci.id,
        ci.type,
        ci.title,
        ci.content,
        ci.summary,
        ci.created_at
    FROM public.context_items ci
    WHERE ci.user_id = p_user_id
    AND (
        (p_project_id IS NULL AND ci.project_id IS NULL) OR 
        (ci.project_id = p_project_id)
    )
    ORDER BY ci.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to search context items
CREATE OR REPLACE FUNCTION search_context_items(
    p_user_id UUID,
    p_query TEXT,
    p_project_id UUID DEFAULT NULL,
    p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
    id UUID,
    type TEXT,
    title TEXT,
    content TEXT,
    summary TEXT,
    rank REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ci.id,
        ci.type,
        ci.title,
        ci.content,
        ci.summary,
        ts_rank(ci.search_vector, plainto_tsquery('english', p_query)) as rank
    FROM public.context_items ci
    WHERE ci.user_id = p_user_id
    AND (
        (p_project_id IS NULL AND ci.project_id IS NULL) OR 
        (ci.project_id = p_project_id)
    )
    AND ci.search_vector @@ plainto_tsquery('english', p_query)
    ORDER BY rank DESC, ci.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;