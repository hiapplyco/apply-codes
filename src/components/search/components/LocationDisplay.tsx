import React from 'react';
import { MapPin, Building } from 'lucide-react';

interface LocationDisplayProps {
  location?: string;
  company?: string;
  className?: string;
  showCompany?: boolean;
}

export const LocationDisplay: React.FC<LocationDisplayProps> = ({ 
  location, 
  company, 
  className = "",
  showCompany = false 
}) => {
  // Don't render if no location
  if (!location) return null;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <MapPin className="w-4 h-4 text-gray-500 flex-shrink-0" />
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <span className="text-gray-700 font-medium">{location}</span>
        {showCompany && company && (
          <>
            <span className="text-gray-400" aria-hidden="true"> · </span>
            <div className="flex items-center gap-1">
              <Building className="w-3 h-3 text-gray-500" />
              <span className="text-gray-600">{company}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// Enhanced version with Google-style formatting
export const GoogleStyleLocationDisplay: React.FC<LocationDisplayProps> = ({ 
  location, 
  company, 
  className = "",
  showCompany = true 
}) => {
  // Show company only if no location (fallback behavior)
  if (!location && !company) return null;
  
  if (!location && company) {
    return (
      <div className={`flex items-center gap-1 text-sm ${className}`}>
        <div className="flex items-center gap-1 text-gray-600">
          <Building className="w-3 h-3" />
          <span>{company}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-1 text-sm ${className}`}>
      <div className="flex items-center gap-1 text-gray-700">
        <span className="font-medium">{location}</span>
        {showCompany && company && (
          <>
            <span className="text-gray-400 mx-1" aria-hidden="true"> · </span>
            <span className="text-gray-600">{company}</span>
          </>
        )}
      </div>
    </div>
  );
};