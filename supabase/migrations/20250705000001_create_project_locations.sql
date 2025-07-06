-- Create project_locations table for many-to-many relationship between projects and locations
-- This allows projects to have multiple locations for targeted sourcing

-- =====================================================
-- PROJECT_LOCATIONS TABLE - Many-to-many relationship
-- =====================================================
CREATE TABLE IF NOT EXISTS public.project_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  added_by UUID NOT NULL REFERENCES auth.users(id),
  added_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  is_primary BOOLEAN DEFAULT FALSE,
  UNIQUE(project_id, location_id)
);

-- Enable RLS for project_locations
ALTER TABLE public.project_locations ENABLE ROW LEVEL SECURITY;

-- RLS policies for project_locations (users can only access their own project locations)
CREATE POLICY "Users can view their own project locations" ON public.project_locations
  FOR SELECT USING (
    project_id IN (
      SELECT id FROM public.projects WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their own project locations" ON public.project_locations
  FOR ALL USING (
    project_id IN (
      SELECT id FROM public.projects WHERE user_id = auth.uid()
    )
  );

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_project_locations_project_id ON public.project_locations(project_id);
CREATE INDEX IF NOT EXISTS idx_project_locations_location_id ON public.project_locations(location_id);
CREATE INDEX IF NOT EXISTS idx_project_locations_added_by ON public.project_locations(added_by);
CREATE INDEX IF NOT EXISTS idx_project_locations_added_at ON public.project_locations(added_at);
CREATE INDEX IF NOT EXISTS idx_project_locations_is_primary ON public.project_locations(is_primary);

-- Compound index for common queries
CREATE INDEX IF NOT EXISTS idx_project_locations_compound ON public.project_locations(project_id, added_at DESC);

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to add a location to a project with Google Places data
CREATE OR REPLACE FUNCTION add_location_to_project(
  p_project_id UUID,
  p_formatted_address TEXT,
  p_place_id TEXT DEFAULT NULL,
  p_geometry JSONB DEFAULT NULL,
  p_address_components JSONB DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_is_primary BOOLEAN DEFAULT FALSE
) RETURNS UUID AS $$
DECLARE
  location_id UUID;
  project_location_id UUID;
  normalized_location TEXT;
  parsed_city TEXT;
  parsed_state TEXT;
  parsed_country TEXT := 'United States';
  address_parts JSONB;
  component JSONB;
BEGIN
  -- Parse address components if provided
  IF p_address_components IS NOT NULL THEN
    FOR component IN SELECT jsonb_array_elements(p_address_components)
    LOOP
      IF component->'types' ? 'locality' THEN
        parsed_city := component->>'long_name';
      ELSIF component->'types' ? 'administrative_area_level_1' THEN
        parsed_state := component->>'short_name';
      ELSIF component->'types' ? 'country' THEN
        parsed_country := component->>'long_name';
      END IF;
    END LOOP;
  END IF;

  -- Use formatted address as canonical name, fallback to parsed components
  normalized_location := COALESCE(p_formatted_address, parsed_city || ', ' || parsed_state || ', ' || parsed_country);
  
  -- Find or create location using the existing function
  SELECT find_or_create_location(normalized_location) INTO location_id;
  
  -- Update location with Google Places data if provided
  IF p_place_id IS NOT NULL OR p_geometry IS NOT NULL THEN
    UPDATE public.locations 
    SET 
      canonical_name = COALESCE(p_formatted_address, canonical_name),
      city = COALESCE(parsed_city, city),
      state = COALESCE(parsed_state, state),
      country = COALESCE(parsed_country, country),
      coordinates = CASE 
        WHEN p_geometry IS NOT NULL AND p_geometry->'location' IS NOT NULL THEN
          POINT(
            (p_geometry->'location'->>'lng')::FLOAT,
            (p_geometry->'location'->>'lat')::FLOAT
          )
        ELSE coordinates
      END,
      updated_at = NOW()
    WHERE id = location_id;
  END IF;

  -- Add location to project (or update if exists)
  INSERT INTO public.project_locations (project_id, location_id, added_by, notes, is_primary)
  VALUES (p_project_id, location_id, auth.uid(), p_notes, p_is_primary)
  ON CONFLICT (project_id, location_id) 
  DO UPDATE SET 
    notes = COALESCE(EXCLUDED.notes, project_locations.notes),
    is_primary = EXCLUDED.is_primary,
    added_at = NOW()
  RETURNING id INTO project_location_id;

  -- If this is marked as primary, unmark other primary locations for this project
  IF p_is_primary THEN
    UPDATE public.project_locations 
    SET is_primary = FALSE 
    WHERE project_id = p_project_id AND id != project_location_id;
  END IF;

  RETURN project_location_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get project locations with details
CREATE OR REPLACE FUNCTION get_project_locations(p_project_id UUID)
RETURNS TABLE(
  project_location_id UUID,
  location_id UUID,
  canonical_name TEXT,
  city TEXT,
  state TEXT,
  country TEXT,
  coordinates POINT,
  added_at TIMESTAMPTZ,
  notes TEXT,
  is_primary BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pl.id,
    l.id,
    l.canonical_name,
    l.city,
    l.state,
    l.country,
    l.coordinates,
    pl.added_at,
    pl.notes,
    pl.is_primary
  FROM public.project_locations pl
  JOIN public.locations l ON pl.location_id = l.id
  WHERE pl.project_id = p_project_id
  ORDER BY pl.is_primary DESC, pl.added_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to remove location from project
CREATE OR REPLACE FUNCTION remove_location_from_project(
  p_project_id UUID,
  p_location_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.project_locations 
  WHERE project_id = p_project_id AND location_id = p_location_id
    AND project_id IN (
      SELECT id FROM public.projects WHERE user_id = auth.uid()
    );
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================
COMMENT ON TABLE public.project_locations IS 'Many-to-many relationship between projects and locations for targeted sourcing';
COMMENT ON COLUMN public.project_locations.project_id IS 'Reference to the project';
COMMENT ON COLUMN public.project_locations.location_id IS 'Reference to the normalized location entity';
COMMENT ON COLUMN public.project_locations.added_by IS 'User who added this location to the project';
COMMENT ON COLUMN public.project_locations.is_primary IS 'Whether this is the primary location for the project';
COMMENT ON COLUMN public.project_locations.notes IS 'Optional notes about this location context';

COMMENT ON FUNCTION add_location_to_project IS 'Add a location to a project with Google Places data integration';
COMMENT ON FUNCTION get_project_locations IS 'Get all locations associated with a project';
COMMENT ON FUNCTION remove_location_from_project IS 'Remove a location from a project';