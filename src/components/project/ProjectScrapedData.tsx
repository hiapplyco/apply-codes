import React, { useEffect, useState } from 'react';
import { FirecrawlService } from '@/utils/FirecrawlService';
import { Card } from '@/components/ui/card';
import { Link2, FileText, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface ScrapedData {
  id: string;
  url: string;
  summary: string;
  raw_content: string;
  context: string;
  created_at: string;
  metadata: {
    scraped_at: string;
    source: string;
  };
}

interface ProjectScrapedDataProps {
  projectId: string;
}

export function ProjectScrapedData({ projectId }: ProjectScrapedDataProps) {
  const [scrapedData, setScrapedData] = useState<ScrapedData[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchScrapedData();
  }, [projectId]);

  const fetchScrapedData = async () => {
    try {
      setLoading(true);
      const result = await FirecrawlService.getProjectScrapedData(projectId);
      
      if (result.success && result.data) {
        setScrapedData(result.data as unknown as ScrapedData[]);
      } else {
        console.error('Failed to fetch scraped data:', result.error);
      }
    } catch (error) {
      console.error('Error fetching scraped data:', error);
      toast.error('Failed to load scraped data');
    } finally {
      setLoading(false);
    }
  };

  const toggleExpanded = (id: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center">
          <div className="animate-pulse text-gray-400">Loading scraped data...</div>
        </div>
      </Card>
    );
  }

  if (scrapedData.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
        <FileText className="w-5 h-5 text-[#39FF14]" />
        Research & Scraped Data
      </h3>
      
      <div className="grid gap-3">
        {scrapedData.map((item) => (
          <Card key={item.id} className="p-4 hover:shadow-md transition-shadow">
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Link2 className="w-4 h-4 text-gray-400" />
                    <a 
                      href={item.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline truncate max-w-md"
                    >
                      {item.url}
                    </a>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(item.created_at), 'MMM d, yyyy h:mm a')}
                    </span>
                    <span className="bg-gray-100 px-2 py-0.5 rounded">
                      {item.context}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => toggleExpanded(item.id)}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                >
                  {expandedItems.has(item.id) ? (
                    <ChevronUp className="w-4 h-4 text-gray-600" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-600" />
                  )}
                </button>
              </div>
              
              <div className="text-sm text-gray-700">
                {expandedItems.has(item.id) ? (
                  <div className="space-y-2">
                    <div className="font-medium">Summary:</div>
                    <div className="pl-4 whitespace-pre-wrap">{item.summary}</div>
                  </div>
                ) : (
                  <p className="line-clamp-2">{item.summary}</p>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}