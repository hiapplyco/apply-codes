import React from 'react';
import { Radar, RadarChart as RechartsRadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface RadarChartProps {
  data: Array<{
    subject: string;
    value: number;
    fullMark?: number;
  }>;
  color?: string;
  fillOpacity?: number;
  strokeWidth?: number;
}

export const RadarChart: React.FC<RadarChartProps> = ({ 
  data, 
  color = '#8B5CF6',
  fillOpacity = 0.6,
  strokeWidth = 2
}) => {
  const chartData = data.map(item => ({
    subject: item.subject,
    value: item.value,
    fullMark: item.fullMark || 100
  }));

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsRadarChart data={chartData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <PolarGrid gridType="polygon" />
          <PolarAngleAxis 
            dataKey="subject" 
            tick={{ fontSize: 12, fill: '#374151' }}
          />
          <PolarRadiusAxis 
            domain={[0, 'dataMax']} 
            tick={{ fontSize: 10, fill: '#6B7280' }}
            tickCount={5}
          />
          <Radar
            name="Skills"
            dataKey="value"
            stroke={color}
            fill={color}
            fillOpacity={fillOpacity}
            strokeWidth={strokeWidth}
            dot={{ r: 4, fill: color }}
          />
          <Tooltip 
            formatter={(value, name) => [value, 'Score']}
            labelFormatter={(label) => `Skill: ${label}`}
          />
        </RechartsRadarChart>
      </ResponsiveContainer>
    </div>
  );
};