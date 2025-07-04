-- Simple database setup without triggers (run in Supabase Dashboard > SQL Editor)

-- Create processed_documents table (without trigger complications)
CREATE TABLE IF NOT EXISTS public.processed_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL,
    original_filename TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type TEXT NOT NULL,
    processing_status TEXT NOT NULL DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
    extracted_content TEXT,
    error_message TEXT,
    processing_started_at TIMESTAMP WITH TIME ZONE,
    processing_completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_processed_documents_user_id ON public.processed_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_processed_documents_status ON public.processed_documents(processing_status);
CREATE INDEX IF NOT EXISTS idx_processed_documents_created_at ON public.processed_documents(created_at);

-- Enable RLS
ALTER TABLE public.processed_documents ENABLE ROW LEVEL SECURITY;

-- Create simple RLS policies
DROP POLICY IF EXISTS "Users can view own processed documents" ON public.processed_documents;
CREATE POLICY "Users can view own processed documents" ON public.processed_documents
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own processed documents" ON public.processed_documents;
CREATE POLICY "Users can create own processed documents" ON public.processed_documents
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role full access" ON public.processed_documents;
CREATE POLICY "Service role full access" ON public.processed_documents
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Function to get document status
CREATE OR REPLACE FUNCTION get_document_status(p_storage_path TEXT)
RETURNS TABLE (
    id UUID,
    status TEXT,
    extracted_content TEXT,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pd.id,
        pd.processing_status,
        pd.extracted_content,
        pd.error_message,
        pd.created_at,
        pd.updated_at
    FROM public.processed_documents pd
    WHERE pd.storage_path = p_storage_path
    AND pd.user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update document status
CREATE OR REPLACE FUNCTION update_document_status(
    p_storage_path TEXT,
    p_status TEXT,
    p_content TEXT DEFAULT NULL,
    p_error TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    UPDATE public.processed_documents 
    SET 
        processing_status = p_status,
        extracted_content = COALESCE(p_content, extracted_content),
        error_message = COALESCE(p_error, error_message),
        processing_started_at = CASE 
            WHEN p_status = 'processing' AND processing_started_at IS NULL 
            THEN NOW() 
            ELSE processing_started_at 
        END,
        processing_completed_at = CASE 
            WHEN p_status IN ('completed', 'failed') 
            THEN NOW() 
            ELSE processing_completed_at 
        END,
        updated_at = NOW()
    WHERE storage_path = p_storage_path;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_document_status(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION update_document_status(TEXT, TEXT, TEXT, TEXT) TO service_role;

-- Update storage bucket to allow required MIME types
UPDATE storage.buckets 
SET allowed_mime_types = ARRAY[
  'application/pdf',
  'text/plain',
  'image/png',
  'image/jpeg', 
  'image/jpg',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'application/octet-stream',
  'application/zip'
]::text[],
file_size_limit = 20971520  -- 20MB
WHERE id = 'docs';

-- Remove any problematic triggers (if they exist)
DROP TRIGGER IF EXISTS on_document_upload ON storage.objects;

-- Verify setup
SELECT 'processed_documents table created' as status
WHERE EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'processed_documents');

SELECT 'Storage bucket updated' as status, allowed_mime_types, file_size_limit
FROM storage.buckets WHERE id = 'docs';