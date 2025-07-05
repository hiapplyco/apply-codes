import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MapPin, X } from 'lucide-react';

interface LocationData {
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

interface LocationInputProps {
  onLocationSelect: (location: LocationData) => void;
  selectedLocation?: LocationData | null;
  placeholder?: string;
}

declare global {
  interface Window {
    google: {
      maps: {
        places: {
          Autocomplete: {
            new (input: HTMLInputElement, options?: {
              types?: string[];
              fields?: string[];
            }): {
              addListener: (event: string, callback: () => void) => void;
              getPlace: () => {
                formatted_address?: string;
                place_id?: string;
                geometry?: unknown;
                address_components?: unknown[];
              };
            };
          };
        };
      };
    };
    initAutocomplete: () => void;
  }
}

const LocationInput: React.FC<LocationInputProps> = ({
  onLocationSelect,
  selectedLocation,
  placeholder = "Enter city, state, zip, or country..."
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<{
    addListener: (event: string, callback: () => void) => void;
    getPlace: () => {
      formatted_address?: string;
      place_id?: string;
      geometry?: unknown;
      address_components?: unknown[];
    };
  } | null>(null);

  const initializeAutocomplete = useCallback(() => {
    if (!inputRef.current || !window.google?.maps?.places) return;

    try {
      autocompleteRef.current = new window.google.maps.places.Autocomplete(
        inputRef.current,
        {
          types: ['(cities)'],
          fields: ['formatted_address', 'place_id', 'geometry', 'address_components']
        }
      );

      autocompleteRef.current.addListener('place_changed', () => {
        const place = autocompleteRef.current?.getPlace();
        
        if (place?.geometry && place.formatted_address) {
          onLocationSelect({
            formatted_address: place.formatted_address,
            place_id: place.place_id || '',
            geometry: place.geometry,
            address_components: place.address_components || []
          });
        }
      });
    } catch (err) {
      console.error('Error initializing autocomplete:', err);
      setError('Failed to initialize location search');
    }
  }, [onLocationSelect]);

  useEffect(() => {
    // Check if Google Maps API is already loaded
    if (window.google && window.google.maps) {
      initializeAutocomplete();
      return;
    }

    // Load Google Maps API
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      setIsLoaded(true);
      initializeAutocomplete();
    };
    
    script.onerror = () => {
      setError('Failed to load Google Maps API');
    };

    document.head.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [initializeAutocomplete]);

  const handleClear = () => {
    if (inputRef.current) {
      inputRef.current.value = '';
    }
    onLocationSelect(null as any);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleClear();
    }
  };

  if (error) {
    return (
      <div className="location-input-error">
        <div className="flex items-center gap-2 p-3 bg-red-50 border-2 border-red-200 rounded-lg">
          <MapPin className="h-4 w-4 text-red-500" />
          <span className="text-red-700 text-sm">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="location-input-container relative">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MapPin className="h-4 w-4 text-gray-400" />
          </div>
          <input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            className="block w-full pl-10 pr-10 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white text-sm"
            onKeyDown={handleKeyDown}
            autoComplete="off"
          />
          {selectedLocation && (
            <button
              onClick={handleClear}
              className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-gray-600"
              type="button"
            >
              <X className="h-4 w-4 text-gray-400" />
            </button>
          )}
        </div>
      </div>
      
      {selectedLocation && (
        <div className="mt-2 p-2 bg-green-50 border-2 border-green-200 rounded-lg">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-green-600" />
            <span className="text-green-800 text-sm font-medium">
              {selectedLocation.formatted_address}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationInput;