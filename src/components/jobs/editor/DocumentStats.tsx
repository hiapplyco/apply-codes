import { Card } from "@/components/ui/card";
import { FileText, Clock, Users, Eye } from "lucide-react";

interface DocumentStatsProps {
  wordCount: number;
  charCount: number;
  readingTime: number;
  collaborators?: number;
  views?: number;
  className?: string;
}

export function DocumentStats({ 
  wordCount, 
  charCount, 
  readingTime, 
  collaborators = 0,
  views = 0,
  className = ""
}: DocumentStatsProps) {
  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  };

  const formatReadingTime = (minutes: number) => {
    if (minutes < 1) return '< 1 min';
    if (minutes < 60) return `${minutes} min`;
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (remainingMinutes === 0) {
      return `${hours}h`;
    }
    
    return `${hours}h ${remainingMinutes}m`;
  };

  return (
    <Card className={`p-3 mx-4 mb-2 bg-gray-50 border-0 ${className}`}>
      <div className="flex items-center justify-between text-sm text-gray-600">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-1">
            <FileText className="h-4 w-4" />
            <span className="font-medium">{formatNumber(wordCount)}</span>
            <span className="text-gray-500">words</span>
          </div>
          
          <div className="flex items-center gap-1">
            <span className="font-medium">{formatNumber(charCount)}</span>
            <span className="text-gray-500">characters</span>
          </div>
          
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span className="font-medium">{formatReadingTime(readingTime)}</span>
            <span className="text-gray-500">read</span>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          {collaborators > 0 && (
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span className="font-medium">{collaborators}</span>
              <span className="text-gray-500">collaborators</span>
            </div>
          )}
          
          {views > 0 && (
            <div className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              <span className="font-medium">{formatNumber(views)}</span>
              <span className="text-gray-500">views</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}