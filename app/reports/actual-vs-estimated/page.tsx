'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Breadcrumb from '@/components/Breadcrumb';

interface WorkOrderReport {
  id: string;
  woNumber: string;
  customerName: string;
  status: string;
  priority: string | null;
  createdAt: string;
  estimateMinutes: number;
  actualMinutes: number;
  varianceMinutes: number;
  variancePercent: number;
  efficiency: number;
  lineItemsCount: number;
}

interface ReportSummary {
  totalWorkOrders: number;
  totalEstimateMinutes: number;
  totalActualMinutes: number;
  totalVarianceMinutes: number;
  overestimatedCount: number;
  underestimatedCount: number;
  onTargetCount: number;
  averageEfficiency: string;
}

export default function ActualVsEstimatedPage() {
  const router = useRouter();
  const [report, setReport] = useState<WorkOrderReport[]>([]);
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchReport();
  }, [startDate, endDate, statusFilter]);

  const fetchReport = async () => {
    try {
      const params = new URLSearchParams();
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
      if (statusFilter) params.set('status', statusFilter);

      const res = await fetch(`/api/reports/actual-vs-estimated?${params.toString()}`);

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

  const getVarianceColor = (variance: number) => {
    if (variance === 0) return 'text-gray-900';
    if (variance < 0) return 'text-green-600'; // Under estimate = good
    return 'text-red-600'; // Over estimate = bad
  };

  const getEfficiencyBadge = (efficiency: number) => {
    if (efficiency <= 90) {
      return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Excellent</span>;
    } else if (efficiency <= 110) {
      return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">Good</span>;
    } else if (efficiency <= 130) {
      return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">Fair</span>;
    } else {
      return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">Poor</span>;
    }
  };

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
            { label: 'Actual vs Estimated' },
          ]}
        />

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Actual vs Estimated Report</h1>
          <p className="text-sm md:text-base text-gray-600 mt-1">
            Compare estimated time vs actual tracked time for all work orders
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input-field"
              >
                <option value="">All Statuses</option>
                <option value="OPEN">Open</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="ON_HOLD_PARTS">On Hold - Parts</option>
                <option value="ON_HOLD_DELAY">On Hold - Delay</option>
                <option value="QC">QC</option>
                <option value="READY_TO_BILL">Ready to Bill</option>
                <option value="CLOSED">Closed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-sm text-gray-600">Total Work Orders</div>
              <div className="text-2xl md:text-3xl font-bold text-gray-900">{summary.totalWorkOrders}</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-sm text-gray-600">Avg Efficiency</div>
              <div className="text-2xl md:text-3xl font-bold text-blue-600">{summary.averageEfficiency}%</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-sm text-gray-600">Total Variance</div>
              <div className={`text-2xl md:text-3xl font-bold ${getVarianceColor(summary.totalVarianceMinutes)}`}>
                {formatMinutes(summary.totalVarianceMinutes)}
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-sm text-gray-600">Accuracy</div>
              <div className="text-sm mt-1">
                <div className="flex justify-between">
                  <span className="text-green-600">Under: {summary.overestimatedCount}</span>
                  <span className="text-red-600">Over: {summary.underestimatedCount}</span>
                </div>
                <div className="text-gray-500">On Target: {summary.onTargetCount}</div>
              </div>
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
                    WO #
                  </th>
                  <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden md:table-cell">
                    Customer
                  </th>
                  <th className="px-3 md:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Estimated
                  </th>
                  <th className="px-3 md:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Actual
                  </th>
                  <th className="px-3 md:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Variance
                  </th>
                  <th className="px-3 md:px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase hidden lg:table-cell">
                    Efficiency
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {report.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500 text-sm">
                      No work orders found for the selected filters
                    </td>
                  </tr>
                ) : (
                  report.map((wo) => (
                    <tr key={wo.id} className="hover:bg-gray-50">
                      <td className="px-3 md:px-6 py-4 whitespace-nowrap">
                        <Link
                          href={`/work-orders/${wo.id}`}
                          className="text-xs md:text-sm font-medium text-blue-600 hover:text-blue-800"
                        >
                          {wo.woNumber}
                        </Link>
                        <div className="text-xs text-gray-500 md:hidden">{wo.customerName}</div>
                      </td>
                      <td className="px-3 md:px-6 py-4 hidden md:table-cell">
                        <div className="text-sm text-gray-900">{wo.customerName}</div>
                      </td>
                      <td className="px-3 md:px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                        {Math.floor(wo.estimateMinutes / 60)}h {wo.estimateMinutes % 60}m
                      </td>
                      <td className="px-3 md:px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                        {Math.floor(wo.actualMinutes / 60)}h {wo.actualMinutes % 60}m
                      </td>
                      <td className="px-3 md:px-6 py-4 whitespace-nowrap text-right">
                        <div className={`text-sm font-semibold ${getVarianceColor(wo.varianceMinutes)}`}>
                          {formatMinutes(wo.varianceMinutes)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {wo.variancePercent > 0 ? '+' : ''}{wo.variancePercent}%
                        </div>
                      </td>
                      <td className="px-3 md:px-6 py-4 text-center hidden lg:table-cell">
                        {getEfficiencyBadge(wo.efficiency)}
                        <div className="text-xs text-gray-500 mt-1">{wo.efficiency}%</div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Total Count */}
        <div className="mt-4 text-sm text-gray-600">
          Showing {report.length} work order{report.length !== 1 ? 's' : ''}
        </div>
      </div>
    </div>
  );
}
