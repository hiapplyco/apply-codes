import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, MapPin, Check } from 'lucide-react';
import LocationInput from './LocationInput';

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

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationSelect: (location: LocationData) => void;
}

const LocationModal: React.FC<LocationModalProps> = ({
  isOpen,
  onClose,
  onLocationSelect
}) => {
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(null);

  const handleLocationInputSelect = (location: LocationData) => {
    setSelectedLocation(location);
  };

  const handleConfirm = () => {
    if (selectedLocation) {
      onLocationSelect(selectedLocation);
      onClose();
      setSelectedLocation(null);
    }
  };

  const handleCancel = () => {
    setSelectedLocation(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <MapPin className="h-5 w-5 text-purple-600" />
            Set Search Location
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-sm text-gray-600">
            Enter a location to focus your candidate search. You can search by:
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
              <span>City (e.g., San Francisco)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
              <span>State (e.g., California)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
              <span>ZIP Code (e.g., 94102)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
              <span>Country (e.g., United States)</span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Search Location
            </label>
            <LocationInput
              onLocationSelect={handleLocationInputSelect}
              selectedLocation={selectedLocation}
              placeholder="Enter city, state, zip, or country..."
            />
          </div>

          {selectedLocation && (
            <div className="p-3 bg-green-50 border-2 border-green-200 rounded-lg">
              <div className="flex items-start gap-2">
                <Check className="h-4 w-4 text-green-600 mt-0.5" />
                <div>
                  <div className="font-medium text-green-800">
                    Location Selected
                  </div>
                  <div className="text-sm text-green-700">
                    {selectedLocation.formatted_address}
                  </div>
                  <div className="text-xs text-green-600 mt-1">
                    This location will be used to generate location-specific boolean search terms.
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={handleCancel}
              className="border-2 border-gray-300 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!selectedLocation}
              className="bg-purple-600 hover:bg-purple-700 text-white border-2 border-purple-600 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
            >
              <Check className="w-4 h-4 mr-2" />
              Set Location
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LocationModal;