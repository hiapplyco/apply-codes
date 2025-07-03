import React from 'react';
import { ChartDataPoint } from '../../types/dashboard';

interface HeatMapChartProps {
  data: ChartDataPoint[];
  colors?: {
    min: string;
    max: string;
  };
  onCellClick?: (data: ChartDataPoint) => void;
}

export const HeatMapChart: React.FC<HeatMapChartProps> = ({ 
  data,
  colors = {
    min: '#E5E7EB',
    max: '#8B5CF6'
  },
  onCellClick
}) => {
  const maxValue = Math.max(...data.map(item => item.value));
  const minValue = Math.min(...data.map(item => item.value));
  
  const getIntensity = (value: number) => {
    if (maxValue === minValue) return 0.5;
    return (value - minValue) / (maxValue - minValue);
  };

  const getBackgroundColor = (intensity: number) => {
    const r1 = parseInt(colors.min.slice(1, 3), 16);
    const g1 = parseInt(colors.min.slice(3, 5), 16);
    const b1 = parseInt(colors.min.slice(5, 7), 16);
    
    const r2 = parseInt(colors.max.slice(1, 3), 16);
    const g2 = parseInt(colors.max.slice(3, 5), 16);
    const b2 = parseInt(colors.max.slice(5, 7), 16);
    
    const r = Math.round(r1 + (r2 - r1) * intensity);
    const g = Math.round(g1 + (g2 - g1) * intensity);
    const b = Math.round(b1 + (b2 - b1) * intensity);
    
    return `rgb(${r}, ${g}, ${b})`;
  };

  // Group data by location (assuming format like "City, State")
  const locationData = data.reduce((acc, item) => {
    acc[item.name] = item.value;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="w-full h-64 p-4">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 h-full">
        {data.slice(0, 12).map((item, index) => {
          const intensity = getIntensity(item.value);
          const backgroundColor = getBackgroundColor(intensity);
          const textColor = intensity > 0.5 ? 'white' : 'black';
          
          return (
            <div
              key={item.name}
              className={`relative rounded-lg p-3 text-center transition-all duration-200 hover:scale-105 ${
                onCellClick ? 'cursor-pointer' : ''
              }`}
              style={{ backgroundColor }}
              title={`${item.name}: ${item.value} candidates`}
              onClick={onCellClick ? () => onCellClick(item) : undefined}
            >
              <div className={`text-xs font-semibold mb-1`} style={{ color: textColor }}>
                {item.name.split(',')[0]} {/* Show only city name */}
              </div>
              <div className={`text-lg font-bold`} style={{ color: textColor }}>
                {item.value}
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Legend */}
      <div className="flex items-center justify-between mt-4 text-xs text-gray-600">
        <span>Low ({minValue})</span>
        <div className="flex-1 mx-4 h-2 bg-gradient-to-r from-gray-300 to-purple-600 rounded"></div>
        <span>High ({maxValue})</span>
      </div>
    </div>
  );
};