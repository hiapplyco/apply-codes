import React from 'react';
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartDataPoint } from '../../types/dashboard';

interface BarChartProps {
  data: ChartDataPoint[];
  color?: string;
  horizontal?: boolean;
  onBarClick?: (data: ChartDataPoint) => void;
  drillDownData?: Record<string, ChartDataPoint[]>;
}

export const BarChart: React.FC<BarChartProps> = ({ 
  data, 
  color = '#8B5CF6',
  horizontal = false,
  onBarClick,
  drillDownData
}) => {
  const chartData = data.map(item => ({
    name: item.name,
    value: item.value,
    label: item.label || item.name
  }));

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBarChart
          data={chartData}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
          layout={horizontal ? 'horizontal' : 'vertical'}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey={horizontal ? "value" : "name"}
            type={horizontal ? "number" : "category"}
            tick={{ fontSize: 12 }}
            angle={horizontal ? 0 : -45}
            textAnchor={horizontal ? "middle" : "end"}
            height={horizontal ? 60 : 80}
          />
          <YAxis 
            dataKey={horizontal ? "name" : "value"}
            type={horizontal ? "category" : "number"}
            tick={{ fontSize: 12 }}
            width={horizontal ? 80 : 60}
          />
          <Tooltip 
            formatter={(value, name) => [value, 'Value']}
            labelFormatter={(label) => `Category: ${label}`}
          />
          <Bar 
            dataKey="value" 
            fill={color}
            radius={[4, 4, 0, 0]}
            onClick={onBarClick ? (data) => onBarClick(data.payload) : undefined}
            style={{ cursor: onBarClick ? 'pointer' : 'default' }}
          />
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
};