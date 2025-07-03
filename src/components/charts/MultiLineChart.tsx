import React from 'react';
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface DataSeries {
  key: string;
  name: string;
  color: string;
  strokeWidth?: number;
  strokeDasharray?: string;
}

interface MultiLineChartProps {
  data: Array<{
    date: string;
    [key: string]: string | number;
  }>;
  series: DataSeries[];
  height?: number;
}

export const MultiLineChart: React.FC<MultiLineChartProps> = ({ 
  data, 
  series,
  height = 300
}) => {
  const chartData = data.map(item => ({
    ...item,
    date: new Date(item.date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    })
  }));

  return (
    <div className="w-full" style={{ height: `${height}px` }}>
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
          />
          <YAxis 
            tick={{ fontSize: 12 }}
          />
          <Tooltip 
            formatter={(value, name) => [value, name]}
            labelFormatter={(label) => `Date: ${label}`}
          />
          <Legend />
          
          {series.map((s, index) => (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.name}
              stroke={s.color}
              strokeWidth={s.strokeWidth || 2}
              strokeDasharray={s.strokeDasharray}
              dot={{ fill: s.color, strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: s.color, strokeWidth: 2 }}
            />
          ))}
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
};