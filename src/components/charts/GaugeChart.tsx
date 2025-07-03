import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { DashboardMetric } from '../../types/dashboard';

interface GaugeChartProps {
  data: DashboardMetric;
  maxValue?: number;
  colors?: {
    filled: string;
    empty: string;
  };
}

export const GaugeChart: React.FC<GaugeChartProps> = ({ 
  data, 
  maxValue = 100,
  colors = {
    filled: '#8B5CF6',
    empty: '#E5E7EB'
  }
}) => {
  const value = typeof data.value === 'number' ? data.value : 0;
  const percentage = Math.min((value / maxValue) * 100, 100);
  
  const gaugeData = [
    { name: 'Filled', value: percentage, color: colors.filled },
    { name: 'Empty', value: 100 - percentage, color: colors.empty }
  ];

  return (
    <div className="w-full h-64 flex flex-col items-center justify-center">
      <ResponsiveContainer width="100%" height="80%">
        <PieChart>
          <Pie
            data={gaugeData}
            cx="50%"
            cy="70%"
            startAngle={180}
            endAngle={0}
            innerRadius={60}
            outerRadius={90}
            dataKey="value"
          >
            {gaugeData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      
      <div className="text-center mt-4">
        <div className="text-2xl font-bold text-gray-900">
          {data.type === 'percentage' ? `${value}%` : value}
        </div>
        <div className="text-sm text-gray-600">
          {data.name}
        </div>
      </div>
    </div>
  );
};