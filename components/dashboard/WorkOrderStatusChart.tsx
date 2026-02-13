'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface WorkOrderStatusChartProps {
  data: {
    open: number;
    inProgress: number;
    onHold: number;
    qc: number;
    readyToBill: number;
  };
}

const COLORS = {
  open: '#3B82F6',        // blue
  inProgress: '#F59E0B',  // yellow
  onHold: '#F97316',      // orange
  qc: '#8B5CF6',          // purple
  readyToBill: '#10B981'  // green
};

export default function WorkOrderStatusChart({ data }: WorkOrderStatusChartProps) {
  const chartData = [
    { name: 'Open', value: data.open, color: COLORS.open },
    { name: 'In Progress', value: data.inProgress, color: COLORS.inProgress },
    { name: 'On Hold', value: data.onHold, color: COLORS.onHold },
    { name: 'QC', value: data.qc, color: COLORS.qc },
    { name: 'Ready to Bill', value: data.readyToBill, color: COLORS.readyToBill },
  ].filter(item => item.value > 0);

  if (chartData.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Work Order Distribution</h3>
        <p className="text-sm text-gray-500 text-center py-8">No work orders to display</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-4 md:p-6">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">Work Order Distribution</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
