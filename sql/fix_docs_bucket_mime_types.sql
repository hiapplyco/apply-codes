-- Fix docs bucket to allow all required MIME types
-- Run this in Supabase Dashboard > SQL Editor

UPDATE storage.buckets 
SET allowed_mime_types = ARRAY[
  'application/pdf',
  'text/plain',
  'image/png',
  'image/jpeg', 
  'image/jpg',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', -- .docx
  'application/msword', -- .doc
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', -- .xlsx
  'application/vnd.ms-excel', -- .xls
  'application/octet-stream', -- Generic binary (browsers sometimes use this)
  'application/zip', -- Some browsers report .docx as zip
  'application/vnd.ms-word', -- Alternative Word format
  'application/x-pdf', -- Alternative PDF MIME type
  'text/pdf' -- Some systems report PDF as text
]::text[]
WHERE id = 'docs';

-- Also increase the file size limit to 20MB to match our validation
UPDATE storage.buckets 
SET file_size_limit = 20971520  -- 20MB in bytes
WHERE id = 'docs';

-- Verify the update
SELECT id, name, allowed_mime_types, file_size_limit 
FROM storage.buckets 
WHERE id = 'docs';