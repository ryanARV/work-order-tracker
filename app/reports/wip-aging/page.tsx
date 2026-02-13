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
  ageInDays: number;
  ageCategory: 'NEW' | 'RECENT' | 'AGING' | 'STALE' | 'CRITICAL';
  progressPercent: number;
  lineItemsDone: number;
  lineItemsTotal: number;
}

interface AgingStats {
  NEW: number;
  RECENT: number;
  AGING: number;
  STALE: number;
  CRITICAL: number;
}

interface ReportSummary {
  totalWIP: number;
  averageAge: string;
  oldestWO: {
    woNumber: string;
    ageInDays: number;
  } | null;
  agingStats: AgingStats;
}

export default function WIPAgingPage() {
  const router = useRouter();
  const [report, setReport] = useState<WorkOrderReport[]>([]);
  const [byStatus, setByStatus] = useState<Record<string, WorkOrderReport[]>>({});
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  useEffect(() => {
    fetchReport();
  }, []);

  const fetchReport = async () => {
    try {
      const res = await fetch('/api/reports/wip-aging');

      if (!res.ok) {
        if (res.status === 401) {
          router.push('/login');
          return;
        }
        throw new Error('Failed to fetch report');
      }

      const data = await res.json();
      setReport(data.report || []);
      setByStatus(data.byStatus || {});
      setSummary(data.summary || null);
    } catch (error) {
      console.error('Error fetching report:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAgeCategoryBadge = (category: string) => {
    const styles: Record<string, string> = {
      NEW: 'bg-green-100 text-green-800',
      RECENT: 'bg-blue-100 text-blue-800',
      AGING: 'bg-yellow-100 text-yellow-800',
      STALE: 'bg-orange-100 text-orange-800',
      CRITICAL: 'bg-red-100 text-red-800',
    };

    const labels: Record<string, string> = {
      NEW: '0-2 days',
      RECENT: '3-7 days',
      AGING: '8-14 days',
      STALE: '15-30 days',
      CRITICAL: '30+ days',
    };

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${styles[category] || 'bg-gray-100 text-gray-800'}`}>
        {labels[category] || category}
      </span>
    );
  };

  const getPriorityBadge = (priority: string | null) => {
    if (!priority) return null;

    const styles: Record<string, string> = {
      HIGH: 'bg-red-100 text-red-800',
      MEDIUM: 'bg-yellow-100 text-yellow-800',
      LOW: 'bg-green-100 text-green-800',
    };

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${styles[priority.toUpperCase()] || 'bg-gray-100 text-gray-800'}`}>
        {priority}
      </span>
    );
  };

  const filteredReport = selectedStatus === 'all' ? report : (byStatus[selectedStatus] || []);

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
            { label: 'WIP Aging' },
          ]}
        />

        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">WIP Aging Report</h1>
            <p className="text-sm md:text-base text-gray-600 mt-1">
              Track how long work orders have been in progress
            </p>
          </div>
          <button
            onClick={() => window.open('/api/reports/wip-aging/export', '_blank')}
            className="btn-secondary whitespace-nowrap text-sm"
          >
            📥 Export CSV
          </button>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-sm text-gray-600">Total WIP</div>
              <div className="text-2xl md:text-3xl font-bold text-gray-900">{summary.totalWIP}</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-sm text-gray-600">Avg Age</div>
              <div className="text-2xl md:text-3xl font-bold text-blue-600">{summary.averageAge} days</div>
            </div>
            <div className="bg-green-100 p-4 rounded-lg shadow">
              <div className="text-sm text-green-800 font-medium">New</div>
              <div className="text-2xl md:text-3xl font-bold text-green-900">{summary.agingStats.NEW}</div>
            </div>
            <div className="bg-blue-100 p-4 rounded-lg shadow">
              <div className="text-sm text-blue-800 font-medium">Recent</div>
              <div className="text-2xl md:text-3xl font-bold text-blue-900">{summary.agingStats.RECENT}</div>
            </div>
            <div className="bg-yellow-100 p-4 rounded-lg shadow">
              <div className="text-sm text-yellow-800 font-medium">Aging</div>
              <div className="text-2xl md:text-3xl font-bold text-yellow-900">{summary.agingStats.AGING}</div>
            </div>
            <div className="bg-red-100 p-4 rounded-lg shadow">
              <div className="text-sm text-red-800 font-medium">Critical</div>
              <div className="text-2xl md:text-3xl font-bold text-red-900">
                {summary.agingStats.STALE + summary.agingStats.CRITICAL}
              </div>
            </div>
          </div>
        )}

        {/* Oldest WO Alert */}
        {summary?.oldestWO && summary.oldestWO.ageInDays > 14 && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-orange-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-orange-800">Attention Needed</h3>
                <div className="mt-1 text-sm text-orange-700">
                  Work order <strong>{summary.oldestWO.woNumber}</strong> has been in progress for <strong>{summary.oldestWO.ageInDays} days</strong>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Status Filter */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Status</label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedStatus('all')}
              className={`px-3 py-1 rounded-lg text-sm font-medium ${
                selectedStatus === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All ({report.length})
            </button>
            {Object.keys(byStatus).map((status) => (
              <button
                key={status}
                onClick={() => setSelectedStatus(status)}
                className={`px-3 py-1 rounded-lg text-sm font-medium ${
                  selectedStatus === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status.replace(/_/g, ' ')} ({byStatus[status].length})
              </button>
            ))}
          </div>
        </div>

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
                  <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden lg:table-cell">
                    Status
                  </th>
                  <th className="px-3 md:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Age
                  </th>
                  <th className="px-3 md:px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">
                    Progress
                  </th>
                  <th className="px-3 md:px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Category
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredReport.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500 text-sm">
                      No work orders found
                    </td>
                  </tr>
                ) : (
                  filteredReport.map((wo) => (
                    <tr key={wo.id} className="hover:bg-gray-50">
                      <td className="px-3 md:px-6 py-4 whitespace-nowrap">
                        <Link
                          href={`/work-orders/${wo.id}`}
                          className="text-xs md:text-sm font-medium text-blue-600 hover:text-blue-800"
                        >
                          {wo.woNumber}
                        </Link>
                        <div className="text-xs text-gray-500 md:hidden">{wo.customerName}</div>
                        {wo.priority && <div className="mt-1">{getPriorityBadge(wo.priority)}</div>}
                      </td>
                      <td className="px-3 md:px-6 py-4 hidden md:table-cell">
                        <div className="text-sm text-gray-900">{wo.customerName}</div>
                      </td>
                      <td className="px-3 md:px-6 py-4 hidden lg:table-cell">
                        <div className="text-sm text-gray-900">{wo.status.replace(/_/g, ' ')}</div>
                      </td>
                      <td className="px-3 md:px-6 py-4 whitespace-nowrap text-right">
                        <div className="text-sm font-semibold text-gray-900">{wo.ageInDays} days</div>
                        <div className="text-xs text-gray-500">
                          {new Date(wo.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-3 md:px-6 py-4 hidden sm:table-cell">
                        <div className="flex items-center justify-center">
                          <div className="w-full max-w-xs">
                            <div className="bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{ width: `${wo.progressPercent}%` }}
                              />
                            </div>
                            <div className="text-xs text-gray-600 text-center mt-1">
                              {wo.lineItemsDone}/{wo.lineItemsTotal} ({wo.progressPercent}%)
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 md:px-6 py-4 text-center">
                        {getAgeCategoryBadge(wo.ageCategory)}
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
          Showing {filteredReport.length} work order{filteredReport.length !== 1 ? 's' : ''}
        </div>
      </div>
    </div>
  );
}
