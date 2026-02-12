'use client';

import { useState } from 'react';

interface Part {
  id: string;
  partNumber: string | null;
  description: string;
  quantityOnHand: number;
  quantityReserved: number;
}

interface WorkOrderPart {
  id: string;
  partId: string | null;
  description: string;
  quantity: number;
  quantityIssued: number;
  unitCost: number;
  unitPrice: number;
  billType: string;
  part: Part | null;
}

interface IssuePartsModalProps {
  part: WorkOrderPart;
  workOrderId: string;
  onClose: () => void;
  onIssued: () => void;
}

export default function IssuePartsModal({
  part,
  workOrderId,
  onClose,
  onIssued,
}: IssuePartsModalProps) {
  const remainingToIssue = part.quantity - part.quantityIssued;
  const [quantityToIssue, setQuantityToIssue] = useState(remainingToIssue);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (quantityToIssue <= 0) {
      alert('Quantity must be greater than 0');
      return;
    }

    if (quantityToIssue > remainingToIssue) {
      alert(`Cannot issue more than ${remainingToIssue}`);
      return;
    }

    // For catalog parts, check inventory
    if (part.part && quantityToIssue > part.part.quantityOnHand) {
      alert(
        `Insufficient inventory. Available: ${part.part.quantityOnHand}, Requested: ${quantityToIssue}`
      );
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch(
        `/api/work-orders/${workOrderId}/parts/${part.id}/issue`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ quantityToIssue }),
        }
      );

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Failed to issue parts');
        setSubmitting(false);
        return;
      }

      onIssued();
    } catch (error) {
      console.error('Error issuing parts:', error);
      alert('Failed to issue parts');
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Issue Parts</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Part
            </label>
            <div className="text-sm text-gray-900">
              {part.part?.partNumber && (
                <div className="font-medium">{part.part.partNumber}</div>
              )}
              <div>{part.description}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Total Quantity:</span>
              <div className="font-medium text-gray-900">{part.quantity}</div>
            </div>
            <div>
              <span className="text-gray-500">Already Issued:</span>
              <div className="font-medium text-gray-900">{part.quantityIssued}</div>
            </div>
            <div>
              <span className="text-gray-500">Remaining:</span>
              <div className="font-medium text-gray-900">{remainingToIssue}</div>
            </div>
            {part.part && (
              <div>
                <span className="text-gray-500">On Hand:</span>
                <div className="font-medium text-gray-900">
                  {part.part.quantityOnHand}
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quantity to Issue <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              max={remainingToIssue}
              value={quantityToIssue}
              onChange={(e) => setQuantityToIssue(parseInt(e.target.value) || 0)}
              className="input-field"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Max: {remainingToIssue}
              {part.part && ` (${part.part.quantityOnHand} available in inventory)`}
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn-secondary"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 btn-primary"
              disabled={submitting}
            >
              {submitting ? 'Issuing...' : 'Issue Parts'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
