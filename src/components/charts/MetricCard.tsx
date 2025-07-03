import React from 'react';
import { DashboardMetric } from '../../types/dashboard';

interface MetricCardProps {
  data: DashboardMetric;
}

export const MetricCard: React.FC<MetricCardProps> = ({ data }) => {
  const formatValue = (value: number | string, type: string) => {
    if (typeof value === 'string') return value;
    
    switch (type) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          maximumFractionDigits: 0,
        }).format(value);
      case 'percentage':
        return `${value}%`;
      case 'number':
        return new Intl.NumberFormat('en-US').format(value);
      default:
        return value.toString();
    }
  };

  return (
    <div className="flex flex-col justify-center h-full">
      <div className="text-center">
        <div className="text-3xl font-bold text-purple-600 mb-2">
          {formatValue(data.value, data.type)}
        </div>
        
        {data.icon && (
          <div className="text-2xl mb-2">
            {data.icon}
          </div>
        )}
        
        <div className="text-sm text-gray-600">
          {data.name}
        </div>
      </div>
    </div>
  );
};