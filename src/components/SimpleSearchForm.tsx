import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Search } from 'lucide-react';

interface SimpleSearchFormProps {
  userId: string | null;
  initialRequirements?: string;
  initialJobId?: number | null;
  autoRun?: boolean;
  initialSearchString?: string;
  jobTitle?: string;
}

export default function SimpleSearchForm({
  initialRequirements = '',
  initialSearchString = '',
  jobTitle = ''
}: SimpleSearchFormProps) {
  const [requirements, setRequirements] = useState(initialRequirements);
  const [searchString, setSearchString] = useState(initialSearchString);
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerateSearch = async () => {
    if (!requirements.trim()) return;
    
    setIsLoading(true);
    try {
      // Simulate search generation
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSearchString(`(${requirements.split(' ').slice(0, 3).join(' OR ')}) AND (software OR engineer OR developer)`);
    } catch (error) {
      console.error('Search generation failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          {jobTitle ? `Search for: ${jobTitle}` : 'Generate Boolean Search'}
        </h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Job Requirements
            </label>
            <Textarea
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
              placeholder="Enter job requirements, skills, or criteria..."
              className="min-h-[120px] border-2 border-gray-300 focus:border-purple-500"
            />
          </div>

          <Button
            onClick={handleGenerateSearch}
            disabled={!requirements.trim() || isLoading}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
          >
            <Search className="w-4 h-4 mr-2" />
            {isLoading ? 'Generating...' : 'Generate Search String'}
          </Button>

          {searchString && (
            <Card className="p-4 border-2 border-green-400 bg-green-50">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Generated Boolean Search
              </label>
              <Input
                value={searchString}
                onChange={(e) => setSearchString(e.target.value)}
                className="font-mono text-sm border-2 border-gray-300 focus:border-green-500"
                placeholder="Boolean search string will appear here"
              />
              <p className="text-xs text-gray-500 mt-2">
                Copy this search string to use in LinkedIn, Google, or other platforms
              </p>
            </Card>
          )}
        </div>
      </div>

      <Card className="p-4 border-2 border-blue-400 bg-blue-50">
        <h3 className="font-medium text-blue-900 mb-2">Temporary Simplified Interface</h3>
        <p className="text-sm text-blue-700">
          This is a simplified version of the search interface. Full functionality will be restored soon.
        </p>
      </Card>
    </div>
  );
}