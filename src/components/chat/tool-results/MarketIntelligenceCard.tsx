import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, TrendingUp, TrendingDown, Minus, BarChart3, MapPin, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ToolResultComponentProps, MarketIntelligenceResult } from '@/types/mcp-chat';

const trendIcon: Record<string, React.ReactNode> = {
  rising: <TrendingUp className="w-3 h-3 text-green-600" />,
  stable: <Minus className="w-3 h-3 text-gray-500" />,
  declining: <TrendingDown className="w-3 h-3 text-red-500" />,
};

const demandColor: Record<string, string> = {
  high: 'bg-green-100 text-green-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low: 'bg-red-100 text-red-700',
};

export const MarketIntelligenceCard: React.FC<ToolResultComponentProps> = ({
  data,
  status,
}) => {
  const [rawOpen, setRawOpen] = useState(false);
  const result = data as MarketIntelligenceResult;

  if (status === 'error' || !result?.salaryData) {
    return (
      <Card className="border border-red-200 bg-red-50/50 my-2">
        <CardContent className="p-3 text-xs text-red-700">
          Failed to retrieve market intelligence.
        </CardContent>
      </Card>
    );
  }

  const { role, location, experienceLevel, salaryData, marketDemand, skillDemand, recommendations } = result;

  return (
    <Card className="border border-emerald-200 bg-white shadow-sm my-2">
      <CardHeader className="p-3 pb-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-emerald-600" />
            <span className="text-sm font-semibold text-gray-900">Market Intelligence</span>
          </div>
          {marketDemand?.level && (
            <Badge className={cn('text-xs', demandColor[marketDemand.level.toLowerCase()] || 'bg-gray-100 text-gray-600')}>
              {marketDemand.level} Demand
              {typeof marketDemand.score === 'number' && ` (${marketDemand.score}/10)`}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-3 mt-1 text-xs text-gray-600">
          <span className="font-medium">{role}</span>
          {location && (
            <span className="flex items-center gap-0.5">
              <MapPin className="w-3 h-3" />
              {location}
            </span>
          )}
          {experienceLevel && <Badge variant="outline" className="text-[10px]">{experienceLevel}</Badge>}
        </div>
      </CardHeader>

      <CardContent className="p-3 pt-0">
        <div className="p-3 bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg mb-3">
          <div className="flex items-center gap-1 mb-2">
            <DollarSign className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-medium text-emerald-800">Salary Range</span>
          </div>
          <p className="text-xl font-bold text-gray-900">{salaryData.range}</p>
          <div className="flex items-center gap-3 mt-1 text-xs text-gray-600">
            <span>Median: <span className="font-semibold">{salaryData.median}</span></span>
            {salaryData.equity && <span>Equity: {salaryData.equity}</span>}
          </div>
          {salaryData.benefits && (
            <div className="grid grid-cols-2 gap-1 mt-2">
              {Object.entries(salaryData.benefits).map(([key, value]) => (
                <div key={key} className="text-[10px] text-gray-500">
                  <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}: </span>
                  <span className="text-gray-700">{value}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {skillDemand?.length > 0 && (
          <div className="mb-3">
            <p className="text-xs font-medium text-gray-700 mb-1.5">Skill Demand</p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-1 text-gray-500 font-medium">Skill</th>
                    <th className="text-left py-1 text-gray-500 font-medium">Demand</th>
                    <th className="text-left py-1 text-gray-500 font-medium">Salary Impact</th>
                    <th className="text-center py-1 text-gray-500 font-medium">Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {skillDemand.map((sd, idx) => (
                    <tr key={idx} className="border-b border-gray-50">
                      <td className="py-1 text-gray-800">{sd.skill}</td>
                      <td className="py-1 text-gray-600">{sd.demandLevel}</td>
                      <td className="py-1 text-gray-600">{sd.salaryImpact}</td>
                      <td className="py-1 text-center">
                        {trendIcon[sd.trendDirection?.toLowerCase()] || <Minus className="w-3 h-3 text-gray-400 inline" />}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {recommendations?.length > 0 && (
          <div className="p-2 bg-emerald-50 rounded">
            <p className="text-xs font-medium text-emerald-800 mb-1">Recommendations</p>
            <ul className="list-disc pl-4 space-y-0.5">
              {recommendations.map((rec, idx) => (
                <li key={idx} className="text-xs text-emerald-700">{rec}</li>
              ))}
            </ul>
          </div>
        )}

        <Collapsible open={rawOpen} onOpenChange={setRawOpen}>
          <CollapsibleTrigger className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 mt-3">
            <ChevronDown className={cn('w-3 h-3 transition-transform', rawOpen && 'rotate-180')} />
            View raw data
          </CollapsibleTrigger>
          <CollapsibleContent>
            <pre className="text-xs bg-gray-50 rounded p-2 mt-1 overflow-x-auto max-h-48 overflow-y-auto font-mono text-gray-600">
              {JSON.stringify(data, null, 2)}
            </pre>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
};

export default MarketIntelligenceCard;
