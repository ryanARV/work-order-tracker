'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Breadcrumb from '@/components/Breadcrumb';

interface TechReport {
  id: string;
  name: string;
  email: string;
  totalTimeHours: number;
  totalTimeMinutes: number;
  totalTimeEntries: number;
  approvedTimeEntries: number;
  pendingTimeEntries: number;
  uniqueWorkOrders: number;
  uniqueLineItems: number;
  totalEstimateMinutes: number;
  totalActualMinutes: number;
  efficiency: number;
  varianceMinutes: number;
}

interface ReportSummary {
  totalTechs: number;
  totalTimeHours: string;
  totalTimeEntries: number;
  averageEfficiency: string;
  mostEfficient: {
    name: string;
    efficiency: string;
  } | null;
  mostProductive: {
    name: string;
    hours: number;
  } | null;
}

export default function TechPerformancePage() {
  const router = useRouter();
  const [report, setReport] = useState<TechReport[]>([]);
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortBy, setSortBy] = useState<'hours' | 'efficiency'>('hours');

  useEffect(() => {
    fetchReport();
  }, [startDate, endDate]);

  const fetchReport = async () => {
    try {
      const params = new URLSearchParams();
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);

      const res = await fetch(`/api/reports/tech-performance?${params.toString()}`);

      if (!res.ok) {
        if (res.status === 401) {
          router.push('/login');
          return;
        }
        throw new Error('Failed to fetch report');
      }

      const data = await res.json();
      setReport(data.report || []);
      setSummary(data.summary || null);
    } catch (error) {
      console.error('Error fetching report:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatMinutes = (minutes: number) => {
    const hours = Math.floor(Math.abs(minutes) / 60);
    const mins = Math.abs(minutes) % 60;
    const sign = minutes < 0 ? '-' : '+';
    return `${sign}${hours}h ${mins}m`;
  };

  const getEfficiencyBadge = (efficiency: number) => {
    if (efficiency <= 90) {
      return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Excellent</span>;
    } else if (efficiency <= 110) {
      return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">Good</span>;
    } else if (efficiency <= 130) {
      return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">Fair</span>;
    } else {
      return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">Needs Improvement</span>;
    }
  };

  const sortedReport = [...report].sort((a, b) => {
    if (sortBy === 'hours') {
      return b.totalTimeHours - a.totalTimeHours;
    } else {
      return a.efficiency - b.efficiency; // Lower is better
    }
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-2 sm:p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <Breadcrumb
          items={[
            { label: 'Reports', href: '/reports' },
            { label: 'Tech Performance' },
          ]}
        />

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Technician Performance Report</h1>
          <p className="text-sm md:text-base text-gray-600 mt-1">
            Track individual technician productivity and efficiency
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'hours' | 'efficiency')}
                className="input-field"
              >
                <option value="hours">Most Hours Worked</option>
                <option value="efficiency">Best Efficiency</option>
              </select>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-sm text-gray-600">Total Technicians</div>
              <div className="text-2xl md:text-3xl font-bold text-gray-900">{summary.totalTechs}</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-sm text-gray-600">Total Hours</div>
              <div className="text-2xl md:text-3xl font-bold text-blue-600">{summary.totalTimeHours}h</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-sm text-gray-600">Avg Efficiency</div>
              <div className="text-2xl md:text-3xl font-bold text-green-600">{summary.averageEfficiency}%</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-sm text-gray-600">Top Performer</div>
              {summary.mostEfficient ? (
                <div>
                  <div className="text-sm font-medium text-gray-900 truncate">{summary.mostEfficient.name}</div>
                  <div className="text-xs text-gray-500">{summary.mostEfficient.efficiency}% efficiency</div>
                </div>
              ) : (
                <div className="text-sm text-gray-500">N/A</div>
              )}
            </div>
          </div>
        )}

        {/* Report Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Technician
                  </th>
                  <th className="px-3 md:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Hours
                  </th>
                  <th className="px-3 md:px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase hidden md:table-cell">
                    Work Orders
                  </th>
                  <th className="px-3 md:px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase hidden lg:table-cell">
                    Time Entries
                  </th>
                  <th className="px-3 md:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">
                    Variance
                  </th>
                  <th className="px-3 md:px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Efficiency
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedReport.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500 text-sm">
                      No technician data found for the selected period
                    </td>
                  </tr>
                ) : (
                  sortedReport.map((tech, index) => (
                    <tr key={tech.id} className="hover:bg-gray-50">
                      <td className="px-3 md:px-6 py-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                            {index + 1}
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">{tech.name}</div>
                            <div className="text-xs text-gray-500 hidden md:block">{tech.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 md:px-6 py-4 whitespace-nowrap text-right">
                        <div className="text-sm font-semibold text-gray-900">{tech.totalTimeHours.toFixed(1)}h</div>
                        <div className="text-xs text-gray-500">
                          {Math.floor(tech.totalTimeMinutes / 60)}h {tech.totalTimeMinutes % 60}m
                        </div>
                      </td>
                      <td className="px-3 md:px-6 py-4 text-center text-sm text-gray-900 hidden md:table-cell">
                        <div>{tech.uniqueWorkOrders} WOs</div>
                        <div className="text-xs text-gray-500">{tech.uniqueLineItems} tasks</div>
                      </td>
                      <td className="px-3 md:px-6 py-4 text-center hidden lg:table-cell">
                        <div className="text-sm text-gray-900">{tech.totalTimeEntries}</div>
                        <div className="text-xs text-green-600">{tech.approvedTimeEntries} approved</div>
                        {tech.pendingTimeEntries > 0 && (
                          <div className="text-xs text-orange-600">{tech.pendingTimeEntries} pending</div>
                        )}
                      </td>
                      <td className="px-3 md:px-6 py-4 whitespace-nowrap text-right hidden sm:table-cell">
                        <div className={`text-sm font-semibold ${tech.varianceMinutes < 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatMinutes(tech.varianceMinutes)}
                        </div>
                        <div className="text-xs text-gray-500">
                          Est: {Math.floor(tech.totalEstimateMinutes / 60)}h
                        </div>
                      </td>
                      <td className="px-3 md:px-6 py-4 text-center">
                        {getEfficiencyBadge(tech.efficiency)}
                        <div className="text-xs text-gray-500 mt-1">{tech.efficiency.toFixed(1)}%</div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">Efficiency Rating Guide</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
            <div><span className="font-medium">Excellent:</span> ≤90% (faster than estimate)</div>
            <div><span className="font-medium">Good:</span> 90-110% (on target)</div>
            <div><span className="font-medium">Fair:</span> 110-130% (slightly over)</div>
            <div><span className="font-medium">Needs Improvement:</span> &gt;130% (significantly over)</div>
          </div>
          <p className="text-xs text-blue-700 mt-2">
            <strong>Note:</strong> Lower efficiency percentage is better (completing work faster than estimated).
          </p>
        </div>

        {/* Total Count */}
        <div className="mt-4 text-sm text-gray-600">
          Showing {sortedReport.length} technician{sortedReport.length !== 1 ? 's' : ''}
        </div>
      </div>
    </div>
  );
}
