'use client';

import { useState, useEffect } from 'react';

interface Part {
  id: string;
  partNumber: string;
  description: string;
  manufacturer: string | null;
  unitCost: number;
  unitPrice: number;
  quantityOnHand: number;
  reorderLevel: number;
  location: string | null;
}

interface PartModalProps {
  part: Part | null; // null = create new, otherwise edit
  onClose: () => void;
  onSuccess: () => void;
}

export default function PartModal({ part, onClose, onSuccess }: PartModalProps) {
  const [formData, setFormData] = useState({
    partNumber: '',
    description: '',
    manufacturer: '',
    unitCost: '',
    unitPrice: '',
    quantityOnHand: '',
    reorderLevel: '',
    location: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (part) {
      setFormData({
        partNumber: part.partNumber,
        description: part.description,
        manufacturer: part.manufacturer || '',
        unitCost: part.unitCost.toString(),
        unitPrice: part.unitPrice.toString(),
        quantityOnHand: part.quantityOnHand.toString(),
        reorderLevel: part.reorderLevel.toString(),
        location: part.location || '',
      });
    }
  }, [part]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const payload = {
      partNumber: formData.partNumber.trim(),
      description: formData.description.trim(),
      manufacturer: formData.manufacturer.trim() || null,
      unitCost: parseFloat(formData.unitCost) || 0,
      unitPrice: parseFloat(formData.unitPrice) || 0,
      quantityOnHand: parseInt(formData.quantityOnHand) || 0,
      reorderLevel: parseInt(formData.reorderLevel) || 0,
      location: formData.location.trim() || null,
    };

    try {
      const url = part ? `/api/parts/${part.id}` : '/api/parts';
      const method = part ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to save part');
        setLoading(false);
        return;
      }

      onSuccess();
    } catch (err) {
      setError('An error occurred');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-4 md:p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900">
              {part ? 'Edit Part' : 'Add New Part'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Part Number & Description */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Part Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.partNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, partNumber: e.target.value })
                  }
                  className="input-field"
                  placeholder="ABC-12345"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Manufacturer
                </label>
                <input
                  type="text"
                  value={formData.manufacturer}
                  onChange={(e) =>
                    setFormData({ ...formData, manufacturer: e.target.value })
                  }
                  className="input-field"
                  placeholder="Acme Corp"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="input-field"
                rows={3}
                placeholder="Brief description of the part"
              />
            </div>

            {/* Pricing */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unit Cost ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.unitCost}
                  onChange={(e) =>
                    setFormData({ ...formData, unitCost: e.target.value })
                  }
                  className="input-field"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unit Price ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.unitPrice}
                  onChange={(e) =>
                    setFormData({ ...formData, unitPrice: e.target.value })
                  }
                  className="input-field"
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Inventory */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {part ? 'Current Qty' : 'Initial Qty'}
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.quantityOnHand}
                  onChange={(e) =>
                    setFormData({ ...formData, quantityOnHand: e.target.value })
                  }
                  className="input-field"
                  placeholder="0"
                  disabled={!!part} // Can't edit quantity directly on edit
                />
                {part && (
                  <p className="text-xs text-gray-500 mt-1">
                    Use "Adjust" button to change quantity
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reorder Level
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.reorderLevel}
                  onChange={(e) =>
                    setFormData({ ...formData, reorderLevel: e.target.value })
                  }
                  className="input-field"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  className="input-field"
                  placeholder="Shelf A-12"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-800 p-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-4">
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
                {loading ? 'Saving...' : part ? 'Update Part' : 'Create Part'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
