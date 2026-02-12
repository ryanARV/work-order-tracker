'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import AddLineItemModal from '@/components/AddLineItemModal';
import CommentsSection from '@/components/CommentsSection';
import WorkOrderPartsTable from '@/components/WorkOrderPartsTable';
import PartPickerModal from '@/components/PartPickerModal';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'TECH' | 'SERVICE_WRITER' | 'PARTS' | 'MANAGER';
}

interface TimeEntry {
  id: string;
  startTs: string;
  endTs: string | null;
  durationSeconds: number | null;
  notes: string | null;
  pauseReason: string | null;
  approvalState: string;
  user: {
    id: string;
    name: string;
  };
}

interface LineItem {
  id: string;
  description: string;
  complaint: string | null;
  correction: string | null;
  billType: 'CUSTOMER_PAY' | 'WARRANTY' | null;
  billable: boolean;
  estimateMinutes: number | null;
  status: string;
  timeEntries: TimeEntry[];
}

interface WorkOrder {
  id: string;
  woNumber: string;
  status: string;
  priority: string | null;
  createdAt: string;
  customer: {
    name: string;
    billingInfo: string | null;
  };
  lineItems: LineItem[];
}

export default function WorkOrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null);
  const [totals, setTotals] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [showAddLineItemModal, setShowAddLineItemModal] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'lineItems' | 'parts' | 'comments'>('lineItems');
  const [parts, setParts] = useState<any[]>([]);
  const [showPartPicker, setShowPartPicker] = useState(false);

  const fetchData = async () => {
    try {
      const [userRes, woRes, partsRes] = await Promise.all([
        fetch('/api/auth/me'),
        fetch(`/api/work-orders/${id}`),
        fetch(`/api/work-orders/${id}/parts`),
      ]);

      if (!userRes.ok) {
        router.push('/login');
        return;
      }

      const userData = await userRes.json();
      const woData = await woRes.json();

      setUser(userData.user);
      setWorkOrder(woData.workOrder);
      setTotals(woData.totals);

      if (partsRes.ok) {
        const partsData = await partsRes.json();
        setParts(partsData.parts || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleApproveAll = async () => {
    if (!confirm('Approve all time entries for this work order?')) return;

    try {
      const res = await fetch(`/api/work-orders/${id}/approve`, {
        method: 'POST',
      });

      if (res.ok) {
        await fetchData();
        const data = await res.json();
        alert(`Approved ${data.approvedCount} time entries`);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to approve time entries');
      }
    } catch (error) {
      console.error('Error approving:', error);
      alert('Failed to approve time entries');
    }
  };

  const handleMarkReadyToBill = async () => {
    if (!confirm('Mark this work order as Ready to Bill?')) return;

    try {
      const res = await fetch(`/api/work-orders/${id}/ready-to-bill`, {
        method: 'POST',
      });

      if (res.ok) {
        await fetchData();
        alert('Work order marked as Ready to Bill');
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to mark as ready to bill');
      }
    } catch (error) {
      console.error('Error marking ready to bill:', error);
      alert('Failed to mark as ready to bill');
    }
  };

  const handleExportPDF = () => {
    window.open(`/api/export/pdf/${id}`, '_blank');
  };

  const handleExportPDFByType = (billType: 'CUSTOMER_PAY' | 'WARRANTY') => {
    window.open(`/api/export/pdf/${id}?billType=${billType}`, '_blank');
  };

  const handleExportCSV = () => {
    window.open(`/api/export/csv/${id}`, '_blank');
  };

  const handleAddLineItemSuccess = () => {
    setShowAddLineItemModal(false);
    fetchData();
  };

  const handleAddPart = async (part: any, quantity: number) => {
    try {
      const res = await fetch(`/api/work-orders/${id}/parts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partId: part.id,
          description: part.description,
          quantity,
          unitCost: part.unitCost,
          unitPrice: part.unitPrice,
          billType: 'CUSTOMER',
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Failed to add part');
        return;
      }

      setShowPartPicker(false);
      fetchData();
    } catch (error) {
      console.error('Error adding part:', error);
      alert('Failed to add part');
    }
  };

  const toggleExpanded = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  const toggleSelectItem = (itemId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };

  const handleBulkMarkDone = async () => {
    if (selectedItems.size === 0) return;
    if (!confirm(`Mark ${selectedItems.size} items as done?`)) return;

    try {
      const promises = Array.from(selectedItems).map((itemId) =>
        fetch(`/api/line-items/${itemId}/done`, { method: 'POST' })
      );
      await Promise.all(promises);
      setSelectedItems(new Set());
      fetchData();
    } catch (error) {
      console.error('Error marking items as done:', error);
      alert('Failed to mark items as done');
    }
  };

  const formatMinutes = (minutes: number | null) => {
    if (!minutes) return '0h 0m';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getApprovalColor = (state: string) => {
    switch (state) {
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800';
      case 'SUBMITTED':
        return 'bg-blue-100 text-blue-800';
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'LOCKED':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user || !workOrder) {
    return null;
  }

  const unapprovedCount = workOrder.lineItems.reduce(
    (sum, item) =>
      sum +
      item.timeEntries.filter((e) => e.approvalState === 'DRAFT' || e.approvalState === 'SUBMITTED')
        .length,
    0
  );

  // Check for different bill types
  const hasCustomerPay = workOrder.lineItems.some((item) => item.billType === 'CUSTOMER_PAY');
  const hasWarranty = workOrder.lineItems.some((item) => item.billType === 'WARRANTY');
  const hasMixedBillTypes = hasCustomerPay && hasWarranty;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} />

      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 md:py-8">
        <div className="mb-4 md:mb-6">
          <button
            onClick={() => router.back()}
            className="text-blue-600 hover:text-blue-800 mb-3 md:mb-4 text-sm md:text-base"
          >
            ← Back to Work Orders
          </button>

          <div className="bg-white shadow-md rounded-lg p-4 md:p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-3 mb-4">
              <div className="flex-1">
                <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
                  {workOrder.woNumber}
                </h1>
                <p className="text-base md:text-lg text-gray-700">{workOrder.customer.name}</p>
                {workOrder.customer.billingInfo && (
                  <p className="text-xs md:text-sm text-gray-500">{workOrder.customer.billingInfo}</p>
                )}
              </div>
              <div className="flex gap-2 flex-wrap">
                <span
                  className={`px-2 md:px-3 py-1 text-xs md:text-sm font-semibold rounded-full ${getStatusColor(workOrder.status)}`}
                >
                  {workOrder.status.replace(/_/g, ' ')}
                </span>
                {workOrder.priority && (
                  <span
                    className={`px-2 md:px-3 py-1 text-xs md:text-sm font-semibold rounded-full ${
                      workOrder.priority === 'HIGH'
                        ? 'bg-red-100 text-red-800'
                        : workOrder.priority === 'MEDIUM'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-green-100 text-green-800'
                    }`}
                  >
                    {workOrder.priority} Priority
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 md:gap-4 p-3 md:p-4 bg-gray-50 rounded-lg">
              <div>
                <div className="text-xs md:text-sm text-gray-600">Estimate</div>
                <div className="text-lg md:text-xl lg:text-2xl font-bold text-gray-900">
                  {formatMinutes(totals?.estimateMinutes)}
                </div>
              </div>
              <div>
                <div className="text-xs md:text-sm text-gray-600">Tracked</div>
                <div className="text-lg md:text-xl lg:text-2xl font-bold text-gray-900">
                  {formatMinutes(totals?.trackedMinutes)}
                </div>
              </div>
              <div>
                <div className="text-xs md:text-sm text-gray-600">Variance</div>
                <div
                  className={`text-lg md:text-xl lg:text-2xl font-bold ${
                    totals?.varianceMinutes > 0 ? 'text-red-600' : 'text-green-600'
                  }`}
                >
                  {totals?.varianceMinutes > 0 ? '+' : ''}
                  {formatMinutes(Math.abs(totals?.varianceMinutes))}
                </div>
              </div>
            </div>

            {user.role === 'ADMIN' && (
              <div className="mt-4 md:mt-6 flex flex-wrap gap-2 md:gap-3">
                <button
                  onClick={handleApproveAll}
                  disabled={unapprovedCount === 0}
                  className="btn-success disabled:opacity-50 disabled:cursor-not-allowed text-xs md:text-sm"
                >
                  Approve All ({unapprovedCount})
                </button>
                <button
                  onClick={handleMarkReadyToBill}
                  disabled={workOrder.status === 'READY_TO_BILL' || unapprovedCount > 0}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed text-xs md:text-sm"
                >
                  Ready to Bill
                </button>

                {/* Export buttons - show split options if mixed bill types */}
                {hasMixedBillTypes ? (
                  <>
                    <button onClick={() => handleExportPDFByType('CUSTOMER_PAY')} className="btn-secondary text-xs md:text-sm">
                      PDF (Cust.)
                    </button>
                    <button onClick={() => handleExportPDFByType('WARRANTY')} className="btn-secondary text-xs md:text-sm">
                      PDF (Warr.)
                    </button>
                  </>
                ) : hasCustomerPay ? (
                  <button onClick={() => handleExportPDFByType('CUSTOMER_PAY')} className="btn-secondary text-xs md:text-sm">
                    <span className="hidden md:inline">Export PDF (Customer Pay)</span>
                    <span className="md:hidden">PDF</span>
                  </button>
                ) : hasWarranty ? (
                  <button onClick={() => handleExportPDFByType('WARRANTY')} className="btn-secondary text-xs md:text-sm">
                    <span className="hidden md:inline">Export PDF (Warranty)</span>
                    <span className="md:hidden">PDF</span>
                  </button>
                ) : (
                  <button onClick={handleExportPDF} className="btn-secondary text-xs md:text-sm">
                    <span className="hidden md:inline">Export PDF</span>
                    <span className="md:hidden">PDF</span>
                  </button>
                )}

                <button onClick={handleExportCSV} className="btn-secondary text-xs md:text-sm">
                  CSV
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white shadow-md rounded-lg mb-4 overflow-x-auto">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('lineItems')}
              className={`px-4 py-3 text-sm md:text-base font-medium whitespace-nowrap ${
                activeTab === 'lineItems'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Line Items
            </button>
            <button
              onClick={() => setActiveTab('parts')}
              className={`px-4 py-3 text-sm md:text-base font-medium whitespace-nowrap ${
                activeTab === 'parts'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Parts {parts.length > 0 && `(${parts.length})`}
            </button>
            <button
              onClick={() => setActiveTab('comments')}
              className={`px-4 py-3 text-sm md:text-base font-medium whitespace-nowrap ${
                activeTab === 'comments'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Comments
            </button>
          </div>
        </div>

        {/* Line Items Tab */}
        {activeTab === 'lineItems' && (
          <>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
              <h2 className="text-lg md:text-xl font-semibold text-gray-900">Line Items</h2>
              <button
                onClick={() => setShowAddLineItemModal(true)}
                className="btn-primary text-xs md:text-sm whitespace-nowrap"
              >
                + Add Line Item
              </button>
            </div>

        {/* Bulk Actions Bar */}
        {user.role === 'ADMIN' && selectedItems.size > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 md:p-4 mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="text-xs md:text-sm text-blue-900">
              {selectedItems.size} item{selectedItems.size > 1 ? 's' : ''} selected
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleBulkMarkDone}
                className="btn-success text-xs md:text-sm"
              >
                Mark as Done
              </button>
              <button
                onClick={() => setSelectedItems(new Set())}
                className="btn-secondary text-xs md:text-sm"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        <div className="space-y-3 md:space-y-4">
          {workOrder.lineItems.map((item) => {
            const totalMinutes = item.timeEntries.reduce(
              (sum, e) => sum + Math.floor((e.durationSeconds || 0) / 60),
              0
            );
            const isExpanded = expandedItems.has(item.id);

            return (
              <div key={item.id} className="bg-white shadow-md rounded-lg overflow-hidden">
                <div className="p-3 md:p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex items-start space-x-2 md:space-x-3 flex-1 min-w-0">
                      {user.role === 'ADMIN' && (
                        <input
                          type="checkbox"
                          checked={selectedItems.has(item.id)}
                          onChange={(e) => {
                            e.stopPropagation();
                            toggleSelectItem(item.id);
                          }}
                          className="mt-1 h-4 w-4 flex-shrink-0 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      )}
                      <div className="flex-1 cursor-pointer min-w-0" onClick={() => toggleExpanded(item.id)}>
                        <div className="flex flex-wrap items-center gap-1 md:gap-2 mb-1">
                          <h3 className="font-semibold text-sm md:text-base text-gray-900 break-words">{item.description}</h3>
                        {item.status === 'DONE' && (
                          <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-green-100 text-green-800 whitespace-nowrap">
                            DONE
                          </span>
                        )}
                        {!item.billable && (
                          <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-gray-100 text-gray-800 whitespace-nowrap">
                            NON-BILL
                          </span>
                        )}
                        {item.billType && (
                          <span className={`px-2 py-0.5 text-xs font-semibold rounded-full whitespace-nowrap ${
                            item.billType === 'WARRANTY'
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {item.billType === 'WARRANTY' ? 'WARR' : 'CUST'}
                          </span>
                        )}
                      </div>
                        <div className="text-xs md:text-sm text-gray-600">
                          <span className="hidden md:inline">
                            Estimate: {formatMinutes(item.estimateMinutes)} | Tracked:{' '}
                            {formatMinutes(totalMinutes)} | Entries: {item.timeEntries.length}
                          </span>
                          <span className="md:hidden">
                            Est: {formatMinutes(item.estimateMinutes)} | Track: {formatMinutes(totalMinutes)}
                          </span>
                        </div>
                        {(item.complaint || item.correction) && (
                          <div className="mt-2 space-y-1 text-xs md:text-sm">
                            {item.complaint && (
                              <div className="break-words">
                                <span className="font-medium text-gray-700">Complaint:</span>
                                <span className="text-gray-600 ml-1">{item.complaint}</span>
                              </div>
                            )}
                            {item.correction && (
                              <div className="break-words">
                                <span className="font-medium text-gray-700">Correction:</span>
                                <span className="text-gray-600 ml-1">{item.correction}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-gray-400 cursor-pointer text-lg md:text-xl flex-shrink-0 pt-1" onClick={() => toggleExpanded(item.id)}>
                      {isExpanded ? '▼' : '▶'}
                    </div>
                  </div>
                </div>

                {isExpanded && item.timeEntries.length > 0 && (
                  <div className="border-t border-gray-200 p-3 md:p-4 bg-gray-50">
                    <div className="space-y-2">
                      {item.timeEntries.map((entry) => (
                        <div
                          key={entry.id}
                          className="bg-white p-2 md:p-3 rounded border border-gray-200"
                        >
                          <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="text-xs md:text-sm font-medium text-gray-900">
                                {entry.user.name}
                              </div>
                              <div className="text-xs text-gray-500 break-words">
                                {new Date(entry.startTs).toLocaleString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: 'numeric',
                                  minute: '2-digit'
                                })}
                                {entry.endTs &&
                                  ` - ${new Date(entry.endTs).toLocaleTimeString('en-US', {
                                    hour: 'numeric',
                                    minute: '2-digit'
                                  })}`}
                              </div>
                              {entry.pauseReason && (
                                <div className="text-xs md:text-sm text-gray-700 mt-1 break-words">
                                  <span className="font-medium">Pause:</span> {entry.pauseReason}
                                </div>
                              )}
                              {entry.notes && (
                                <div className="text-xs md:text-sm text-gray-700 mt-1 break-words">
                                  <span className="font-medium">Notes:</span> {entry.notes}
                                </div>
                              )}
                            </div>
                            <div className="flex sm:flex-col items-center sm:items-end gap-2 sm:gap-1">
                              <div className="text-sm md:text-base font-semibold text-gray-900 whitespace-nowrap">
                                {formatMinutes(entry.durationSeconds ? Math.floor(entry.durationSeconds / 60) : null)}
                              </div>
                              <span
                                className={`px-2 py-0.5 text-xs font-semibold rounded-full whitespace-nowrap ${getApprovalColor(
                                  entry.approvalState
                                )}`}
                              >
                                {entry.approvalState}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
          </>
        )}

        {/* Parts Tab */}
        {activeTab === 'parts' && (
          <>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
              <h2 className="text-lg md:text-xl font-semibold text-gray-900">Parts</h2>
              {['SERVICE_WRITER', 'ADMIN', 'MANAGER'].includes(user?.role || '') && (
                <button
                  onClick={() => setShowPartPicker(true)}
                  className="btn-primary text-xs md:text-sm whitespace-nowrap"
                >
                  + Add Part
                </button>
              )}
            </div>

            <div className="bg-white shadow-md rounded-lg p-4 md:p-6">
              <WorkOrderPartsTable
                parts={parts}
                workOrderId={id}
                userRole={user?.role || ''}
                onUpdate={fetchData}
              />
            </div>
          </>
        )}

        {/* Comments Tab */}
        {activeTab === 'comments' && (
          <div className="bg-white shadow-md rounded-lg p-4 md:p-6">
            <CommentsSection workOrderId={id} currentUser={user} />
          </div>
        )}
      </div>

      {showAddLineItemModal && (
        <AddLineItemModal
          workOrderId={id}
          onClose={() => setShowAddLineItemModal(false)}
          onSuccess={handleAddLineItemSuccess}
        />
      )}

      {showPartPicker && (
        <PartPickerModal
          onSelect={handleAddPart}
          onClose={() => setShowPartPicker(false)}
        />
      )}
    </div>
  );
}
