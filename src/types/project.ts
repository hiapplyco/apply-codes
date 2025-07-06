export interface Project {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  color: string;
  icon: string;
  candidates_count: number;
  created_at: string;
  updated_at: string;
  is_archived: boolean;
  metadata?: Record<string, any>;
  locations?: ProjectLocation[];
}

export interface ProjectCandidate {
  id: string;
  project_id: string;
  candidate_id: string;
  added_at: string;
  added_by: string;
  notes?: string;
  tags?: string[];
}

export interface CreateProjectInput {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
}

export interface UpdateProjectInput extends Partial<CreateProjectInput> {
  is_archived?: boolean;
}

export interface Location {
  id: string;
  canonical_name: string;
  city: string;
  state?: string;
  country: string;
  aliases: string[];
  coordinates?: {
    lat: number;
    lng: number;
  };
  created_at: string;
  updated_at: string;
}

export interface ProjectLocation {
  id: string;
  project_id: string;
  location_id: string;
  added_by: string;
  added_at: string;
  notes?: string;
  is_primary: boolean;
  location?: Location;
}

export interface GooglePlacesLocation {
  formatted_address: string;
  place_id: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  address_components: Array<{
    long_name: string;
    short_name: string;
    types: string[];
  }>;
}

export interface AddLocationToProjectInput {
  project_id: string;
  formatted_address: string;
  place_id?: string;
  geometry?: GooglePlacesLocation['geometry'];
  address_components?: GooglePlacesLocation['address_components'];
  notes?: string;
  is_primary?: boolean;
}