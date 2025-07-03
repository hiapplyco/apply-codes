import React from 'react';
import { ChartDataPoint } from '../../types/dashboard';

interface FunnelChartProps {
  data: ChartDataPoint[];
  colors?: string[];
  onSegmentClick?: (data: ChartDataPoint) => void;
}

const DEFAULT_COLORS = ['#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#3B82F6'];

export const FunnelChart: React.FC<FunnelChartProps> = ({ 
  data, 
  colors = DEFAULT_COLORS,
  onSegmentClick
}) => {
  const maxValue = Math.max(...data.map(item => item.value));
  
  return (
    <div className="w-full h-64 flex flex-col justify-center space-y-2">
      {data.map((item, index) => {
        const percentage = (item.value / maxValue) * 100;
        const color = item.color || colors[index % colors.length];
        
        return (
          <div key={item.name} className="relative">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-gray-900">
                {item.name}
              </span>
              <span className="text-sm text-gray-600">
                {item.value}
              </span>
            </div>
            
            <div className="relative">
              <div 
                className={`h-8 rounded-lg transition-all duration-300 flex items-center justify-center ${
                  onSegmentClick ? 'cursor-pointer hover:opacity-80' : ''
                }`}
                style={{ 
                  backgroundColor: color,
                  width: `${Math.max(percentage, 20)}%`,
                  clipPath: index === 0 
                    ? 'polygon(0 0, 95% 0, 85% 100%, 0% 100%)'
                    : index === data.length - 1
                    ? 'polygon(15% 0, 100% 0, 100% 100%, 5% 100%)'
                    : 'polygon(15% 0, 95% 0, 85% 100%, 5% 100%)'
                }}
                onClick={onSegmentClick ? () => onSegmentClick(item) : undefined}
              >
                <span className="text-white text-xs font-semibold">
                  {Math.round(percentage)}%
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};