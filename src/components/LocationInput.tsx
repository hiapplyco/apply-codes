import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
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
  onInputChange?: (value: string) => void;
  selectedLocation?: LocationData | null;
  placeholder?: string;
  hidePreview?: boolean;  // Hide the green preview box (for use in modals)
}

declare global {
  interface Window {
    google: {
      maps: {
        places: {
          Autocomplete: new (input: HTMLInputElement, options?: {
            types?: string[];
            fields?: string[];
            componentRestrictions?: { country?: string[] };
            strictBounds?: boolean;
          }) => {
            addListener: (event: string, callback: () => void) => void;
            getPlace: () => any;
          };
          PlaceResult: {
            formatted_address?: string;
            place_id?: string;
            geometry?: {
              location: {
                lat: () => number;
                lng: () => number;
              };
            };
            address_components?: Array<{
              long_name: string;
              short_name: string;
              types: string[];
            }>;
          };
        };
      };
    };
  }
}

const LocationInput = memo(React.forwardRef<HTMLInputElement, LocationInputProps>(({
  onLocationSelect,
  onInputChange,
  selectedLocation,
  placeholder = "Enter city, state, zip, or country...",
  hidePreview = false
}, ref) => {
  const [isApiLoaded, setIsApiLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);
  const lastProcessedLocation = useRef<string>('');
  const isInitialized = useRef(false);

  // Check if Google Maps API is already loaded
  const isGoogleMapsLoaded = useCallback(() => {
    return !!(window.google?.maps?.places?.Autocomplete);
  }, []);

  // Process place result with proper error handling
  const processPlaceResult = useCallback((place: any) => {
    try {
      console.log('🔍 Processing place result:', {
        place,
        hasFormattedAddress: !!place.formatted_address,
        hasPlaceId: !!place.place_id,
        lastProcessed: lastProcessedLocation.current
      });

      if (!place.formatted_address) {
        console.warn('⚠️ Missing formatted_address:', place);
        return false;
      }

      // Allow places without place_id for manual fallback
      if (!place.place_id) {
        console.log('⚠️ No place_id, but proceeding with formatted_address');
      }

      // Prevent duplicate processing
      if (lastProcessedLocation.current === place.formatted_address) {
        console.log('🚫 Skipping duplicate location:', place.formatted_address);
        return false;
      }

      lastProcessedLocation.current = place.formatted_address;
      setIsProcessing(true);

      // Convert geometry if available
      let geometry = { location: { lat: 0, lng: 0 } };
      if (place.geometry?.location) {
        geometry = {
          location: {
            lat: typeof place.geometry.location.lat === 'function'
              ? place.geometry.location.lat()
              : place.geometry.location.lat || 0,
            lng: typeof place.geometry.location.lng === 'function'
              ? place.geometry.location.lng()
              : place.geometry.location.lng || 0
          }
        };
      }

      const locationData: LocationData = {
        formatted_address: place.formatted_address,
        place_id: place.place_id,
        geometry,
        address_components: place.address_components || []
      };

      console.log('✅ Processed location data:', locationData);
      console.log('📤 Calling onLocationSelect...');
      onLocationSelect(locationData);
      console.log('✅ onLocationSelect called successfully');

      // Reset processing flag after short delay
      setTimeout(() => {
        setIsProcessing(false);
        // Clear last processed after 2 seconds to allow reselection
        setTimeout(() => {
          lastProcessedLocation.current = '';
        }, 2000);
      }, 100);

      return true;
    } catch (error) {
      console.error('❌ Error processing place result:', error);
      setIsProcessing(false);
      return false;
    }
  }, [onLocationSelect]);

  // Initialize autocomplete with modern best practices
  const initializeAutocomplete = useCallback(() => {
    if (!inputRef.current || !isGoogleMapsLoaded() || isInitialized.current) {
      return;
    }

    try {
      console.log('🚀 Initializing Google Places Autocomplete');

      // Check for billing errors by looking at global error state
      // Google Maps sets this when billing is not enabled
      if ((window as any).gm_authFailure) {
        console.error('❌ Google Maps authentication/billing failure detected');
        setError('Google Maps requires billing to be enabled. You can still type locations manually.');
        setIsApiLoaded(true); // Allow manual input
        return;
      }

      // Create autocomplete with optimized configuration
      autocompleteRef.current = new window.google.maps.places.Autocomplete(
        inputRef.current,
        {
          types: ['geocode'], // Only geographic locations
          fields: ['formatted_address', 'place_id', 'geometry', 'address_components'],
          strictBounds: false
        }
      );

      console.log('✅ Autocomplete instance created:', autocompleteRef.current);
      console.log('📍 Input element:', inputRef.current);

      // Add optimized CSS for dropdown styling
      if (!document.getElementById('google-places-styles')) {
        const style = document.createElement('style');
        style.id = 'google-places-styles';
        style.textContent = `
          .pac-container {
            z-index: 10000 !important;
            border-radius: 8px;
            border: 2px solid #000;
            box-shadow: 4px 4px 0px 0px rgba(0,0,0,1);
            background: white !important;
            font-family: inherit;
            position: fixed !important;
          }
          .pac-item {
            cursor: pointer !important;
            padding: 12px 16px;
            border-bottom: 1px solid #e5e7eb;
            transition: background-color 0.15s ease;
            line-height: 1.4;
            pointer-events: auto !important;
            user-select: none;
            position: relative;
          }
          .pac-item:hover {
            background-color: #f3f4f6;
          }
          .pac-item:last-child {
            border-bottom: none;
          }
          .pac-item-query {
            font-weight: 600;
            color: #374151;
          }
          .pac-matched {
            font-weight: 700;
            color: #7c3aed;
            pointer-events: none;
          }
          .pac-item * {
            pointer-events: none;
          }
        `;
        document.head.appendChild(style);
      }

      // Function to position the dropdown correctly
      const positionDropdown = () => {
        const pacContainer = document.querySelector('.pac-container') as HTMLElement;
        if (pacContainer && inputRef.current) {
          const inputRect = inputRef.current.getBoundingClientRect();
          pacContainer.style.position = 'fixed';
          pacContainer.style.top = `${inputRect.bottom + 4}px`;
          pacContainer.style.left = `${inputRect.left}px`;
          pacContainer.style.width = `${inputRect.width}px`;
        }
      };

      // Force the autocomplete dropdown to append to body and position it correctly
      const observer = new MutationObserver((mutations) => {
        mutations.forEach(() => {
          const pacContainer = document.querySelector('.pac-container') as HTMLElement;
          if (pacContainer && inputRef.current) {
            // Move to body if needed
            if (pacContainer.parentElement !== document.body) {
              console.log('🔧 Moving pac-container to body for proper z-index');
              document.body.appendChild(pacContainer);
            }

            // Position it below the input field
            positionDropdown();
            console.log('📍 Positioned pac-container at input location');
          }
        });
      });

      observer.observe(document.body, { childList: true, subtree: true });

      // Reposition on scroll and resize
      const handleReposition = () => positionDropdown();
      window.addEventListener('scroll', handleReposition, true);
      window.addEventListener('resize', handleReposition);

      // Watch for input position changes (during modal animations)
      const resizeObserver = new ResizeObserver(() => {
        positionDropdown();
      });
      if (inputRef.current) {
        resizeObserver.observe(inputRef.current);
      }

      // Store observer and handlers for cleanup
      (window as any).__pacObserver = observer;
      (window as any).__pacResizeObserver = resizeObserver;
      (window as any).__pacRepositionHandlers = { handleReposition };

      // Add place changed listener
      autocompleteRef.current.addListener('place_changed', () => {
        const place = autocompleteRef.current?.getPlace();
        console.log('🎯 Place changed event triggered:', { place, isProcessing });
        if (place) {
          if (isProcessing) {
            console.log('⏳ Currently processing, skipping...');
            return;
          }
          processPlaceResult(place);
        } else {
          console.log('⚠️ No place data received');
        }
      });

      isInitialized.current = true;
      console.log('✅ Autocomplete initialized successfully');

      // Add MutationObserver to handle dropdown click events
      const dropdownObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList') {
            const addedNodes = Array.from(mutation.addedNodes);
            const pacContainer = addedNodes.find(node =>
              node instanceof HTMLElement && node.classList?.contains('pac-container')
            ) as HTMLElement;

            if (pacContainer) {
              console.log('🔍 Google Places dropdown appeared, adding click handlers');

              // Add click handlers to all pac-items
              const pacItems = pacContainer.querySelectorAll('.pac-item');
              pacItems.forEach((item, index) => {
                console.log(`📌 Adding click handler to item ${index}:`, item.textContent);

                // Remove any existing click handlers to prevent duplicates
                const newItem = item.cloneNode(true) as HTMLElement;
                item.parentNode?.replaceChild(newItem, item);

                // Add mousedown handler (fires before Google's blur event)
                newItem.addEventListener('mousedown', (e) => {
                  e.preventDefault();
                  e.stopPropagation();

                  const itemText = newItem.textContent || '';
                  console.log('🎯 Dropdown item mousedown:', itemText);

                  // Simulate place selection by setting input value and triggering place_changed
                  if (inputRef.current) {
                    inputRef.current.value = itemText;

                    // Try to get place data first
                    setTimeout(() => {
                      const place = autocompleteRef.current?.getPlace();
                      if (place && place.place_id) {
                        console.log('📍 Got place data from Google:', place);
                        processPlaceResult(place);
                      } else {
                        console.log('🔄 No place data, using text fallback:', itemText);
                        // Create manual location data
                        const locationData: LocationData = {
                          formatted_address: itemText.trim(),
                          place_id: '',
                          geometry: { location: { lat: 0, lng: 0 } },
                          address_components: []
                        };
                        processPlaceResult(locationData as any);
                      }
                    }, 100);
                  }
                }, true); // Use capture phase

                // Also add click handler as backup
                newItem.addEventListener('click', (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('🖱️ Dropdown item clicked (backup):', newItem.textContent);
                }, true);
              });
            }
          }
        });
      });

      // Observe the document body for dropdown changes
      dropdownObserver.observe(document.body, {
        childList: true,
        subtree: true
      });

      // Store observer for cleanup
      (window as any).placesObserver = dropdownObserver;

    } catch (error) {
      console.error('❌ Failed to initialize autocomplete:', error);
      setError('Failed to initialize location search');
    }
  }, [isGoogleMapsLoaded, processPlaceResult, isProcessing]);

  // Load Google Maps API with proper error handling
  const loadGoogleMapsAPI = useCallback(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;

    if (!apiKey) {
      setError('Google Maps API key not configured. Enter location manually.');
      setIsApiLoaded(true); // Allow manual input
      return;
    }

    // Set up global auth failure callback BEFORE loading the script
    // Google Maps calls this when billing is not enabled or API key is invalid
    (window as any).gm_authFailure = () => {
      console.error('❌ Google Maps authentication/billing failure');
      (window as any).gm_authFailure_triggered = true;
      setError('Google Maps Places API requires billing. Enter location manually below.');
      setIsApiLoaded(true); // Allow manual input fallback
    };

    if (isGoogleMapsLoaded()) {
      setIsApiLoaded(true);
      initializeAutocomplete();
      return;
    }

    // Prevent multiple script loading
    if (document.querySelector('script[src*="maps.googleapis.com"]')) {
      // Script already exists, wait for it to load
      const checkLoaded = setInterval(() => {
        if (isGoogleMapsLoaded()) {
          clearInterval(checkLoaded);
          setIsApiLoaded(true);
          initializeAutocomplete();
        }
      }, 100);
      // Timeout after 5 seconds
      setTimeout(() => {
        clearInterval(checkLoaded);
        if (!isGoogleMapsLoaded()) {
          setError('Google Maps failed to load. Enter location manually.');
          setIsApiLoaded(true);
        }
      }, 5000);
      return;
    }

    console.log('📡 Loading Google Maps JavaScript API');

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&loading=async&callback=__googleMapsCallback`;
    script.async = true;
    script.defer = true;

    // Set up callback for when script loads
    (window as any).__googleMapsCallback = () => {
      console.log('✅ Google Maps API loaded via callback');
      setIsApiLoaded(true);

      // Check for any pending auth failures
      setTimeout(() => {
        if ((window as any).gm_authFailure_triggered) {
          return; // Auth failure already handled
        }
        initializeAutocomplete();
      }, 100);
    };

    script.onload = () => {
      console.log('✅ Google Maps script loaded');
      // Callback will handle the rest
    };

    script.onerror = () => {
      console.error('❌ Failed to load Google Maps script');
      setError('Failed to load Google Maps. Enter location manually.');
      setIsApiLoaded(true); // Allow manual input
    };

    document.head.appendChild(script);

    // Note: Cleanup is handled in the main useEffect cleanup
  }, [isGoogleMapsLoaded, initializeAutocomplete]);

  // Separate effect for script loading
  useEffect(() => {
    loadGoogleMapsAPI();

    // Cleanup function
    return () => {
      // Clean up global callbacks
      delete (window as any).gm_authFailure;
      delete (window as any).__googleMapsCallback;
      delete (window as any).gm_authFailure_triggered;

      // Clean up observers
      if ((window as any).__pacObserver) {
        (window as any).__pacObserver.disconnect();
        delete (window as any).__pacObserver;
      }
      if ((window as any).placesObserver) {
        (window as any).placesObserver.disconnect();
        delete (window as any).placesObserver;
      }
      if ((window as any).__pacResizeObserver) {
        (window as any).__pacResizeObserver.disconnect();
        delete (window as any).__pacResizeObserver;
      }
      if ((window as any).__pacRepositionHandlers) {
        const { handleReposition } = (window as any).__pacRepositionHandlers;
        window.removeEventListener('scroll', handleReposition, true);
        window.removeEventListener('resize', handleReposition);
        delete (window as any).__pacRepositionHandlers;
      }

      // Don't remove the script - other components may be using it
      const style = document.getElementById('google-places-styles');
      if (style) {
        style.remove();
      }
    };
  }, [loadGoogleMapsAPI]);

  // Re-initialize autocomplete when API loads
  useEffect(() => {
    if (isApiLoaded && inputRef.current && !isInitialized.current && !error) {
      console.log('🔄 API loaded, initializing autocomplete...');
      initializeAutocomplete();
    }
  }, [isApiLoaded, initializeAutocomplete, error]);

  // Handle manual input (Enter key)
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const inputValue = inputRef.current?.value?.trim();

      if (inputValue && inputValue.length >= 3) {
        // Check if autocomplete has a place
        const place = autocompleteRef.current?.getPlace();

        if (place && place.place_id) {
          processPlaceResult(place);
        } else {
          // Manual fallback for any location input (zip codes, cities, etc.)
          // Check if it's a US zip code (5 digits or 5+4 format)
          const isZipCode = /^\d{5}(-\d{4})?$/.test(inputValue);

          // Accept zip codes, or inputs with comma (city, state), or single word locations > 3 chars
          if (isZipCode || inputValue.includes(',') || inputValue.length >= 3) {
            console.log('🔄 Manual input fallback for:', inputValue);
            const locationData: LocationData = {
              formatted_address: inputValue,
              place_id: '',
              geometry: { location: { lat: 0, lng: 0 } },
              address_components: []
            };
            onLocationSelect(locationData);
          }
        }
      }
    } else if (e.key === 'Escape') {
      if (inputRef.current) {
        inputRef.current.value = '';
        inputRef.current.blur();
      }
    }
  }, [processPlaceResult, onLocationSelect]);

  // Handle clear button
  const handleClear = useCallback(() => {
    if (inputRef.current) {
      inputRef.current.value = '';
      inputRef.current.focus();
    }
    lastProcessedLocation.current = '';
    onInputChange?.('');
    onLocationSelect(null as any);
  }, [onLocationSelect, onInputChange]);

  // Render with error - show warning but still allow manual input
  const showWarning = !!error;

  // Determine placeholder based on state
  const getPlaceholder = () => {
    if (!isApiLoaded) return "Loading location search...";
    if (showWarning) return "Type location manually (e.g., San Francisco, CA)...";
    return placeholder;
  };

  return (
    <div className="location-input-container relative space-y-2">
      {/* Warning banner for billing/API issues */}
      {showWarning && (
        <div className="flex items-start gap-2 p-2 bg-amber-50 border border-amber-200 rounded-lg text-xs">
          <MapPin className="h-3.5 w-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
          <span className="text-amber-800">
            {error} <span className="font-medium">Press Enter to confirm.</span>
          </span>
        </div>
      )}

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
            <MapPin className={`h-4 w-4 ${showWarning ? 'text-amber-500' : 'text-gray-400'}`} />
          </div>
          <input
            ref={inputRef}
            type="text"
            placeholder={getPlaceholder()}
            disabled={!isApiLoaded || isProcessing}
            className={`block w-full pl-10 pr-10 py-2 border-2 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white text-sm disabled:bg-gray-50 disabled:text-gray-500 ${
              showWarning ? 'border-amber-300' : 'border-gray-300'
            }`}
            onKeyDown={handleKeyDown}
            onChange={(e) => onInputChange?.(e.target.value)}
            autoComplete="off"
          />
          {selectedLocation && (
            <button
              onClick={handleClear}
              className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-gray-600 z-20"
              type="button"
              disabled={isProcessing}
            >
              <X className="h-4 w-4 text-gray-400" />
            </button>
          )}
          {isProcessing && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center z-20">
              <div className="animate-spin h-4 w-4 border-2 border-purple-500 border-t-transparent rounded-full"></div>
            </div>
          )}
        </div>
      </div>

      {!hidePreview && selectedLocation && (
        <div className="p-2 bg-green-50 border-2 border-green-200 rounded-lg">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-green-600 flex-shrink-0" />
            <span className="text-green-800 text-sm font-medium">
              {selectedLocation.formatted_address}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}));

LocationInput.displayName = 'LocationInput';

export default LocationInput;