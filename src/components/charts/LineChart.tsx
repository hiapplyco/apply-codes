import React from 'react';
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TimeSeriesData } from '../../types/dashboard';

interface LineChartProps {
  data: TimeSeriesData[];
  color?: string;
  strokeWidth?: number;
  onPointClick?: (data: TimeSeriesData) => void;
}

export const LineChart: React.FC<LineChartProps> = ({ 
  data, 
  color = '#8B5CF6',
  strokeWidth = 2,
  onPointClick
}) => {
  const chartData = data.map(item => ({
    date: item.date,
    value: item.value,
    label: item.label || new Date(item.date).toLocaleDateString()
  }));

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsLineChart
          data={chartData}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="date"
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric' 
            })}
          />
          <YAxis 
            tick={{ fontSize: 12 }}
          />
          <Tooltip 
            formatter={(value, name) => [value, 'Value']}
            labelFormatter={(label) => new Date(label).toLocaleDateString()}
          />
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke={color} 
            strokeWidth={strokeWidth}
            dot={{ 
              fill: color, 
              strokeWidth: 2, 
              r: 4,
              style: { cursor: onPointClick ? 'pointer' : 'default' }
            }}
            activeDot={{ 
              r: 6, 
              stroke: color, 
              strokeWidth: 2,
              style: { cursor: onPointClick ? 'pointer' : 'default' }
            }}
            onClick={onPointClick ? (data) => onPointClick({ name: data.payload.date, value: data.payload.value }) : undefined}
          />
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
};