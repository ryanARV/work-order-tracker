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
        return 'bg-gray-100 text-gray-800';
      case 'PENDING':
        return 'bg-slate-100 text-slate-800';
      case 'OPEN':
        return 'bg-blue-100 text-blue-800';
      case 'IN_PROGRESS':
        return 'bg-yellow-100 text-yellow-800';
      case 'ON_HOLD_PARTS':
        return 'bg-orange-100 text-orange-800';
      case 'ON_HOLD_DELAY':
        return 'bg-amber-100 text-amber-800';
      case 'READY_TO_BILL':
        return 'bg-purple-100 text-purple-800';
      case 'QC':
        return 'bg-indigo-100 text-indigo-800';
      case 'CLOSED':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatStatus = (status: string) => {
    return status.replace(/_/g, ' ');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Work Orders</h1>
          {user.role === 'ADMIN' && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary"
            >
              + Create Work Order
            </button>
          )}
        </div>

        {/* Search and Filters */}
        <div className="bg-white shadow-md rounded-lg p-4 mb-6">
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
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No work orders found</p>
          </div>
        ) : (
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    WO Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Line Items
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {workOrders.map((wo) => {
                  const doneCount = wo.lineItems.filter(
                    (li) => li.status === 'DONE'
                  ).length;
                  const totalCount = wo.lineItems.length;

                  return (
                    <tr
                      key={wo.id}
                      onClick={() => router.push(`/work-orders/${wo.id}`)}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-blue-600">
                          {wo.woNumber}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {wo.customer.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                            wo.status
                          )}`}
                        >
                          {formatStatus(wo.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {wo.priority ? (
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              wo.priority === 'HIGH'
                                ? 'bg-red-100 text-red-800'
                                : wo.priority === 'MEDIUM'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-green-100 text-green-800'
                            }`}
                          >
                            {wo.priority}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {doneCount} / {totalCount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
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
