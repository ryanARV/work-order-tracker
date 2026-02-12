'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import CreateWorkOrderModal from '@/components/CreateWorkOrderModal';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'TECH';
}

interface WorkOrder {
  id: string;
  woNumber: string;
  status: string;
  priority: string | null;
  createdAt: string;
  customer: {
    name: string;
  };
  lineItems: Array<{
    id: string;
    description: string;
    status: string;
  }>;
  _count?: {
    timeEntries: number;
  };
}

export default function WorkOrdersPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  const fetchData = async () => {
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (statusFilter) params.append('status', statusFilter);
      if (priorityFilter) params.append('priority', priorityFilter);

      const [userRes, woRes] = await Promise.all([
        fetch('/api/auth/me'),
        fetch(`/api/work-orders?${params.toString()}`),
      ]);

      if (!userRes.ok) {
        router.push('/login');
        return;
      }

      const userData = await userRes.json();
      const woData = await woRes.json();

      setUser(userData.user);
      setWorkOrders(woData.workOrders);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [router, searchQuery, statusFilter, priorityFilter]);

  const handleCreateSuccess = () => {
    setShowCreateModal(false);
    fetchData();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'badge-gray';
      case 'PENDING':
        return 'badge-gray';
      case 'OPEN':
        return 'badge-blue';
      case 'IN_PROGRESS':
        return 'badge-yellow';
      case 'ON_HOLD_PARTS':
        return 'badge-orange';
      case 'ON_HOLD_DELAY':
        return 'badge-orange';
      case 'READY_TO_BILL':
        return 'badge-purple';
      case 'QC':
        return 'badge-blue';
      case 'CLOSED':
        return 'badge-green';
      default:
        return 'badge-gray';
    }
  };

  const formatStatus = (status: string) => {
    return status.replace(/_/g, ' ');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600 font-medium">Loading work orders...</p>
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
          <div>
            <h1 className="section-header">Work Orders</h1>
            <p className="section-subheader">Manage and track all work orders</p>
          </div>
          {user.role === 'ADMIN' && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary"
            >
              <span className="text-lg mr-2">+</span> Create Work Order
            </button>
          )}
        </div>

        {/* Search and Filters */}
        <div className="card mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <input
                type="text"
                placeholder="Search WO# or customer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
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
                <option value="PENDING">Pending</option>
                <option value="OPEN">Open</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="ON_HOLD_PARTS">On Hold - Parts</option>
                <option value="ON_HOLD_DELAY">On Hold - Delay</option>
                <option value="READY_TO_BILL">Ready to Bill</option>
                <option value="QC">QC</option>
                <option value="CLOSED">Closed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="input-field"
              >
                <option value="">All Priorities</option>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>
          </div>
          {(searchQuery || statusFilter || priorityFilter) && (
            <div className="mt-3">
              <button
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('');
                  setPriorityFilter('');
                }}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Clear All Filters
              </button>
            </div>
          )}
        </div>

        {workOrders.length === 0 ? (
          <div className="card text-center py-16">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">📋</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No work orders found</h3>
            <p className="text-gray-500 mb-6">
              {searchQuery || statusFilter || priorityFilter
                ? 'Try adjusting your filters to see more results'
                : 'Get started by creating your first work order'}
            </p>
            {user.role === 'ADMIN' && !searchQuery && !statusFilter && !priorityFilter && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn-primary"
              >
                <span className="text-lg mr-2">+</span> Create Work Order
              </button>
            )}
          </div>
        ) : (
          <div className="card overflow-hidden p-0">
            <table className="min-w-full">
              <thead className="table-header">
                <tr>
                  <th className="table-cell font-semibold text-xs text-gray-600 uppercase tracking-wider">
                    WO Number
                  </th>
                  <th className="table-cell font-semibold text-xs text-gray-600 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="table-cell font-semibold text-xs text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="table-cell font-semibold text-xs text-gray-600 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="table-cell font-semibold text-xs text-gray-600 uppercase tracking-wider">
                    Line Items
                  </th>
                  <th className="table-cell font-semibold text-xs text-gray-600 uppercase tracking-wider">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {workOrders.map((wo) => {
                  const doneCount = wo.lineItems.filter(
                    (li) => li.status === 'DONE'
                  ).length;
                  const totalCount = wo.lineItems.length;

                  return (
                    <tr
                      key={wo.id}
                      onClick={() => router.push(`/work-orders/${wo.id}`)}
                      className="table-row cursor-pointer"
                    >
                      <td className="table-cell">
                        <div className="font-semibold text-blue-600 hover:text-blue-700">
                          {wo.woNumber}
                        </div>
                      </td>
                      <td className="table-cell">
                        <div className="font-medium">{wo.customer.name}</div>
                      </td>
                      <td className="table-cell">
                        <span className={`badge ${getStatusColor(wo.status)}`}>
                          {formatStatus(wo.status)}
                        </span>
                      </td>
                      <td className="table-cell">
                        {wo.priority ? (
                          <span
                            className={`badge ${
                              wo.priority === 'HIGH'
                                ? 'badge-red'
                                : wo.priority === 'MEDIUM'
                                ? 'badge-yellow'
                                : 'badge-green'
                            }`}
                          >
                            {wo.priority}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="table-cell">
                        <span className="font-medium">
                          {doneCount} / {totalCount}
                        </span>
                      </td>
                      <td className="table-cell text-gray-600">
                        {new Date(wo.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showCreateModal && (
        <CreateWorkOrderModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCreateSuccess}
        />
      )}
    </div>
  );
}
