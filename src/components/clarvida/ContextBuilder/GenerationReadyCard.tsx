import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2, FileText } from 'lucide-react';
import { ContentType } from './types';

interface GenerationReadyCardProps {
  template: any;
  contextItemsCount: number;
  contentTypes: ContentType[];
  selectedContentType: string;
  onContentTypeChange: (type: string) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  isExtracting: boolean;
}

export function GenerationReadyCard({
  template,
  contextItemsCount,
  contentTypes,
  selectedContentType,
  onContentTypeChange,
  onGenerate,
  isGenerating,
  isExtracting,
}: GenerationReadyCardProps) {
  const hasTemplate = template && Object.keys(template).length > 0;

  return (
    <Card className="border border-green-200 bg-green-50/50 p-4">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-green-600" />
          <h3 className="font-medium text-green-800">
            Ready to Generate
          </h3>
        </div>
        <p className="text-sm text-green-700">
          {contextItemsCount} context item{contextItemsCount !== 1 ? 's' : ''} collected
          {hasTemplate ? ' and template fields populated' : ''}.
        </p>

        {contentTypes.length > 1 && (
          <div className="flex flex-wrap gap-2">
            {contentTypes.map((ct) => (
              <button
                key={ct.content_type}
                onClick={() => onContentTypeChange(ct.content_type)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                  selectedContentType === ct.content_type
                    ? 'bg-green-600 text-white border-green-600'
                    : 'bg-white text-green-700 border-green-200 hover:border-green-400'
                }`}
                title={ct.tooltip}
              >
                {ct.emoji} {ct.content_type}
              </button>
            ))}
          </div>
        )}

        <Button
          onClick={onGenerate}
          disabled={isGenerating || isExtracting}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          {isGenerating ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</>
          ) : (
            <><Sparkles className="w-4 h-4 mr-2" /> Generate Content</>
          )}
        </Button>
      </div>
    </Card>
  );
}
