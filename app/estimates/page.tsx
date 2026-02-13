'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'TECH' | 'SERVICE_WRITER' | 'PARTS' | 'MANAGER';
}

interface Estimate {
  id: string;
  estimateNumber: string;
  customer: {
    id: string;
    name: string;
    email: string;
  };
  status: string;
  priority: string | null;
  validUntil: string | null;
  createdAt: string;
  totalLaborMinutes: number;
  totalPartsCost: number;
}

export default function EstimatesPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchData();
  }, [search, statusFilter]);

  const fetchData = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);

      const [userRes, estimatesRes] = await Promise.all([
        fetch('/api/auth/me'),
        fetch(`/api/estimates?${params.toString()}`),
      ]);

      if (!userRes.ok) {
        router.push('/login');
        return;
      }

      if (!estimatesRes.ok) {
        throw new Error('Failed to fetch estimates');
      }

      const userData = await userRes.json();
      const estimatesData = await estimatesRes.json();

      setUser(userData.user);
      setEstimates(estimatesData.estimates || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      DRAFT: 'badge-gray',
      PENDING_APPROVAL: 'badge-yellow',
      APPROVED: 'badge-green',
      REJECTED: 'badge-red',
      CONVERTED: 'badge-blue',
    };

    const labels: Record<string, string> = {
      DRAFT: 'Draft',
      PENDING_APPROVAL: 'Pending',
      APPROVED: 'Approved',
      REJECTED: 'Rejected',
      CONVERTED: 'Converted',
    };

    return (
      <span className={`badge ${styles[status] || 'badge-gray'}`}>
        {labels[status] || status}
      </span>
    );
  };

  const getPriorityBadge = (priority: string | null) => {
    if (!priority) return <span className="text-sm text-gray-400">-</span>;

    const styles: Record<string, string> = {
      HIGH: 'badge-red',
      MEDIUM: 'badge-yellow',
      LOW: 'badge-green',
    };

    return (
      <span className={`badge ${styles[priority.toUpperCase()] || 'badge-gray'}`}>
        {priority}
      </span>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatMinutes = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600 font-medium">Loading estimates...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} />

      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 md:py-8">
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="section-header">Estimates</h1>
            <p className="section-subheader">Create and manage customer estimates</p>
          </div>
          <Link
            href="/estimates/new"
            className="btn-primary whitespace-nowrap"
          >
            <span className="text-lg mr-2">+</span> New Estimate
          </Link>
        </div>

        {/* Filters */}
        <div className="card mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <input
                type="text"
                placeholder="Search by estimate # or customer..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input-field"
              >
                <option value="">All Statuses</option>
                <option value="DRAFT">Draft</option>
                <option value="PENDING_APPROVAL">Pending Approval</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
                <option value="CONVERTED">Converted</option>
              </select>
            </div>
          </div>
          {(search || statusFilter) && (
            <div className="mt-3">
              <button
                onClick={() => {
                  setSearch('');
                  setStatusFilter('');
                }}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Clear All Filters
              </button>
            </div>
          )}
        </div>

        {/* Estimates Table */}
        {estimates.length === 0 ? (
          <div className="card text-center py-16">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">📋</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No estimates found</h3>
            <p className="text-gray-500 mb-6">
              {search || statusFilter
                ? 'Try adjusting your filters to see more results'
                : 'Get started by creating your first estimate'}
            </p>
            {!search && !statusFilter && (
              <Link href="/estimates/new" className="btn-primary">
                <span className="text-lg mr-2">+</span> New Estimate
              </Link>
            )}
          </div>
        ) : (
          <div className="card overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="table-header">
                  <tr>
                    <th className="table-cell font-semibold text-xs text-gray-600 uppercase tracking-wider">
                      Estimate #
                    </th>
                    <th className="table-cell font-semibold text-xs text-gray-600 uppercase tracking-wider hidden md:table-cell">
                      Customer
                    </th>
                    <th className="table-cell font-semibold text-xs text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="table-cell font-semibold text-xs text-gray-600 uppercase tracking-wider hidden sm:table-cell">
                      Priority
                    </th>
                    <th className="table-cell font-semibold text-xs text-gray-600 uppercase tracking-wider text-right hidden lg:table-cell">
                      Labor
                    </th>
                    <th className="table-cell font-semibold text-xs text-gray-600 uppercase tracking-wider text-right hidden lg:table-cell">
                      Parts
                    </th>
                    <th className="table-cell font-semibold text-xs text-gray-600 uppercase tracking-wider text-right">
                      <span className="hidden md:inline">Actions</span>
                      <span className="md:hidden">•</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white">{
                  estimates.map((estimate) => (
                    <tr key={estimate.id} className="table-row">
                      <td className="table-cell">
                        <Link
                          href={`/estimates/${estimate.id}`}
                          className="font-semibold text-blue-600 hover:text-blue-700"
                        >
                          {estimate.estimateNumber}
                        </Link>
                        <div className="text-xs text-gray-500 md:hidden mt-1">
                          {estimate.customer.name}
                        </div>
                      </td>
                      <td className="table-cell hidden md:table-cell">
                        <div className="font-medium">{estimate.customer.name}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{estimate.customer.email}</div>
                      </td>
                      <td className="table-cell">
                        {getStatusBadge(estimate.status)}
                      </td>
                      <td className="table-cell hidden sm:table-cell">
                        {getPriorityBadge(estimate.priority)}
                      </td>
                      <td className="table-cell text-right hidden lg:table-cell">
                        <span className="font-medium">{formatMinutes(estimate.totalLaborMinutes)}</span>
                      </td>
                      <td className="table-cell text-right hidden lg:table-cell">
                        <span className="font-medium">{formatCurrency(estimate.totalPartsCost)}</span>
                      </td>
                      <td className="table-cell text-right">
                        <Link
                          href={`/estimates/${estimate.id}`}
                          className="text-blue-600 hover:text-blue-700 font-medium"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Total Count */}
        {estimates.length > 0 && (
          <div className="mt-4 text-sm text-gray-600 font-medium">
            Showing {estimates.length} {estimates.length === 1 ? 'estimate' : 'estimates'}
          </div>
        )}
      </div>
    </div>
  );
}
