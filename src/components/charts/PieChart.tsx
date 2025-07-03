import React from 'react';
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { ChartDataPoint } from '../../types/dashboard';

interface PieChartProps {
  data: ChartDataPoint[];
  colors?: string[];
  onSliceClick?: (data: ChartDataPoint) => void;
}

const DEFAULT_COLORS = [
  '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#3B82F6', 
  '#8B5A2B', '#EC4899', '#6B7280', '#14B8A6', '#F97316'
];

export const PieChart: React.FC<PieChartProps> = ({ 
  data, 
  colors = DEFAULT_COLORS,
  onSliceClick
}) => {
  const chartData = data.map((item, index) => ({
    ...item,
    color: item.color || colors[index % colors.length]
  }));

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, value, index }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize="12"
        fontWeight="bold"
      >
        {`${value}`}
      </text>
    );
  };

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsPieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomizedLabel}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            onClick={onSliceClick ? (data) => onSliceClick(data.payload) : undefined}
            style={{ cursor: onSliceClick ? 'pointer' : 'default' }}
          >
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.color} 
                style={{ cursor: onSliceClick ? 'pointer' : 'default' }}
              />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value, name) => [value, name]}
            labelFormatter={() => ''}
          />
          <Legend />
        </RechartsPieChart>
      </ResponsiveContainer>
    </div>
  );
};