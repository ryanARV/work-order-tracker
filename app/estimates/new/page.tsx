'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import PartPickerModal from '@/components/PartPickerModal';

interface Customer {
  id: string;
  name: string;
  contactEmail: string | null;
  contactPhone: string | null;
}

interface LineItem {
  description: string;
  complaint: string;
  correction: string;
  estimateMinutes: number;
  laborRate: number;
  billType: string;
}

interface PartItem {
  partId: string | null;
  description: string;
  quantity: number;
  unitCost: number;
  unitPrice: number;
  billType: string;
}

export default function NewEstimatePage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showPartPicker, setShowPartPicker] = useState(false);

  // Form data
  const [customerId, setCustomerId] = useState('');
  const [priority, setPriority] = useState('');
  const [warrantyAuthorizationNumber, setWarrantyAuthorizationNumber] = useState('');
  const [validUntil, setValidUntil] = useState('');

  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [partItems, setPartItems] = useState<PartItem[]>([]);

  // Line item form
  const [showLineItemForm, setShowLineItemForm] = useState(false);
  const [currentLineItem, setCurrentLineItem] = useState<LineItem>({
    description: '',
    complaint: '',
    correction: '',
    estimateMinutes: 0,
    laborRate: 85,
    billType: 'CUSTOMER',
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const res = await fetch('/api/customers');
      if (!res.ok) {
        if (res.status === 401) {
          router.push('/login');
          return;
        }
        throw new Error('Failed to fetch customers');
      }
      const data = await res.json();
      setCustomers(data.customers || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddLineItem = () => {
    if (!currentLineItem.description.trim()) {
      alert('Please enter a description');
      return;
    }

    setLineItems([...lineItems, { ...currentLineItem }]);
    setCurrentLineItem({
      description: '',
      complaint: '',
      correction: '',
      estimateMinutes: 0,
      laborRate: 85,
      billType: 'CUSTOMER',
    });
    setShowLineItemForm(false);
  };

  const handleRemoveLineItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const handleAddPart = (part: any, quantity: number) => {
    const newPartItem: PartItem = {
      partId: part.id,
      description: part.description,
      quantity,
      unitCost: part.unitCost,
      unitPrice: part.unitPrice,
      billType: 'CUSTOMER',
    };
    setPartItems([...partItems, newPartItem]);
    setShowPartPicker(false);
  };

  const handleRemovePart = (index: number) => {
    setPartItems(partItems.filter((_, i) => i !== index));
  };

  const handleSubmit = async (asDraft: boolean) => {
    if (!customerId) {
      alert('Please select a customer');
      return;
    }

    if (lineItems.length === 0 && partItems.length === 0) {
      alert('Please add at least one line item or part');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/estimates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId,
          priority: priority || null,
          warrantyAuthorizationNumber: warrantyAuthorizationNumber || null,
          validUntil: validUntil || null,
          lineItems: lineItems.map((item, index) => ({
            ...item,
            sortOrder: index,
          })),
          partItems: partItems.map((item, index) => ({
            ...item,
            sortOrder: index,
          })),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Failed to create estimate');
        setSubmitting(false);
        return;
      }

      const data = await res.json();

      // If not draft, submit for approval
      if (!asDraft) {
        await fetch(`/api/estimates/${data.estimate.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'PENDING_APPROVAL' }),
        });
      }

      router.push(`/estimates/${data.estimate.id}`);
    } catch (error) {
      console.error('Error creating estimate:', error);
      alert('Failed to create estimate');
      setSubmitting(false);
    }
  };

  const calculateTotal = () => {
    const laborTotal = lineItems.reduce((sum, item) => {
      return sum + (item.estimateMinutes / 60) * item.laborRate;
    }, 0);
    const partsTotal = partItems.reduce((sum, item) => {
      return sum + item.quantity * item.unitPrice;
    }, 0);
    return laborTotal + partsTotal;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-2 sm:p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">New Estimate</h1>
          <p className="text-sm md:text-base text-gray-600 mt-1">Create a new estimate for a customer</p>
        </div>

        <div className="bg-white rounded-lg shadow p-4 md:p-6">
          {/* Customer Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Customer <span className="text-red-500">*</span>
            </label>
            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className="input-field"
            >
              <option value="">Select a customer...</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </select>
          </div>

          {/* Estimate Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="input-field"
              >
                <option value="">None</option>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Valid Until</label>
              <input
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Warranty Auth #
              </label>
              <input
                type="text"
                value={warrantyAuthorizationNumber}
                onChange={(e) => setWarrantyAuthorizationNumber(e.target.value)}
                className="input-field"
                placeholder="Optional"
              />
            </div>
          </div>

          {/* Line Items Section */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-semibold text-gray-900">Line Items</h3>
              <button
                onClick={() => setShowLineItemForm(!showLineItemForm)}
                className="btn-primary text-sm"
              >
                {showLineItemForm ? 'Cancel' : '+ Add Line Item'}
              </button>
            </div>

            {showLineItemForm && (
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={currentLineItem.description}
                      onChange={(e) =>
                        setCurrentLineItem({ ...currentLineItem, description: e.target.value })
                      }
                      className="input-field"
                      placeholder="e.g., Oil change, Brake repair"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Complaint
                      </label>
                      <textarea
                        value={currentLineItem.complaint}
                        onChange={(e) =>
                          setCurrentLineItem({ ...currentLineItem, complaint: e.target.value })
                        }
                        className="input-field"
                        rows={2}
                        placeholder="Customer complaint"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Correction
                      </label>
                      <textarea
                        value={currentLineItem.correction}
                        onChange={(e) =>
                          setCurrentLineItem({ ...currentLineItem, correction: e.target.value })
                        }
                        className="input-field"
                        rows={2}
                        placeholder="Proposed correction"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Est. Time (hours)
                      </label>
                      <input
                        type="number"
                        step="0.25"
                        min="0"
                        value={currentLineItem.estimateMinutes / 60}
                        onChange={(e) =>
                          setCurrentLineItem({
                            ...currentLineItem,
                            estimateMinutes: parseFloat(e.target.value) * 60,
                          })
                        }
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Labor Rate ($/hr)
                      </label>
                      <input
                        type="number"
                        step="1"
                        min="0"
                        value={currentLineItem.laborRate}
                        onChange={(e) =>
                          setCurrentLineItem({
                            ...currentLineItem,
                            laborRate: parseFloat(e.target.value),
                          })
                        }
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Bill To
                      </label>
                      <select
                        value={currentLineItem.billType}
                        onChange={(e) =>
                          setCurrentLineItem({ ...currentLineItem, billType: e.target.value })
                        }
                        className="input-field"
                      >
                        <option value="CUSTOMER">Customer</option>
                        <option value="WARRANTY">Warranty</option>
                        <option value="INTERNAL">Internal</option>
                      </select>
                    </div>
                  </div>

                  <button onClick={handleAddLineItem} className="btn-primary w-full">
                    Add Line Item
                  </button>
                </div>
              </div>
            )}

            {lineItems.length > 0 && (
              <div className="space-y-2">
                {lineItems.map((item, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-start p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{item.description}</div>
                      <div className="text-sm text-gray-600">
                        {item.estimateMinutes / 60}h × ${item.laborRate}/hr ={' '}
                        {formatCurrency((item.estimateMinutes / 60) * item.laborRate)}
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveLineItem(index)}
                      className="text-red-600 hover:text-red-800 ml-4"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Parts Section */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-semibold text-gray-900">Parts</h3>
              <button
                onClick={() => setShowPartPicker(true)}
                className="btn-primary text-sm"
              >
                + Add Part
              </button>
            </div>

            {partItems.length > 0 && (
              <div className="space-y-2">
                {partItems.map((item, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-start p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{item.description}</div>
                      <div className="text-sm text-gray-600">
                        {item.quantity} × {formatCurrency(item.unitPrice)} ={' '}
                        {formatCurrency(item.quantity * item.unitPrice)}
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemovePart(index)}
                      className="text-red-600 hover:text-red-800 ml-4"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Total */}
          <div className="bg-blue-50 p-4 rounded-lg mb-6">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-gray-900">Estimated Total</span>
              <span className="text-2xl font-bold text-blue-600">
                {formatCurrency(calculateTotal())}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => router.back()}
              className="flex-1 btn-secondary"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              onClick={() => handleSubmit(true)}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium disabled:opacity-50"
              disabled={submitting}
            >
              {submitting ? 'Saving...' : 'Save as Draft'}
            </button>
            <button
              onClick={() => handleSubmit(false)}
              className="flex-1 btn-primary disabled:opacity-50"
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : 'Submit for Approval'}
            </button>
          </div>
        </div>
      </div>

      {/* Part Picker Modal */}
      {showPartPicker && (
        <PartPickerModal
          onSelect={handleAddPart}
          onClose={() => setShowPartPicker(false)}
        />
      )}
    </div>
  );
}
