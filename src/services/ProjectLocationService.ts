import { supabase } from '@/integrations/supabase/client';
import { 
  ProjectLocation, 
  Location, 
  AddLocationToProjectInput,
  GooglePlacesLocation 
} from '@/types/project';

export class ProjectLocationService {
  /**
   * Add a location to a project using Google Places data
   */
  static async addLocationToProject(input: AddLocationToProjectInput): Promise<ProjectLocation> {
    try {
      const { data, error } = await supabase.rpc('add_location_to_project', {
        p_project_id: input.project_id,
        p_formatted_address: input.formatted_address,
        p_place_id: input.place_id,
        p_geometry: input.geometry ? JSON.stringify(input.geometry) : null,
        p_address_components: input.address_components ? JSON.stringify(input.address_components) : null,
        p_notes: input.notes,
        p_is_primary: input.is_primary || false
      });

      if (error) {
        console.error('Error adding location to project:', error);
        throw new Error(`Failed to add location to project: ${error.message}`);
      }

      // Fetch the created project location with location details
      const projectLocation = await this.getProjectLocationById(data);
      if (!projectLocation) {
        throw new Error('Failed to retrieve created project location');
      }

      return projectLocation;
    } catch (error) {
      console.error('ProjectLocationService.addLocationToProject error:', error);
      throw error;
    }
  }

  /**
   * Get all locations for a specific project
   */
  static async getProjectLocations(projectId: string): Promise<ProjectLocation[]> {
    try {
      const { data, error } = await supabase.rpc('get_project_locations', {
        p_project_id: projectId
      });

      if (error) {
        console.error('Error fetching project locations:', error);
        throw new Error(`Failed to fetch project locations: ${error.message}`);
      }

      return data?.map((row: any) => ({
        id: row.project_location_id,
        project_id: projectId,
        location_id: row.location_id,
        added_by: '', // Will be filled by separate query if needed
        added_at: row.added_at,
        notes: row.notes,
        is_primary: row.is_primary,
        location: {
          id: row.location_id,
          canonical_name: row.canonical_name,
          city: row.city,
          state: row.state,
          country: row.country,
          aliases: [],
          coordinates: row.coordinates ? {
            lat: row.coordinates.y,
            lng: row.coordinates.x
          } : undefined,
          created_at: '',
          updated_at: ''
        }
      })) || [];
    } catch (error) {
      console.error('ProjectLocationService.getProjectLocations error:', error);
      throw error;
    }
  }

  /**
   * Get a specific project location by ID
   */
  static async getProjectLocationById(id: string): Promise<ProjectLocation | null> {
    try {
      const { data, error } = await supabase
        .from('project_locations')
        .select(`
          *,
          location:locations(*)
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching project location:', error);
        return null;
      }

      return {
        id: data.id,
        project_id: data.project_id,
        location_id: data.location_id,
        added_by: data.added_by,
        added_at: data.added_at,
        notes: data.notes,
        is_primary: data.is_primary,
        location: data.location ? {
          id: data.location.id,
          canonical_name: data.location.canonical_name,
          city: data.location.city,
          state: data.location.state,
          country: data.location.country,
          aliases: data.location.aliases || [],
          coordinates: data.location.coordinates ? {
            lat: data.location.coordinates.y,
            lng: data.location.coordinates.x
          } : undefined,
          created_at: data.location.created_at,
          updated_at: data.location.updated_at
        } : undefined
      };
    } catch (error) {
      console.error('ProjectLocationService.getProjectLocationById error:', error);
      return null;
    }
  }

  /**
   * Remove a location from a project
   */
  static async removeLocationFromProject(projectId: string, locationId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('remove_location_from_project', {
        p_project_id: projectId,
        p_location_id: locationId
      });

      if (error) {
        console.error('Error removing location from project:', error);
        throw new Error(`Failed to remove location from project: ${error.message}`);
      }

      return data === true;
    } catch (error) {
      console.error('ProjectLocationService.removeLocationFromProject error:', error);
      throw error;
    }
  }

  /**
   * Set a location as primary for a project
   */
  static async setPrimaryLocation(projectId: string, locationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('project_locations')
        .update({ is_primary: false })
        .eq('project_id', projectId);

      if (error) {
        throw error;
      }

      const { error: primaryError } = await supabase
        .from('project_locations')
        .update({ is_primary: true })
        .eq('project_id', projectId)
        .eq('location_id', locationId);

      if (primaryError) {
        console.error('Error setting primary location:', primaryError);
        throw new Error(`Failed to set primary location: ${primaryError.message}`);
      }

      return true;
    } catch (error) {
      console.error('ProjectLocationService.setPrimaryLocation error:', error);
      throw error;
    }
  }

  /**
   * Get location suggestions for autocomplete
   */
  static async searchLocations(query: string, limit: number = 10): Promise<Location[]> {
    try {
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .or(`canonical_name.ilike.%${query}%,city.ilike.%${query}%,state.ilike.%${query}%`)
        .limit(limit);

      if (error) {
        console.error('Error searching locations:', error);
        return [];
      }

      return data?.map(location => ({
        id: location.id,
        canonical_name: location.canonical_name,
        city: location.city,
        state: location.state,
        country: location.country,
        aliases: location.aliases || [],
        coordinates: location.coordinates ? {
          lat: location.coordinates.y,
          lng: location.coordinates.x
        } : undefined,
        created_at: location.created_at,
        updated_at: location.updated_at
      })) || [];
    } catch (error) {
      console.error('ProjectLocationService.searchLocations error:', error);
      return [];
    }
  }

  /**
   * Process Google Places location data into our format
   */
  static processGooglePlacesLocation(googleLocation: GooglePlacesLocation): AddLocationToProjectInput {
    return {
      project_id: '', // Will be set by caller
      formatted_address: googleLocation.formatted_address,
      place_id: googleLocation.place_id,
      geometry: googleLocation.geometry,
      address_components: googleLocation.address_components,
      notes: `Added from Google Places on ${new Date().toLocaleDateString()}`
    };
  }
}

export default ProjectLocationService;