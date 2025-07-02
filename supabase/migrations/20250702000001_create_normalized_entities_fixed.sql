-- Phase 2.1: Create normalized entity tables for data quality improvement (FIXED VERSION)
-- This addresses the canonical entity management outlined in the improvement plan

-- =====================================================
-- COMPANIES TABLE - Canonical company entities
-- =====================================================
CREATE TABLE IF NOT EXISTS public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_name TEXT NOT NULL UNIQUE,
  aliases TEXT[] DEFAULT '{}',
  domain TEXT,
  industry TEXT,
  linkedin_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for companies
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Companies are viewable by authenticated users" ON public.companies;
DROP POLICY IF EXISTS "Companies are editable by authenticated users" ON public.companies;

-- RLS policies for companies (readable by all authenticated users, editable by admins)
CREATE POLICY "Companies are viewable by authenticated users" ON public.companies
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Companies are editable by authenticated users" ON public.companies
  FOR ALL USING (auth.role() = 'authenticated');

-- =====================================================
-- LOCATIONS TABLE - Canonical location entities  
-- =====================================================
CREATE TABLE IF NOT EXISTS public.locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_name TEXT NOT NULL UNIQUE,
  city TEXT NOT NULL,
  state TEXT,
  country TEXT NOT NULL DEFAULT 'United States',
  aliases TEXT[] DEFAULT '{}',
  coordinates POINT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for locations
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Locations are viewable by authenticated users" ON public.locations;
DROP POLICY IF EXISTS "Locations are editable by authenticated users" ON public.locations;

-- RLS policies for locations (readable by all authenticated users, editable by admins)
CREATE POLICY "Locations are viewable by authenticated users" ON public.locations
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Locations are editable by authenticated users" ON public.locations
  FOR ALL USING (auth.role() = 'authenticated');

-- =====================================================
-- ENHANCE SAVED_CANDIDATES TABLE
-- =====================================================
-- Add foreign key references to normalized entities (only if columns don't exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'saved_candidates' AND column_name = 'company_id') THEN
        ALTER TABLE public.saved_candidates ADD COLUMN company_id UUID REFERENCES public.companies(id);
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'saved_candidates' AND column_name = 'location_id') THEN
        ALTER TABLE public.saved_candidates ADD COLUMN location_id UUID REFERENCES public.locations(id);
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'saved_candidates' AND column_name = 'experience_years') THEN
        ALTER TABLE public.saved_candidates ADD COLUMN experience_years INTEGER;
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'saved_candidates' AND column_name = 'seniority_level') THEN
        ALTER TABLE public.saved_candidates ADD COLUMN seniority_level TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'saved_candidates' AND column_name = 'enrichment_status') THEN
        ALTER TABLE public.saved_candidates ADD COLUMN enrichment_status TEXT DEFAULT 'pending';
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'saved_candidates' AND column_name = 'canonical_linkedin_url') THEN
        ALTER TABLE public.saved_candidates ADD COLUMN canonical_linkedin_url TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'saved_candidates' AND column_name = 'last_enrichment') THEN
        ALTER TABLE public.saved_candidates ADD COLUMN last_enrichment TIMESTAMPTZ;
    END IF;
END $$;

-- =====================================================
-- PERFORMANCE INDEXES
-- =====================================================
-- Companies indexes
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_companies_canonical_name') THEN
        CREATE INDEX idx_companies_canonical_name ON public.companies(canonical_name);
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_companies_domain') THEN
        CREATE INDEX idx_companies_domain ON public.companies(domain);
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_companies_industry') THEN
        CREATE INDEX idx_companies_industry ON public.companies(industry);
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_companies_created_at') THEN
        CREATE INDEX idx_companies_created_at ON public.companies(created_at);
    END IF;
END $$;

-- Locations indexes
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_locations_canonical_name') THEN
        CREATE INDEX idx_locations_canonical_name ON public.locations(canonical_name);
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_locations_city') THEN
        CREATE INDEX idx_locations_city ON public.locations(city);
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_locations_state') THEN
        CREATE INDEX idx_locations_state ON public.locations(state);
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_locations_country') THEN
        CREATE INDEX idx_locations_country ON public.locations(country);
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_locations_coordinates') THEN
        CREATE INDEX idx_locations_coordinates ON public.locations USING gist(coordinates);
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_locations_created_at') THEN
        CREATE INDEX idx_locations_created_at ON public.locations(created_at);
    END IF;
END $$;

-- Enhanced saved_candidates indexes
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_candidates_company') THEN
        CREATE INDEX idx_candidates_company ON public.saved_candidates(company_id);
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_candidates_location') THEN
        CREATE INDEX idx_candidates_location ON public.saved_candidates(location_id);
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_candidates_experience') THEN
        CREATE INDEX idx_candidates_experience ON public.saved_candidates(experience_years);
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_candidates_seniority') THEN
        CREATE INDEX idx_candidates_seniority ON public.saved_candidates(seniority_level);
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_candidates_enrichment_status') THEN
        CREATE INDEX idx_candidates_enrichment_status ON public.saved_candidates(enrichment_status);
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_candidates_canonical_linkedin') THEN
        CREATE INDEX idx_candidates_canonical_linkedin ON public.saved_candidates(canonical_linkedin_url);
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_candidates_last_enrichment') THEN
        CREATE INDEX idx_candidates_last_enrichment ON public.saved_candidates(last_enrichment);
    END IF;
END $$;

-- Compound indexes for common query patterns
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_candidates_compound_location_experience') THEN
        CREATE INDEX idx_candidates_compound_location_experience 
          ON public.saved_candidates(location_id, experience_years, seniority_level);
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_candidates_compound_company_seniority') THEN
        CREATE INDEX idx_candidates_compound_company_seniority 
          ON public.saved_candidates(company_id, seniority_level);
    END IF;
END $$;

-- =====================================================
-- IMMUTABLE HELPER FUNCTIONS FOR FULL-TEXT SEARCH
-- =====================================================

-- Create immutable function for companies full-text search
CREATE OR REPLACE FUNCTION companies_search_text(canonical_name TEXT, aliases TEXT[])
RETURNS TEXT
LANGUAGE SQL
IMMUTABLE
AS $$
  SELECT canonical_name || ' ' || COALESCE(array_to_string(aliases, ' '), '');
$$;

-- Create immutable function for locations full-text search
CREATE OR REPLACE FUNCTION locations_search_text(canonical_name TEXT, city TEXT, state TEXT, country TEXT)
RETURNS TEXT
LANGUAGE SQL
IMMUTABLE
AS $$
  SELECT canonical_name || ' ' || city || ' ' || COALESCE(state, '') || ' ' || country;
$$;

-- Create immutable function for candidates full-text search
CREATE OR REPLACE FUNCTION candidates_search_text(name TEXT, job_title TEXT, company TEXT, location TEXT, skills_array TEXT[])
RETURNS TEXT
LANGUAGE SQL
IMMUTABLE
AS $$
  SELECT name || ' ' || 
         COALESCE(job_title, '') || ' ' ||
         COALESCE(company, '') || ' ' ||
         COALESCE(location, '') || ' ' ||
         COALESCE(array_to_string(skills_array, ' '), '');
$$;

-- Full-text search indexes using immutable functions
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_companies_fulltext') THEN
        CREATE INDEX idx_companies_fulltext 
          ON public.companies USING gin(to_tsvector('english', companies_search_text(canonical_name, aliases)));
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_locations_fulltext') THEN
        CREATE INDEX idx_locations_fulltext 
          ON public.locations USING gin(to_tsvector('english', locations_search_text(canonical_name, city, state, country)));
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_indexes WHERE indexname = 'idx_candidates_enhanced_fulltext') THEN
        CREATE INDEX idx_candidates_enhanced_fulltext 
          ON public.saved_candidates USING gin(to_tsvector('english', 
            candidates_search_text(name, job_title, company, location, skills)
          ));
    END IF;
END $$;

-- =====================================================
-- UTILITY FUNCTIONS FOR DATA NORMALIZATION
-- =====================================================

-- Function to find or create a company
CREATE OR REPLACE FUNCTION find_or_create_company(
  company_name TEXT,
  company_domain TEXT DEFAULT NULL,
  company_industry TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  company_id UUID;
  normalized_name TEXT;
BEGIN
  -- Normalize company name (trim, title case)
  normalized_name := TRIM(BOTH FROM company_name);
  normalized_name := INITCAP(normalized_name);
  
  -- Try to find existing company by canonical name or alias
  SELECT id INTO company_id 
  FROM public.companies 
  WHERE canonical_name = normalized_name 
     OR normalized_name = ANY(aliases);
  
  -- If not found, create new company
  IF company_id IS NULL THEN
    INSERT INTO public.companies (canonical_name, domain, industry)
    VALUES (normalized_name, company_domain, company_industry)
    RETURNING id INTO company_id;
  END IF;
  
  RETURN company_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to find or create a location
CREATE OR REPLACE FUNCTION find_or_create_location(
  location_string TEXT
) RETURNS UUID AS $$
DECLARE
  location_id UUID;
  parsed_city TEXT;
  parsed_state TEXT;
  parsed_country TEXT := 'United States';
  canonical_name TEXT;
  location_parts TEXT[];
BEGIN
  -- Normalize and parse location string
  canonical_name := TRIM(BOTH FROM location_string);
  location_parts := string_to_array(canonical_name, ',');
  
  -- Parse city, state, country from location string
  IF array_length(location_parts, 1) >= 1 THEN
    parsed_city := TRIM(BOTH FROM location_parts[1]);
  END IF;
  
  IF array_length(location_parts, 1) >= 2 THEN
    parsed_state := TRIM(BOTH FROM location_parts[2]);
  END IF;
  
  IF array_length(location_parts, 1) >= 3 THEN
    parsed_country := TRIM(BOTH FROM location_parts[3]);
  END IF;
  
  -- Try to find existing location
  SELECT id INTO location_id 
  FROM public.locations 
  WHERE canonical_name = canonical_name 
     OR canonical_name = ANY(aliases);
  
  -- If not found, create new location
  IF location_id IS NULL THEN
    INSERT INTO public.locations (canonical_name, city, state, country)
    VALUES (canonical_name, parsed_city, parsed_state, parsed_country)
    RETURNING id INTO location_id;
  END IF;
  
  RETURN location_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to extract experience years from job title/description
CREATE OR REPLACE FUNCTION extract_experience_years(
  job_title TEXT,
  profile_summary TEXT DEFAULT NULL
) RETURNS INTEGER AS $$
DECLARE
  experience_years INTEGER;
  title_lower TEXT;
  summary_lower TEXT;
BEGIN
  title_lower := LOWER(COALESCE(job_title, ''));
  summary_lower := LOWER(COALESCE(profile_summary, ''));
  
  -- Extract years from patterns like "5+ years", "3-5 years", "10 years experience"
  -- Check job title first
  experience_years := (
    SELECT CAST(substring(title_lower FROM '(\d+)[\+\-\s]*years?') AS INTEGER)
    WHERE title_lower ~ '\d+[\+\-\s]*years?'
    LIMIT 1
  );
  
  -- If not found in title, check summary
  IF experience_years IS NULL AND summary_lower IS NOT NULL THEN
    experience_years := (
      SELECT CAST(substring(summary_lower FROM '(\d+)[\+\-\s]*years?') AS INTEGER)
      WHERE summary_lower ~ '\d+[\+\-\s]*years?'
      LIMIT 1
    );
  END IF;
  
  -- Determine seniority based on common patterns
  IF experience_years IS NULL THEN
    CASE 
      WHEN title_lower LIKE '%senior%' OR title_lower LIKE '%sr%' THEN experience_years := 7;
      WHEN title_lower LIKE '%lead%' OR title_lower LIKE '%principal%' THEN experience_years := 10;
      WHEN title_lower LIKE '%junior%' OR title_lower LIKE '%jr%' THEN experience_years := 2;
      WHEN title_lower LIKE '%intern%' OR title_lower LIKE '%entry%' THEN experience_years := 0;
      WHEN title_lower LIKE '%director%' OR title_lower LIKE '%vp%' THEN experience_years := 12;
      ELSE experience_years := 5; -- Default assumption
    END CASE;
  END IF;
  
  -- Cap at reasonable bounds
  IF experience_years > 30 THEN experience_years := 30; END IF;
  IF experience_years < 0 THEN experience_years := 0; END IF;
  
  RETURN experience_years;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to determine seniority level
CREATE OR REPLACE FUNCTION determine_seniority_level(
  experience_years INTEGER,
  job_title TEXT DEFAULT NULL
) RETURNS TEXT AS $$
DECLARE
  seniority TEXT;
  title_lower TEXT;
BEGIN
  title_lower := LOWER(COALESCE(job_title, ''));
  
  -- Check explicit seniority indicators in title first
  IF title_lower LIKE '%intern%' OR title_lower LIKE '%trainee%' THEN
    seniority := 'Intern';
  ELSIF title_lower LIKE '%entry%' OR title_lower LIKE '%junior%' OR title_lower LIKE '%jr%' THEN
    seniority := 'Junior';
  ELSIF title_lower LIKE '%senior%' OR title_lower LIKE '%sr%' THEN
    seniority := 'Senior';
  ELSIF title_lower LIKE '%lead%' OR title_lower LIKE '%principal%' THEN
    seniority := 'Lead';
  ELSIF title_lower LIKE '%director%' OR title_lower LIKE '%manager%' THEN
    seniority := 'Management';
  ELSIF title_lower LIKE '%vp%' OR title_lower LIKE '%vice president%' OR title_lower LIKE '%executive%' THEN
    seniority := 'Executive';
  ELSE
    -- Fall back to experience-based categorization
    CASE 
      WHEN experience_years <= 1 THEN seniority := 'Entry';
      WHEN experience_years <= 3 THEN seniority := 'Junior';
      WHEN experience_years <= 6 THEN seniority := 'Mid';
      WHEN experience_years <= 10 THEN seniority := 'Senior';
      WHEN experience_years <= 15 THEN seniority := 'Lead';
      ELSE seniority := 'Executive';
    END CASE;
  END IF;
  
  RETURN seniority;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =====================================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- =====================================================

-- Create or replace updated_at function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_companies_updated_at ON public.companies;
DROP TRIGGER IF EXISTS update_locations_updated_at ON public.locations;

-- Update updated_at trigger for companies
CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Update updated_at trigger for locations  
CREATE TRIGGER update_locations_updated_at
  BEFORE UPDATE ON public.locations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- INITIAL DATA SEEDING
-- =====================================================

-- Insert common company domains and aliases
INSERT INTO public.companies (canonical_name, domain, aliases, industry) VALUES
  ('Google', 'google.com', ARRAY['Google Inc', 'Google LLC', 'Alphabet Inc', 'Alphabet'], 'Technology'),
  ('Microsoft', 'microsoft.com', ARRAY['Microsoft Corporation', 'MSFT'], 'Technology'),
  ('Amazon', 'amazon.com', ARRAY['Amazon.com', 'Amazon Inc', 'AWS', 'Amazon Web Services'], 'Technology'),
  ('Apple', 'apple.com', ARRAY['Apple Inc', 'Apple Computer'], 'Technology'),
  ('Meta', 'meta.com', ARRAY['Facebook', 'Meta Platforms', 'Instagram', 'WhatsApp'], 'Technology'),
  ('Netflix', 'netflix.com', ARRAY['Netflix Inc'], 'Entertainment'),
  ('Tesla', 'tesla.com', ARRAY['Tesla Inc', 'Tesla Motors'], 'Automotive'),
  ('Salesforce', 'salesforce.com', ARRAY['Salesforce.com'], 'Technology'),
  ('Oracle', 'oracle.com', ARRAY['Oracle Corporation'], 'Technology'),
  ('Adobe', 'adobe.com', ARRAY['Adobe Inc', 'Adobe Systems'], 'Technology')
ON CONFLICT (canonical_name) DO NOTHING;

-- Insert common locations with proper parsing
INSERT INTO public.locations (canonical_name, city, state, country, aliases) VALUES
  ('San Francisco, CA, United States', 'San Francisco', 'CA', 'United States', ARRAY['San Francisco, California', 'SF', 'San Francisco Bay Area']),
  ('New York, NY, United States', 'New York', 'NY', 'United States', ARRAY['New York City', 'NYC', 'Manhattan']),
  ('Los Angeles, CA, United States', 'Los Angeles', 'CA', 'United States', ARRAY['LA', 'Los Angeles, California']),
  ('Seattle, WA, United States', 'Seattle', 'WA', 'United States', ARRAY['Seattle, Washington']),
  ('Austin, TX, United States', 'Austin', 'TX', 'United States', ARRAY['Austin, Texas']),
  ('Boston, MA, United States', 'Boston', 'MA', 'United States', ARRAY['Boston, Massachusetts']),
  ('Chicago, IL, United States', 'Chicago', 'IL', 'United States', ARRAY['Chicago, Illinois']),
  ('Denver, CO, United States', 'Denver', 'CO', 'United States', ARRAY['Denver, Colorado']),
  ('Atlanta, GA, United States', 'Atlanta', 'GA', 'United States', ARRAY['Atlanta, Georgia']),
  ('Remote', 'Remote', NULL, 'Global', ARRAY['Remote Work', 'Work From Home', 'WFH', 'Distributed'])
ON CONFLICT (canonical_name) DO NOTHING;

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================
COMMENT ON TABLE public.companies IS 'Canonical company entities with normalized names and aliases for data quality';
COMMENT ON TABLE public.locations IS 'Canonical location entities with structured city/state/country data';

COMMENT ON COLUMN public.companies.canonical_name IS 'Primary normalized company name';
COMMENT ON COLUMN public.companies.aliases IS 'Alternative names and variations for this company';
COMMENT ON COLUMN public.companies.domain IS 'Primary company domain for validation';

COMMENT ON COLUMN public.locations.canonical_name IS 'Full normalized location string';
COMMENT ON COLUMN public.locations.aliases IS 'Alternative location formats and abbreviations';
COMMENT ON COLUMN public.locations.coordinates IS 'Geographic coordinates for mapping';

COMMENT ON COLUMN public.saved_candidates.company_id IS 'Reference to normalized company entity';
COMMENT ON COLUMN public.saved_candidates.location_id IS 'Reference to normalized location entity';
COMMENT ON COLUMN public.saved_candidates.experience_years IS 'Extracted years of experience';
COMMENT ON COLUMN public.saved_candidates.seniority_level IS 'Categorized seniority level';
COMMENT ON COLUMN public.saved_candidates.enrichment_status IS 'Status of profile enrichment process';