-- Create projects table for organizing candidates
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    color TEXT DEFAULT '#8B5CF6', -- Default purple color
    icon TEXT DEFAULT 'folder', -- Icon name for UI
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    candidates_count INTEGER DEFAULT 0,
    is_archived BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}',
    CONSTRAINT projects_user_id_name_key UNIQUE(user_id, name)
);

-- Create search_history table
CREATE TABLE IF NOT EXISTS public.search_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    search_query TEXT NOT NULL,
    boolean_query TEXT,
    platform TEXT DEFAULT 'linkedin', -- linkedin, indeed, etc.
    results_count INTEGER DEFAULT 0,
    search_params JSONB DEFAULT '{}', -- Store additional search parameters
    created_at TIMESTAMPTZ DEFAULT NOW(),
    is_favorite BOOLEAN DEFAULT FALSE,
    tags TEXT[] DEFAULT '{}',
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL
);

-- Create project_candidates junction table
CREATE TABLE IF NOT EXISTS public.project_candidates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    candidate_id BIGINT NOT NULL REFERENCES public.saved_candidates(id) ON DELETE CASCADE,
    added_at TIMESTAMPTZ DEFAULT NOW(),
    added_by UUID NOT NULL REFERENCES auth.users(id),
    notes TEXT,
    tags TEXT[] DEFAULT '{}',
    CONSTRAINT project_candidates_unique UNIQUE(project_id, candidate_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON public.projects(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_is_archived ON public.projects(is_archived);

CREATE INDEX IF NOT EXISTS idx_search_history_user_id ON public.search_history(user_id);
CREATE INDEX IF NOT EXISTS idx_search_history_created_at ON public.search_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_search_history_project_id ON public.search_history(project_id);
CREATE INDEX IF NOT EXISTS idx_search_history_is_favorite ON public.search_history(is_favorite);

CREATE INDEX IF NOT EXISTS idx_project_candidates_project_id ON public.project_candidates(project_id);
CREATE INDEX IF NOT EXISTS idx_project_candidates_candidate_id ON public.project_candidates(candidate_id);

-- Enable Row Level Security
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_candidates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for projects
CREATE POLICY "Users can view own projects" ON public.projects
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own projects" ON public.projects
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects" ON public.projects
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects" ON public.projects
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for search_history
CREATE POLICY "Users can view own search history" ON public.search_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own search history" ON public.search_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own search history" ON public.search_history
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own search history" ON public.search_history
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for project_candidates
CREATE POLICY "Users can view project candidates they have access to" ON public.project_candidates
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.projects
            WHERE projects.id = project_candidates.project_id
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can add candidates to their projects" ON public.project_candidates
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.projects
            WHERE projects.id = project_id
            AND projects.user_id = auth.uid()
        )
        AND auth.uid() = added_by
    );

CREATE POLICY "Users can update candidates in their projects" ON public.project_candidates
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.projects
            WHERE projects.id = project_candidates.project_id
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can remove candidates from their projects" ON public.project_candidates
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.projects
            WHERE projects.id = project_candidates.project_id
            AND projects.user_id = auth.uid()
        )
    );

-- Create function to update candidates_count in projects
CREATE OR REPLACE FUNCTION update_project_candidates_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.projects
        SET candidates_count = candidates_count + 1,
            updated_at = NOW()
        WHERE id = NEW.project_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.projects
        SET candidates_count = GREATEST(candidates_count - 1, 0),
            updated_at = NOW()
        WHERE id = OLD.project_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for candidates_count
CREATE TRIGGER update_project_candidates_count_trigger
AFTER INSERT OR DELETE ON public.project_candidates
FOR EACH ROW
EXECUTE FUNCTION update_project_candidates_count();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_projects_updated_at
BEFORE UPDATE ON public.projects
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();