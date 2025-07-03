import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, DollarSign, Users, X, Filter, RotateCcw } from 'lucide-react';
import { Button } from '../ui/button';
import { DashboardFilters as FiltersType } from '../../types/dashboard';

interface DashboardFiltersProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FiltersType | null;
  onFiltersChange: (filters: FiltersType | null) => void;
  onApplyFilters: () => void;
}

export const DashboardFilters: React.FC<DashboardFiltersProps> = ({
  isOpen,
  onClose,
  filters,
  onFiltersChange,
  onApplyFilters
}) => {
  const [localFilters, setLocalFilters] = useState<FiltersType>({
    dateRange: {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      end: new Date()
    },
    locations: [],
    experienceLevels: [],
    skills: [],
    salaryRange: {
      min: 0,
      max: 300000
    }
  });

  const [customLocation, setCustomLocation] = useState('');
  const [customSkill, setCustomSkill] = useState('');

  useEffect(() => {
    if (filters) {
      setLocalFilters(filters);
    }
  }, [filters]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const predefinedLocations = [
    'San Francisco, CA',
    'New York, NY',
    'Seattle, WA',
    'Austin, TX',
    'Denver, CO',
    'Chicago, IL',
    'Boston, MA',
    'Los Angeles, CA',
    'Remote',
    'Hybrid'
  ];

  const predefinedSkills = [
    'React',
    'TypeScript',
    'Node.js',
    'Python',
    'Java',
    'AWS',
    'Docker',
    'Kubernetes',
    'GraphQL',
    'Machine Learning',
    'DevOps',
    'Product Management'
  ];

  const experienceLevels = [
    'Entry Level (0-2 years)',
    'Mid Level (3-5 years)',
    'Senior Level (6-10 years)',
    'Lead/Principal (10+ years)',
    'Executive (15+ years)'
  ];

  const handleLocationToggle = (location: string) => {
    setLocalFilters(prev => ({
      ...prev,
      locations: prev.locations.includes(location)
        ? prev.locations.filter(l => l !== location)
        : [...prev.locations, location]
    }));
  };

  const handleSkillToggle = (skill: string) => {
    setLocalFilters(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }));
  };

  const handleExperienceToggle = (level: string) => {
    setLocalFilters(prev => ({
      ...prev,
      experienceLevels: prev.experienceLevels.includes(level)
        ? prev.experienceLevels.filter(e => e !== level)
        : [...prev.experienceLevels, level]
    }));
  };

  const handleAddCustomLocation = () => {
    if (customLocation.trim() && !localFilters.locations.includes(customLocation)) {
      setLocalFilters(prev => ({
        ...prev,
        locations: [...prev.locations, customLocation.trim()]
      }));
      setCustomLocation('');
    }
  };

  const handleAddCustomSkill = () => {
    if (customSkill.trim() && !localFilters.skills.includes(customSkill)) {
      setLocalFilters(prev => ({
        ...prev,
        skills: [...prev.skills, customSkill.trim()]
      }));
      setCustomSkill('');
    }
  };

  const handleApply = () => {
    onFiltersChange(localFilters);
    onApplyFilters();
    onClose();
  };

  const handleReset = () => {
    setLocalFilters({
      dateRange: {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        end: new Date()
      },
      locations: [],
      experienceLevels: [],
      skills: [],
      salaryRange: {
        min: 0,
        max: 300000
      }
    });
  };

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const hasActiveFilters = () => {
    return localFilters.locations.length > 0 ||
           localFilters.experienceLevels.length > 0 ||
           localFilters.skills.length > 0 ||
           localFilters.salaryRange.min > 0 ||
           localFilters.salaryRange.max < 300000;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white w-full h-full max-w-4xl max-h-[90vh] rounded-lg shadow-2xl border-2 border-black overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b-2 border-black bg-gray-50">
          <div className="flex items-center space-x-3">
            <Filter className="w-6 h-6 text-purple-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Dashboard Filters</h2>
              <p className="text-gray-600">Customize your recruitment analytics view</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Button
              onClick={handleReset}
              variant="outline"
              size="sm"
              className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset All
            </Button>

            <Button
              onClick={onClose}
              variant="outline"
              size="sm"
              className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto h-full space-y-8">
          {/* Date Range Filter */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-900">Date Range</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                <input
                  type="date"
                  value={formatDate(localFilters.dateRange.start)}
                  onChange={(e) => setLocalFilters(prev => ({
                    ...prev,
                    dateRange: {
                      ...prev.dateRange,
                      start: new Date(e.target.value)
                    }
                  }))}
                  className="w-full px-3 py-2 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                <input
                  type="date"
                  value={formatDate(localFilters.dateRange.end)}
                  onChange={(e) => setLocalFilters(prev => ({
                    ...prev,
                    dateRange: {
                      ...prev.dateRange,
                      end: new Date(e.target.value)
                    }
                  }))}
                  className="w-full px-3 py-2 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>
            </div>
          </div>

          {/* Location Filter */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <MapPin className="w-5 h-5 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-900">Locations</h3>
            </div>
            
            {/* Custom Location Input */}
            <div className="flex space-x-2">
              <input
                type="text"
                placeholder="Add custom location..."
                value={customLocation}
                onChange={(e) => setCustomLocation(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddCustomLocation()}
                className="flex-1 px-3 py-2 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
              />
              <Button
                onClick={handleAddCustomLocation}
                size="sm"
                className="bg-purple-600 text-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              >
                Add
              </Button>
            </div>

            {/* Predefined Locations */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {predefinedLocations.map(location => (
                <button
                  key={location}
                  onClick={() => handleLocationToggle(location)}
                  className={`px-3 py-2 text-sm rounded-lg border-2 border-black transition-all duration-200 ${
                    localFilters.locations.includes(location)
                      ? 'bg-purple-600 text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                      : 'bg-white text-gray-700 hover:bg-gray-50 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]'
                  }`}
                >
                  {location}
                </button>
              ))}
            </div>

            {/* Selected Custom Locations */}
            {localFilters.locations.filter(loc => !predefinedLocations.includes(loc)).length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700">Custom Locations:</h4>
                <div className="flex flex-wrap gap-2">
                  {localFilters.locations
                    .filter(loc => !predefinedLocations.includes(loc))
                    .map(location => (
                      <span
                        key={location}
                        className="inline-flex items-center px-3 py-1 text-sm bg-green-100 text-green-800 rounded-full border-2 border-black"
                      >
                        {location}
                        <button
                          onClick={() => handleLocationToggle(location)}
                          className="ml-2 text-green-600 hover:text-green-800"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* Experience Level Filter */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-900">Experience Levels</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {experienceLevels.map(level => (
                <button
                  key={level}
                  onClick={() => handleExperienceToggle(level)}
                  className={`px-3 py-2 text-sm rounded-lg border-2 border-black transition-all duration-200 text-left ${
                    localFilters.experienceLevels.includes(level)
                      ? 'bg-purple-600 text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                      : 'bg-white text-gray-700 hover:bg-gray-50 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          {/* Skills Filter */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-900">Skills</h3>
            </div>
            
            {/* Custom Skill Input */}
            <div className="flex space-x-2">
              <input
                type="text"
                placeholder="Add custom skill..."
                value={customSkill}
                onChange={(e) => setCustomSkill(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddCustomSkill()}
                className="flex-1 px-3 py-2 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
              />
              <Button
                onClick={handleAddCustomSkill}
                size="sm"
                className="bg-purple-600 text-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              >
                Add
              </Button>
            </div>

            {/* Predefined Skills */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {predefinedSkills.map(skill => (
                <button
                  key={skill}
                  onClick={() => handleSkillToggle(skill)}
                  className={`px-3 py-2 text-sm rounded-lg border-2 border-black transition-all duration-200 ${
                    localFilters.skills.includes(skill)
                      ? 'bg-purple-600 text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                      : 'bg-white text-gray-700 hover:bg-gray-50 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]'
                  }`}
                >
                  {skill}
                </button>
              ))}
            </div>

            {/* Selected Custom Skills */}
            {localFilters.skills.filter(skill => !predefinedSkills.includes(skill)).length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700">Custom Skills:</h4>
                <div className="flex flex-wrap gap-2">
                  {localFilters.skills
                    .filter(skill => !predefinedSkills.includes(skill))
                    .map(skill => (
                      <span
                        key={skill}
                        className="inline-flex items-center px-3 py-1 text-sm bg-green-100 text-green-800 rounded-full border-2 border-black"
                      >
                        {skill}
                        <button
                          onClick={() => handleSkillToggle(skill)}
                          className="ml-2 text-green-600 hover:text-green-800"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* Salary Range Filter */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-900">Salary Range</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Salary</label>
                <input
                  type="number"
                  min="0"
                  max="500000"
                  step="5000"
                  value={localFilters.salaryRange.min}
                  onChange={(e) => setLocalFilters(prev => ({
                    ...prev,
                    salaryRange: {
                      ...prev.salaryRange,
                      min: parseInt(e.target.value) || 0
                    }
                  }))}
                  className="w-full px-3 py-2 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Maximum Salary</label>
                <input
                  type="number"
                  min="0"
                  max="500000"
                  step="5000"
                  value={localFilters.salaryRange.max}
                  onChange={(e) => setLocalFilters(prev => ({
                    ...prev,
                    salaryRange: {
                      ...prev.salaryRange,
                      max: parseInt(e.target.value) || 300000
                    }
                  }))}
                  className="w-full px-3 py-2 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>
            </div>
            <div className="text-sm text-gray-600">
              Range: ${localFilters.salaryRange.min.toLocaleString()} - ${localFilters.salaryRange.max.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t-2 border-black bg-gray-50">
          <div className="text-sm text-gray-600">
            {hasActiveFilters() ? (
              <span className="text-purple-600 font-medium">
                {localFilters.locations.length + localFilters.experienceLevels.length + localFilters.skills.length} active filters
              </span>
            ) : (
              <span>No active filters</span>
            )}
          </div>

          <div className="flex items-center space-x-3">
            <Button
              onClick={onClose}
              variant="outline"
              className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            >
              Cancel
            </Button>
            
            <Button
              onClick={handleApply}
              className="bg-purple-600 text-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-purple-700"
            >
              Apply Filters
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};