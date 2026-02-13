'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DailyHoursChartProps {
  data: Array<{
    day: string;
    hours: number;
  }>;
}

export default function DailyHoursChart({ data }: DailyHoursChartProps) {
  return (
    <div className="bg-white rounded-lg shadow p-4 md:p-6">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">Weekly Hours Breakdown</h3>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis
            dataKey="day"
            tick={{ fontSize: 12 }}
            stroke="#6B7280"
          />
          <YAxis
            tick={{ fontSize: 12 }}
            stroke="#6B7280"
            label={{ value: 'Hours', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E5E7EB',
              borderRadius: '6px',
              fontSize: '12px'
            }}
            formatter={(value) => [`${value || 0} hours`, 'Hours']}
          />
          <Bar dataKey="hours" fill="#3B82F6" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
