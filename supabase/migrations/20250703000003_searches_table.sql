-- Create searches table for Perplexity search results
CREATE TABLE searches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    query TEXT NOT NULL,
    perplexity_response JSONB NOT NULL,
    answer_text TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_searches_user_id ON searches(user_id);
CREATE INDEX idx_searches_project_id ON searches(project_id);
CREATE INDEX idx_searches_created_at ON searches(created_at);
CREATE INDEX idx_searches_query ON searches USING gin (to_tsvector('english', query));

-- Enable Row Level Security
ALTER TABLE searches ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own searches" ON searches
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own searches" ON searches
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own searches" ON searches
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own searches" ON searches
    FOR DELETE USING (auth.uid() = user_id);