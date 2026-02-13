'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

interface TeamPerformanceChartProps {
  data: Array<{
    name: string;
    efficiency: number;
  }>;
}

export default function TeamPerformanceChart({ data }: TeamPerformanceChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Team Efficiency</h3>
        <p className="text-sm text-gray-500 text-center py-8">No performance data available</p>
      </div>
    );
  }

  const getBarColor = (efficiency: number) => {
    if (efficiency <= 100) return '#10B981'; // green - excellent
    if (efficiency <= 120) return '#F59E0B'; // yellow - acceptable
    return '#EF4444'; // red - needs improvement
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 md:p-6">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">Team Efficiency</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 12 }}
            stroke="#6B7280"
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis
            tick={{ fontSize: 12 }}
            stroke="#6B7280"
            label={{ value: 'Efficiency %', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E5E7EB',
              borderRadius: '6px',
              fontSize: '12px'
            }}
            formatter={(value) => [`${(Number(value) || 0).toFixed(1)}%`, 'Efficiency']}
          />
          <ReferenceLine y={100} stroke="#6B7280" strokeDasharray="3 3" label="Target" />
          <Bar
            dataKey="efficiency"
            radius={[4, 4, 0, 0]}
            fill="#3B82F6"
          >
            {data.map((entry, index) => (
              <Bar key={`bar-${index}`} fill={getBarColor(entry.efficiency)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <p className="text-xs text-gray-500 mt-2 text-center">
        Lower is better • Target: 100% • Excellent: &lt;100% • Good: 100-120% • Needs improvement: &gt;120%
      </p>
    </div>
  );
}
