'use client';

import { useState } from 'react';

interface Part {
  id: string;
  partNumber: string;
  description: string;
  quantityOnHand: number;
  quantityReserved: number;
  quantityAvailable: number;
  unitCost: number;
}

interface InventoryAdjustmentModalProps {
  part: Part;
  onClose: () => void;
  onSuccess: () => void;
}

export default function InventoryAdjustmentModal({
  part,
  onClose,
  onSuccess,
}: InventoryAdjustmentModalProps) {
  const [type, setType] = useState<'PURCHASE' | 'RETURN' | 'ADJUSTMENT'>('PURCHASE');
  const [quantity, setQuantity] = useState('');
  const [unitCost, setUnitCost] = useState(part.unitCost.toString());
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const qty = parseInt(quantity);
    if (!qty || qty === 0) {
      setError('Quantity must be a non-zero number');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`/api/parts/${part.id}/adjust`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          quantity: type === 'RETURN' ? -Math.abs(qty) : qty,
          unitCost: parseFloat(unitCost) || part.unitCost,
          reason: reason.trim() || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to adjust inventory');
        setLoading(false);
        return;
      }

      onSuccess();
    } catch (err) {
      setError('An error occurred');
      setLoading(false);
    }
  };

  const getQuantityLabel = () => {
    switch (type) {
      case 'PURCHASE':
        return 'Quantity to Add';
      case 'RETURN':
        return 'Quantity to Remove';
      case 'ADJUSTMENT':
        return 'Adjustment Quantity';
      default:
        return 'Quantity';
    }
  };

  const getQuantityPlaceholder = () => {
    switch (type) {
      case 'PURCHASE':
        return 'Enter positive number to add';
      case 'RETURN':
        return 'Enter number to remove';
      case 'ADJUSTMENT':
        return 'Positive to add, negative to remove';
      default:
        return '0';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-4 md:p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">Adjust Inventory</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ✕
            </button>
          </div>

          {/* Part Info */}
          <div className="bg-gray-50 p-3 rounded-md mb-4 text-sm">
            <div className="font-medium text-gray-900">{part.partNumber}</div>
            <div className="text-gray-600 text-xs">{part.description}</div>
            <div className="mt-2 flex justify-between text-xs">
              <span>On Hand: <strong>{part.quantityOnHand}</strong></span>
              <span>Reserved: <strong>{part.quantityReserved}</strong></span>
              <span>Available: <strong>{part.quantityAvailable}</strong></span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Transaction Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Transaction Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="input-field"
              >
                <option value="PURCHASE">Purchase (Add Stock)</option>
                <option value="RETURN">Return (Remove Stock)</option>
                <option value="ADJUSTMENT">Adjustment (Correction)</option>
              </select>
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {getQuantityLabel()} <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="input-field"
                placeholder={getQuantityPlaceholder()}
              />
              {type === 'ADJUSTMENT' && (
                <p className="text-xs text-gray-500 mt-1">
                  Use + to add or - to subtract from current quantity
                </p>
              )}
            </div>

            {/* Unit Cost (for purchases) */}
            {type === 'PURCHASE' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unit Cost ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={unitCost}
                  onChange={(e) => setUnitCost(e.target.value)}
                  className="input-field"
                  placeholder="0.00"
                />
              </div>
            )}

            {/* Reason */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason / Notes
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="input-field"
                rows={2}
                placeholder="Optional notes about this adjustment"
              />
            </div>

            {error && (
              <div className="bg-red-50 text-red-800 p-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 btn-primary disabled:opacity-50"
              >
                {loading ? 'Adjusting...' : 'Adjust Inventory'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
