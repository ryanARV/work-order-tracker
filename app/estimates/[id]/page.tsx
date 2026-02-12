'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Breadcrumb from '@/components/Breadcrumb';

interface Estimate {
  id: string;
  estimateNumber: string;
  status: string;
  priority: string | null;
  validUntil: string | null;
  warrantyAuthorizationNumber: string | null;
  createdAt: string;
  customer: {
    id: string;
    name: string;
    contactEmail: string | null;
    contactPhone: string | null;
  };
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
  lineItems: Array<{
    id: string;
    description: string;
    complaint: string | null;
    correction: string | null;
    billType: string | null;
    estimateMinutes: number | null;
    laborRate: number | null;
    sortOrder: number;
  }>;
  partItems: Array<{
    id: string;
    partId: string | null;
    description: string;
    quantity: number;
    unitCost: number;
    unitPrice: number;
    billType: string | null;
    part: {
      partNumber: string;
      quantityOnHand: number;
      quantityReserved: number;
    } | null;
  }>;
  comments: Array<{
    id: string;
    content: string;
    createdAt: string;
    user: {
      id: string;
      name: string;
      email: string;
    };
  }>;
  convertedToWorkOrder: {
    id: string;
    woNumber: string;
    status: string;
  } | null;
}

export default function EstimateDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'details' | 'parts' | 'comments'>('details');
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    if (id) {
      fetchEstimate();
    }
  }, [id]);

  const fetchEstimate = async () => {
    try {
      const res = await fetch(`/api/estimates/${id}`);
      if (!res.ok) {
        if (res.status === 401) {
          router.push('/login');
          return;
        }
        throw new Error('Failed to fetch estimate');
      }
      const data = await res.json();
      setEstimate(data.estimate);
    } catch (error) {
      console.error('Error fetching estimate:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!estimate) return;

    try {
      const res = await fetch(`/api/estimates/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        fetchEstimate();
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleConvert = async () => {
    if (!estimate) return;

    if (!confirm('Convert this estimate to a work order? This will reserve inventory for catalog parts.')) {
      return;
    }

    try {
      const res = await fetch(`/api/estimates/${id}/convert`, {
        method: 'POST',
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Failed to convert estimate');
        return;
      }

      const data = await res.json();
      alert(`Successfully converted to ${data.workOrder.woNumber}`);
      router.push(`/work-orders/${data.workOrder.id}`);
    } catch (error) {
      console.error('Error converting estimate:', error);
      alert('Failed to convert estimate');
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmittingComment(true);
    try {
      const res = await fetch(`/api/estimates/${id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment }),
      });

      if (res.ok) {
        setNewComment('');
        fetchEstimate();
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setSubmittingComment(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      DRAFT: 'bg-gray-100 text-gray-800',
      PENDING_APPROVAL: 'bg-yellow-100 text-yellow-800',
      APPROVED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800',
      CONVERTED: 'bg-blue-100 text-blue-800',
    };

    const labels: Record<string, string> = {
      DRAFT: 'Draft',
      PENDING_APPROVAL: 'Pending Approval',
      APPROVED: 'Approved',
      REJECTED: 'Rejected',
      CONVERTED: 'Converted',
    };

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {labels[status] || status}
      </span>
    );
  };

  const formatMinutes = (minutes: number | null) => {
    if (!minutes) return '0h 0m';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const calculateTotalLabor = () => {
    if (!estimate) return 0;
    return estimate.lineItems.reduce((sum, item) => {
      const minutes = item.estimateMinutes || 0;
      const rate = Number(item.laborRate) || 0;
      return sum + (minutes / 60) * rate;
    }, 0);
  };

  const calculateTotalParts = () => {
    if (!estimate) return 0;
    return estimate.partItems.reduce((sum, item) => sum + item.quantity * Number(item.unitPrice), 0);
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

  if (!estimate) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <p className="text-gray-500">Estimate not found</p>
            <Link href="/estimates" className="text-blue-600 hover:text-blue-800 mt-4 inline-block">
              Back to Estimates
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-2 sm:p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-4 md:mb-6">
          <Breadcrumb
            items={[
              { label: 'Estimates', href: '/estimates' },
              { label: estimate.estimateNumber },
            ]}
          />
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{estimate.estimateNumber}</h1>
              <p className="text-sm md:text-base text-gray-600 mt-1">{estimate.customer.name}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {getStatusBadge(estimate.status)}
              {estimate.priority && (
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  estimate.priority === 'HIGH' ? 'bg-red-100 text-red-800' :
                  estimate.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {estimate.priority}
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            {estimate.status === 'DRAFT' && (
              <button
                onClick={() => handleStatusChange('PENDING_APPROVAL')}
                className="btn-primary text-sm"
              >
                Submit for Approval
              </button>
            )}
            {estimate.status === 'PENDING_APPROVAL' && (
              <>
                <button
                  onClick={() => handleStatusChange('APPROVED')}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
                >
                  Approve
                </button>
                <button
                  onClick={() => handleStatusChange('REJECTED')}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
                >
                  Reject
                </button>
              </>
            )}
            {estimate.status === 'APPROVED' && !estimate.convertedToWorkOrder && (
              <button
                onClick={handleConvert}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
              >
                Convert to Work Order
              </button>
            )}
            {estimate.convertedToWorkOrder && (
              <Link
                href={`/work-orders/${estimate.convertedToWorkOrder.id}`}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium inline-block"
              >
                View Work Order {estimate.convertedToWorkOrder.woNumber}
              </Link>
            )}
          </div>
        </div>

        {/* Totals Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Labor</div>
            <div className="text-xl md:text-2xl font-bold text-gray-900">
              {formatCurrency(calculateTotalLabor())}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Parts</div>
            <div className="text-xl md:text-2xl font-bold text-gray-900">
              {formatCurrency(calculateTotalParts())}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Total</div>
            <div className="text-xl md:text-2xl font-bold text-blue-600">
              {formatCurrency(calculateTotalLabor() + calculateTotalParts())}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Created</div>
            <div className="text-sm md:text-base font-medium text-gray-900">
              {new Date(estimate.createdAt).toLocaleDateString()}
            </div>
            <div className="text-xs text-gray-500">{estimate.createdBy.name}</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-4 md:space-x-8 overflow-x-auto">
              <button
                onClick={() => setActiveTab('details')}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'details'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Line Items ({estimate.lineItems.length})
              </button>
              <button
                onClick={() => setActiveTab('parts')}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'parts'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Parts ({estimate.partItems.length})
              </button>
              <button
                onClick={() => setActiveTab('comments')}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'comments'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Comments ({estimate.comments.length})
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow">
          {activeTab === 'details' && (
            <div className="p-4 md:p-6">
              <h3 className="text-lg font-semibold mb-4">Line Items</h3>
              {estimate.lineItems.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No line items yet</p>
              ) : (
                <div className="space-y-4">
                  {estimate.lineItems.map((item) => (
                    <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-gray-900">{item.description}</h4>
                        <span className="text-sm text-gray-600">{formatMinutes(item.estimateMinutes)}</span>
                      </div>
                      {item.complaint && (
                        <div className="text-sm text-gray-600 mb-1">
                          <span className="font-medium">Complaint:</span> {item.complaint}
                        </div>
                      )}
                      {item.correction && (
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">Correction:</span> {item.correction}
                        </div>
                      )}
                      {item.laborRate && (
                        <div className="text-sm text-gray-600 mt-2">
                          Rate: {formatCurrency(Number(item.laborRate))}/hr = {formatCurrency((item.estimateMinutes || 0) / 60 * Number(item.laborRate))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'parts' && (
            <div className="p-4 md:p-6">
              <h3 className="text-lg font-semibold mb-4">Parts</h3>
              {estimate.partItems.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No parts yet</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Part</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Qty</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">Unit Price</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {estimate.partItems.map((item) => (
                        <tr key={item.id}>
                          <td className="px-4 py-3">
                            <div className="text-sm font-medium text-gray-900">
                              {item.part?.partNumber || 'Custom'}
                            </div>
                            <div className="text-xs text-gray-500">{item.description}</div>
                          </td>
                          <td className="px-4 py-3 text-right text-sm">{item.quantity}</td>
                          <td className="px-4 py-3 text-right text-sm hidden sm:table-cell">
                            {formatCurrency(Number(item.unitPrice))}
                          </td>
                          <td className="px-4 py-3 text-right text-sm font-medium">
                            {formatCurrency(item.quantity * Number(item.unitPrice))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'comments' && (
            <div className="p-4 md:p-6">
              <h3 className="text-lg font-semibold mb-4">Comments</h3>

              {/* Add Comment Form */}
              <form onSubmit={handleAddComment} className="mb-6">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="input-field mb-2"
                  rows={3}
                />
                <button
                  type="submit"
                  disabled={submittingComment || !newComment.trim()}
                  className="btn-primary disabled:opacity-50"
                >
                  {submittingComment ? 'Adding...' : 'Add Comment'}
                </button>
              </form>

              {/* Comments List */}
              {estimate.comments.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No comments yet</p>
              ) : (
                <div className="space-y-4">
                  {estimate.comments.map((comment) => (
                    <div key={comment.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="font-medium text-gray-900">{comment.user.name}</div>
                          <div className="text-xs text-gray-500">{comment.user.email}</div>
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(comment.createdAt).toLocaleString()}
                        </div>
                      </div>
                      <p className="text-gray-700 whitespace-pre-wrap">{comment.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
