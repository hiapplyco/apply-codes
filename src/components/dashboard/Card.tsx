
import { cn } from "@/lib/utils";
import { CardProps } from "./types";
import { BaseCard } from "./BaseCard";
import { useEffect, useState } from "react";
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, 
  ResponsiveContainer, XAxis, YAxis, Tooltip, Cell
} from "recharts";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export function DashboardCard({ data, onExpand, onPin }: CardProps) {
  const { config, content } = data;
  const [chartData, setChartData] = useState<Array<{ name: string; value: number; color?: string }>>([]);

  useEffect(() => {
    // Process data based on card type
    if (config.type === 'pie' || config.type === 'bar' || config.type === 'line') {
      const processedData = Array.isArray(content[config.dataKeys[0]]) 
        ? content[config.dataKeys[0]] 
        : Object.entries(content[config.dataKeys[0]]).map(([name, value]) => ({
            name,
            value: typeof value === 'number' ? value : 0
          }));
      setChartData(processedData);
    }
  }, [content, config]);

  const renderChart = () => {
    switch (config.type) {
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        );
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#8884d8">
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#8884d8" />
            </LineChart>
          </ResponsiveContainer>
        );
      default:
        return (
          <pre className="text-sm overflow-auto max-h-[200px]">
            {JSON.stringify(content, null, 2)}
          </pre>
        );
    }
  };
  
  return (
    <BaseCard 
      title={config.title}
      size={config.size}
      onExpand={onExpand}
      onPin={onPin}
    >
      {renderChart()}
    </BaseCard>
  );
}
