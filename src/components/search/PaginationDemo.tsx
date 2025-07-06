import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadMoreButton } from './components/LoadMoreButton';
import { Users, Search, ArrowDown, MoreHorizontal } from 'lucide-react';

export const PaginationDemo: React.FC = () => {
  return (
    <div className="p-6 space-y-6">
      <Card className="p-6 border-2 border-purple-400">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Search className="h-5 w-5 text-purple-600" />
          Enhanced Search Results Pagination
        </h2>
        
        <div className="space-y-4">
          {/* Current Features */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <h3 className="font-semibold text-green-800 mb-2">✅ Current Features</h3>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• Infinite scroll detection</li>
                <li>• "Load More" button added</li>
                <li>• Clear pagination status display</li>
                <li>• Results count: "Showing X of Y profiles"</li>
                <li>• Page indicator with total pages</li>
                <li>• Brutalist-styled load button</li>
              </ul>
            </div>
            
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-blue-800 mb-2">🔧 Technical Details</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Google CSE API: 10 results/page</li>
                <li>• Maximum: 100 total results</li>
                <li>• Hybrid: Scroll + manual loading</li>
                <li>• Client-side filtering preserved</li>
                <li>• Loading states for better UX</li>
                <li>• Error handling for API limits</li>
              </ul>
            </div>
          </div>

          {/* Mock Pagination Status */}
          <div className="p-4 bg-gray-50 rounded-lg border">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing <span className="font-semibold">10</span> of{' '}
                <span className="font-semibold">1,234</span> profiles
                <span className="text-purple-600 ml-2">• More available</span>
              </div>
              <div className="text-xs text-gray-500">
                Page 1 of 124
              </div>
            </div>
          </div>

          {/* Mock Search Results */}
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-3 bg-white border rounded-lg">
                <div className="flex items-center gap-3">
                  <Users className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-700">Profile {i} - Software Engineer</span>
                  <Badge variant="outline" className="text-xs">LinkedIn</Badge>
                </div>
              </div>
            ))}
            <div className="flex items-center justify-center py-2 text-gray-400">
              <MoreHorizontal className="h-4 w-4" />
              <span className="ml-2 text-xs">7 more results...</span>
            </div>
          </div>

          {/* Mock Load More Button */}
          <div className="flex justify-center">
            <LoadMoreButton 
              onClick={() => console.log('Loading more...')}
              isLoading={false}
            />
          </div>

          {/* User Benefits */}
          <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
            <h3 className="font-semibold text-purple-800 mb-2">🎯 User Benefits</h3>
            <ul className="text-sm text-purple-700 space-y-1">
              <li>• <strong>Clear expectations:</strong> Always know how many results are available</li>
              <li>• <strong>Control:</strong> Manual load button + automatic scroll loading</li>
              <li>• <strong>Performance:</strong> Only loads 10 results at a time</li>
              <li>• <strong>Visual feedback:</strong> Loading states and progress indicators</li>
              <li>• <strong>No surprises:</strong> Clear end state when all results loaded</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};