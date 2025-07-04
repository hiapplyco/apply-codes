-- Create enhanced document processing system with storage triggers

-- First, create a table to track document processing status
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

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_processed_documents_user_id ON public.processed_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_processed_documents_status ON public.processed_documents(processing_status);
CREATE INDEX IF NOT EXISTS idx_processed_documents_created_at ON public.processed_documents(created_at);
CREATE INDEX IF NOT EXISTS idx_processed_documents_storage_path ON public.processed_documents(storage_path);

-- Enable RLS
ALTER TABLE public.processed_documents ENABLE ROW LEVEL SECURITY;

-- Users can only see their own documents
DROP POLICY IF EXISTS "Users can view own processed documents" ON public.processed_documents;
CREATE POLICY "Users can view own processed documents" ON public.processed_documents
    FOR SELECT USING (auth.uid() = user_id);

-- Users can create document records (for their own uploads)
DROP POLICY IF EXISTS "Users can create own processed documents" ON public.processed_documents;
CREATE POLICY "Users can create own processed documents" ON public.processed_documents
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own document records (for status updates)
DROP POLICY IF EXISTS "Users can update own processed documents" ON public.processed_documents;
CREATE POLICY "Users can update own processed documents" ON public.processed_documents
    FOR UPDATE USING (auth.uid() = user_id);

-- Service role can do everything (for Edge Functions)
DROP POLICY IF EXISTS "Service role full access" ON public.processed_documents;
CREATE POLICY "Service role full access" ON public.processed_documents
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_processed_documents_updated_at
    BEFORE UPDATE ON public.processed_documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Function to handle storage object creation
CREATE OR REPLACE FUNCTION handle_document_upload()
RETURNS trigger AS $$
DECLARE
    user_uuid UUID;
    file_extension TEXT;
    supported_types TEXT[] := ARRAY[
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword',
        'text/plain',
        'image/jpeg',
        'image/png',
        'image/jpg'
    ];
BEGIN
    -- Only process files in the docs bucket
    IF NEW.bucket_id != 'docs' THEN
        RETURN NEW;
    END IF;

    -- Extract user ID from the folder structure (assuming path like: user_id/filename)
    user_uuid := (string_to_array(NEW.name, '/'))[1]::UUID;
    
    -- Get file extension
    file_extension := lower(regexp_replace(NEW.name, '.*\.', ''));
    
    -- Only process supported file types
    IF NEW.metadata->>'mimetype' = ANY(supported_types) OR 
       file_extension IN ('pdf', 'docx', 'doc', 'txt', 'jpg', 'jpeg', 'png') THEN
        
        -- Insert record into processed_documents table
        INSERT INTO public.processed_documents (
            user_id,
            storage_path,
            original_filename,
            file_size,
            mime_type,
            processing_status
        ) VALUES (
            user_uuid,
            NEW.name,
            (string_to_array(NEW.name, '/'))[2], -- Extract filename from path
            (NEW.metadata->>'size')::BIGINT,
            COALESCE(NEW.metadata->>'mimetype', 'application/octet-stream'),
            'pending'
        );

        -- Call the Edge Function asynchronously
        PERFORM net.http_post(
            url := current_setting('app.supabase_url') || '/functions/v1/process-document-async',
            headers := jsonb_build_object(
                'Authorization', 'Bearer ' || current_setting('app.supabase_service_key'),
                'Content-Type', 'application/json'
            ),
            body := jsonb_build_object(
                'storage_path', NEW.name,
                'user_id', user_uuid,
                'bucket_id', NEW.bucket_id
            )
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on storage.objects
DROP TRIGGER IF EXISTS on_document_upload ON storage.objects;
CREATE TRIGGER on_document_upload
    AFTER INSERT ON storage.objects
    FOR EACH ROW
    EXECUTE FUNCTION handle_document_upload();

-- Function to get document processing status
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

-- Function to update document processing status (for Edge Functions)
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
        END
    WHERE storage_path = p_storage_path;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RETURN updated_count > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_document_status(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION update_document_status(TEXT, TEXT, TEXT, TEXT) TO service_role;

-- Create a view for easier document querying
CREATE OR REPLACE VIEW user_documents AS
SELECT 
    pd.id,
    pd.storage_path,
    pd.original_filename,
    pd.file_size,
    pd.mime_type,
    pd.processing_status,
    pd.extracted_content,
    pd.error_message,
    pd.created_at,
    pd.updated_at,
    -- Add processing duration
    CASE 
        WHEN pd.processing_completed_at IS NOT NULL AND pd.processing_started_at IS NOT NULL
        THEN EXTRACT(EPOCH FROM (pd.processing_completed_at - pd.processing_started_at))
        ELSE NULL
    END as processing_duration_seconds
FROM public.processed_documents pd
WHERE pd.user_id = auth.uid()
ORDER BY pd.created_at DESC;

GRANT SELECT ON user_documents TO authenticated;