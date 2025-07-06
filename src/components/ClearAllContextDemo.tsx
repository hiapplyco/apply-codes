import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Globe, 
  FileText, 
  MapPin, 
  Trash2, 
  Eye, 
  EyeOff,
  Plus,
  AlertTriangle 
} from 'lucide-react';

interface DemoContextItem {
  id: string;
  type: 'url_scrape' | 'file_upload' | 'perplexity_search' | 'manual_input';
  title: string;
  content: string;
}

export const ClearAllContextDemo: React.FC = () => {
  const [contextItems, setContextItems] = useState<DemoContextItem[]>([
    {
      id: '1',
      type: 'url_scrape',
      title: 'Company Website - Engineering Jobs',
      content: 'We are looking for senior software engineers with React and TypeScript experience...'
    },
    {
      id: '2',
      type: 'file_upload',
      title: 'Job Description.pdf',
      content: 'Senior Full Stack Developer position requiring 5+ years experience in modern web technologies...'
    },
    {
      id: '3',
      type: 'perplexity_search',
      title: 'Current React Developer Salaries',
      content: 'According to recent market data, React developers with 5+ years experience earn...'
    },
    {
      id: '4',
      type: 'manual_input',
      title: 'Location: San Francisco, CA, USA',
      content: 'San Francisco, California, United States'
    }
  ]);

  const clearAllContextItems = () => {
    const confirmed = window.confirm(
      `Are you sure you want to clear all ${contextItems.length} context items? This action cannot be undone.`
    );

    if (confirmed) {
      setContextItems([]);
    }
  };

  const removeContextItem = (id: string) => {
    setContextItems(prev => prev.filter(item => item.id !== id));
  };

  const addSampleItem = () => {
    const newItem: DemoContextItem = {
      id: Date.now().toString(),
      type: 'manual_input',
      title: 'Additional Requirements',
      content: 'Must have experience with GraphQL and microservices architecture...'
    };
    setContextItems(prev => [...prev, newItem]);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'url_scrape': return <Globe className="w-4 h-4 text-blue-500" />;
      case 'file_upload': return <FileText className="w-4 h-4 text-green-500" />;
      case 'perplexity_search': return <div className="w-4 h-4 bg-purple-500 rounded" />;
      case 'manual_input': return <MapPin className="w-4 h-4 text-purple-500" />;
      default: return <FileText className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="p-6 space-y-4">
      <Card className="p-6 border-2 border-purple-400">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Trash2 className="h-5 w-5 text-red-600" />
          Clear All Context Items Demo
        </h2>
        
        <div className="space-y-4">
          {/* Add Sample Button */}
          <div className="flex gap-2">
            <Button
              onClick={addSampleItem}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Plus className="w-3 h-3" />
              Add Sample Item
            </Button>
          </div>

          {/* Context Items Display */}
          {contextItems.length > 0 ? (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-700">
                  Added Context ({contextItems.length} item{contextItems.length !== 1 ? 's' : ''})
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAllContextItems}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 text-xs px-2 py-1"
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  Clear All
                </Button>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {contextItems.map((item) => (
                  <div
                    key={item.id}
                    className="border border-gray-200 rounded-lg p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        {getIcon(item.type)}
                        <span className="text-xs font-medium text-gray-800 truncate">
                          {item.title}
                        </span>
                      </div>
                      <div className="flex gap-1 ml-2">
                        <button
                          className="text-gray-400 hover:text-gray-600 p-1"
                        >
                          <Eye className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => removeContextItem(item.id)}
                          className="text-red-400 hover:text-red-600 p-1"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    
                    <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                      {item.content}
                    </p>
                    
                    <Badge variant="outline" className="text-xs">
                      {item.type.replace('_', ' ')}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm">No context items added</p>
              <p className="text-xs text-gray-400 mt-1">Add some sample items to test the clear all functionality</p>
            </div>
          )}

          {/* Feature Explanation */}
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-blue-800 mb-2">✨ New Feature: Clear All Context</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• <strong>Bulk deletion:</strong> Remove all context items with one click</li>
              <li>• <strong>Confirmation dialog:</strong> Prevents accidental deletions</li>
              <li>• <strong>Smart placement:</strong> Located next to context count for easy access</li>
              <li>• <strong>Database cleanup:</strong> Removes items from database and local state</li>
              <li>• <strong>Toast notifications:</strong> Clear feedback on success/failure</li>
              <li>• <strong>Project-scoped:</strong> Only clears items for current project</li>
            </ul>
          </div>

          {/* User Benefits */}
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <h3 className="font-semibold text-green-800 mb-2">🎯 User Benefits</h3>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• <strong>Quick reset:</strong> Start fresh without deleting items one by one</li>
              <li>• <strong>Project switching:</strong> Clean slate when changing job searches</li>
              <li>• <strong>Workflow efficiency:</strong> No more tedious individual deletions</li>
              <li>• <strong>Error recovery:</strong> Easy way to clear problematic context</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};