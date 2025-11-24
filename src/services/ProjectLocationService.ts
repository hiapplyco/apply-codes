import { db } from '@/lib/firebase';
import {
  ProjectLocation,
  Location,
  AddLocationToProjectInput,
  GooglePlacesLocation
} from '@/types/project';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch
} from 'firebase/firestore';

type FirestoreProjectLocation = {
  projectId: string;
  formattedAddress: string;
  placeId: string | null;
  geometry?: GooglePlacesLocation['geometry'];
  addressComponents?: GooglePlacesLocation['address_components'];
  notes?: string | null;
  isPrimary: boolean;
  addedBy?: string | null;
  createdAt?: any;
  updatedAt?: any;
};

type FirestoreLocation = {
  canonical_name: string;
  city?: string;
  state?: string;
  country?: string;
  aliases?: string[];
  coordinates?: { lat: number; lng: number };
  created_at?: string;
  updated_at?: string;
};

export class ProjectLocationService {
  /**
   * Add a location to a project using Google Places data
   */
  static async addLocationToProject(input: AddLocationToProjectInput): Promise<ProjectLocation> {
    try {
      if (!db) {
        throw new Error('Firestore not initialized');
      }

      const projectLocationsRef = collection(db, 'projectLocations');

      if (input.is_primary) {
        await this.clearPrimaryLocation(input.project_id);
      }

      const payload: FirestoreProjectLocation = {
        projectId: input.project_id,
        formattedAddress: input.formatted_address,
        placeId: input.place_id || null,
        geometry: input.geometry,
        addressComponents: input.address_components,
        notes: input.notes || null,
        isPrimary: input.is_primary || false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(projectLocationsRef, payload);
      const created = await this.getProjectLocationById(docRef.id);

      if (!created) {
        throw new Error('Failed to retrieve created project location');
      }

      return created;
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
      if (!db) {
        throw new Error('Firestore not initialized');
      }

      const projectLocationsRef = collection(db, 'projectLocations');
      const locationsQuery = query(
        projectLocationsRef,
        where('projectId', '==', projectId),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(locationsQuery);

      return snapshot.docs.map((docSnap) => this.mapDocumentToProjectLocation(docSnap.id, docSnap.data()));
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
      if (!db) {
        throw new Error('Firestore not initialized');
      }

      const docRef = doc(db, 'projectLocations', id);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      return this.mapDocumentToProjectLocation(docSnap.id, docSnap.data());
    } catch (error) {
      console.error('ProjectLocationService.getProjectLocationById error:', error);
      return null;
    }
  }

  /**
   * Remove a location from a project
   */
  static async removeLocationFromProject(_projectId: string, locationId: string): Promise<boolean> {
    try {
      if (!db) {
        throw new Error('Firestore not initialized');
      }

      await deleteDoc(doc(db, 'projectLocations', locationId));
      return true;
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
      if (!db) {
        throw new Error('Firestore not initialized');
      }

      await this.clearPrimaryLocation(projectId);

      await updateDoc(doc(db, 'projectLocations', locationId), {
        isPrimary: true,
        updatedAt: serverTimestamp()
      });

      return true;
    } catch (error) {
      console.error('ProjectLocationService.setPrimaryLocation error:', error);
      throw error;
    }
  }

  /**
   * Get location suggestions for autocomplete
   */
  static async searchLocations(queryText: string, limitCount: number = 10): Promise<Location[]> {
    try {
      if (!db) {
        throw new Error('Firestore not initialized');
      }

      const locationsRef = collection(db, 'locations');
      const snapshot = await getDocs(locationsRef);
      const normalizedQuery = queryText.toLowerCase();
      const results: Location[] = [];

      snapshot.forEach((docSnap) => {
        if (results.length >= limitCount) {
          return;
        }

        const data = docSnap.data() as FirestoreLocation;
        const haystack = [
          data.canonical_name,
          data.city,
          data.state,
          data.country,
          ...(data.aliases || [])
        ]
          .filter(Boolean)
          .map((value) => value!.toLowerCase());

        const match = haystack.some((value) => value.includes(normalizedQuery));

        if (match) {
          results.push({
            id: docSnap.id,
            canonical_name: data.canonical_name,
            city: data.city || '',
            state: data.state || '',
            country: data.country || '',
            aliases: data.aliases || [],
            coordinates: data.coordinates,
            created_at: data.created_at || '',
            updated_at: data.updated_at || ''
          });
        }
      });

      return results;
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

  private static mapDocumentToProjectLocation(id: string, data: FirestoreProjectLocation): ProjectLocation {
    const createdAt = data.createdAt?.toDate?.()?.toISOString?.() || new Date().toISOString();
    const updatedAt = data.updatedAt?.toDate?.()?.toISOString?.() || createdAt;

    const locationDetails: Location = {
      id: data.placeId || id,
      canonical_name: data.formattedAddress,
      city: this.findAddressComponent(data.addressComponents, 'locality'),
      state: this.findAddressComponent(data.addressComponents, 'administrative_area_level_1'),
      country: this.findAddressComponent(data.addressComponents, 'country'),
      aliases: [],
      coordinates: data.geometry?.location
        ? {
            lat: data.geometry.location.lat,
            lng: data.geometry.location.lng
          }
        : undefined,
      created_at: createdAt,
      updated_at: updatedAt
    };

    return {
      id,
      project_id: data.projectId,
      location_id: data.placeId || id,
      added_by: data.addedBy || '',
      added_at: createdAt,
      notes: data.notes || null,
      is_primary: !!data.isPrimary,
      location: locationDetails
    };
  }

  private static findAddressComponent(
    components: GooglePlacesLocation['address_components'] | undefined,
    type: string
  ): string | undefined {
    return components
      ?.find((component) => component.types?.includes(type))
      ?.long_name;
  }

  private static async clearPrimaryLocation(projectId: string) {
    if (!db) {
      throw new Error('Firestore not initialized');
    }

    const projectLocationsRef = collection(db, 'projectLocations');
    const primariesQuery = query(
      projectLocationsRef,
      where('projectId', '==', projectId),
      where('isPrimary', '==', true)
    );

    const snapshot = await getDocs(primariesQuery);

    if (snapshot.empty) {
      return;
    }

    const batch = writeBatch(db);
    snapshot.forEach((docSnap) => {
      batch.update(docSnap.ref, { isPrimary: false, updatedAt: serverTimestamp() });
    });

    await batch.commit();
  }
}
