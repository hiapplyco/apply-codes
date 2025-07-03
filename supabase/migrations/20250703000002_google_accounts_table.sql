-- Create Google accounts table for OAuth integration
CREATE TABLE IF NOT EXISTS google_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    google_id TEXT NOT NULL,
    email TEXT NOT NULL,
    name TEXT NOT NULL,
    picture TEXT,
    access_token TEXT,
    refresh_token TEXT,
    scopes TEXT[] NOT NULL DEFAULT '{}',
    token_expiry TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'needs_reconnection', 'revoked')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_used TIMESTAMPTZ,
    
    -- Constraints
    UNIQUE(user_id, google_id),
    UNIQUE(user_id, email)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_google_accounts_user_id ON google_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_google_accounts_email ON google_accounts(email);
CREATE INDEX IF NOT EXISTS idx_google_accounts_status ON google_accounts(status);
CREATE INDEX IF NOT EXISTS idx_google_accounts_token_expiry ON google_accounts(token_expiry);
CREATE INDEX IF NOT EXISTS idx_google_accounts_last_used ON google_accounts(last_used);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_google_accounts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_google_accounts_updated_at
    BEFORE UPDATE ON google_accounts
    FOR EACH ROW
    EXECUTE FUNCTION update_google_accounts_updated_at();

-- Enable RLS
ALTER TABLE google_accounts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own Google accounts"
    ON google_accounts FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own Google accounts"
    ON google_accounts FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own Google accounts"
    ON google_accounts FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own Google accounts"
    ON google_accounts FOR DELETE
    USING (auth.uid() = user_id);

-- Create function to get active Google account for user
CREATE OR REPLACE FUNCTION get_active_google_account(user_uuid UUID)
RETURNS TABLE (
    id UUID,
    email TEXT,
    name TEXT,
    picture TEXT,
    access_token TEXT,
    refresh_token TEXT,
    scopes TEXT[],
    token_expiry TIMESTAMPTZ,
    last_used TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ga.id,
        ga.email,
        ga.name,
        ga.picture,
        ga.access_token,
        ga.refresh_token,
        ga.scopes,
        ga.token_expiry,
        ga.last_used
    FROM google_accounts ga
    WHERE ga.user_id = user_uuid 
      AND ga.status = 'active'
      AND (ga.token_expiry IS NULL OR ga.token_expiry > NOW())
    ORDER BY ga.last_used DESC NULLS LAST, ga.created_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if user has valid Google Drive access
CREATE OR REPLACE FUNCTION has_google_drive_access(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    has_access BOOLEAN := FALSE;
BEGIN
    SELECT EXISTS(
        SELECT 1 
        FROM google_accounts ga
        WHERE ga.user_id = user_uuid 
          AND ga.status = 'active'
          AND (ga.token_expiry IS NULL OR ga.token_expiry > NOW())
          AND 'https://www.googleapis.com/auth/drive' = ANY(ga.scopes)
    ) INTO has_access;
    
    RETURN has_access;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if user has valid Google Docs access
CREATE OR REPLACE FUNCTION has_google_docs_access(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    has_access BOOLEAN := FALSE;
BEGIN
    SELECT EXISTS(
        SELECT 1 
        FROM google_accounts ga
        WHERE ga.user_id = user_uuid 
          AND ga.status = 'active'
          AND (ga.token_expiry IS NULL OR ga.token_expiry > NOW())
          AND 'https://www.googleapis.com/auth/documents' = ANY(ga.scopes)
    ) INTO has_access;
    
    RETURN has_access;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to cleanup expired tokens
CREATE OR REPLACE FUNCTION cleanup_expired_google_tokens()
RETURNS INTEGER AS $$
DECLARE
    affected_count INTEGER;
BEGIN
    UPDATE google_accounts
    SET status = 'needs_reconnection',
        access_token = NULL,
        updated_at = NOW()
    WHERE token_expiry < NOW() - INTERVAL '1 day'
      AND status = 'active';
    
    GET DIAGNOSTICS affected_count = ROW_COUNT;
    
    RETURN affected_count;
END;
$$ LANGUAGE plpgsql;

-- Create function to update last_used when token is accessed
CREATE OR REPLACE FUNCTION update_google_account_last_used(account_uuid UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE google_accounts
    SET last_used = NOW(),
        updated_at = NOW()
    WHERE id = account_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_active_google_account(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION has_google_drive_access(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION has_google_docs_access(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION update_google_account_last_used(UUID) TO authenticated;

-- Create view for Google account status
CREATE OR REPLACE VIEW google_account_status AS
SELECT 
    ga.id,
    ga.user_id,
    ga.email,
    ga.name,
    ga.picture,
    ga.status,
    ga.scopes,
    ga.token_expiry,
    ga.created_at,
    ga.last_used,
    CASE 
        WHEN ga.token_expiry IS NULL THEN true
        WHEN ga.token_expiry > NOW() THEN true
        ELSE false
    END as is_token_valid,
    CASE 
        WHEN 'https://www.googleapis.com/auth/drive' = ANY(ga.scopes) THEN true
        ELSE false
    END as has_drive_access,
    CASE 
        WHEN 'https://www.googleapis.com/auth/documents' = ANY(ga.scopes) THEN true
        ELSE false
    END as has_docs_access
FROM google_accounts ga;

-- Grant access to the view
GRANT SELECT ON google_account_status TO authenticated;

-- Create RLS policy for the view
CREATE POLICY "Users can view their own Google account status"
    ON google_account_status FOR SELECT
    USING (auth.uid() = user_id);

-- Add comment to table
COMMENT ON TABLE google_accounts IS 'Stores Google OAuth account connections for users with Drive and Docs access';

-- Add comments to important columns
COMMENT ON COLUMN google_accounts.google_id IS 'Google user ID from OAuth';
COMMENT ON COLUMN google_accounts.access_token IS 'OAuth access token for API calls';
COMMENT ON COLUMN google_accounts.refresh_token IS 'OAuth refresh token for token renewal';
COMMENT ON COLUMN google_accounts.scopes IS 'Array of granted OAuth scopes';
COMMENT ON COLUMN google_accounts.token_expiry IS 'When the access token expires';
COMMENT ON COLUMN google_accounts.status IS 'Account status: active, needs_reconnection, or revoked';