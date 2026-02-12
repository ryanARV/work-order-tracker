'use client';

import { useState, useEffect } from 'react';

interface Part {
  id: string;
  partNumber: string;
  description: string;
  manufacturer: string | null;
  unitCost: number;
  unitPrice: number;
  quantityAvailable: number;
}

interface PartPickerModalProps {
  onSelect: (part: Part, quantity: number) => void;
  onClose: () => void;
}

export default function PartPickerModal({ onSelect, onClose }: PartPickerModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Part[]>([]);
  const [selectedPart, setSelectedPart] = useState<Part | null>(null);
  const [quantity, setQuantity] = useState('1');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (searchQuery.length >= 2) {
      searchParts();
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const searchParts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/parts/search?q=${encodeURIComponent(searchQuery)}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.parts || []);
      }
    } catch (error) {
      console.error('Error searching parts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPart = (part: Part) => {
    setSelectedPart(part);
    setQuantity('1');
  };

  const handleAddPart = () => {
    if (!selectedPart) return;

    const qty = parseInt(quantity);
    if (!qty || qty <= 0) {
      alert('Please enter a valid quantity');
      return;
    }

    onSelect(selectedPart, qty);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-4 md:p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900">Add Part</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ✕
            </button>
          </div>

          {/* Search Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search Parts
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by part number, description, or manufacturer..."
              className="input-field"
              autoFocus
            />
            {loading && (
              <p className="text-xs text-gray-500 mt-1">Searching...</p>
            )}
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && !selectedPart && (
            <div className="mb-4">
              <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-md">
                {searchResults.map((part) => (
                  <button
                    key={part.id}
                    onClick={() => handleSelectPart(part)}
                    className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-0 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 text-sm">
                          {part.partNumber}
                        </div>
                        <div className="text-xs text-gray-600">
                          {part.description}
                        </div>
                        {part.manufacturer && (
                          <div className="text-xs text-gray-500 mt-1">
                            {part.manufacturer}
                          </div>
                        )}
                      </div>
                      <div className="ml-4 text-right">
                        <div className="text-sm font-semibold text-gray-900">
                          ${part.unitPrice.toFixed(2)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {part.quantityAvailable} available
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Selected Part Details */}
          {selectedPart && (
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <div className="font-semibold text-gray-900">
                    {selectedPart.partNumber}
                  </div>
                  <div className="text-sm text-gray-700">
                    {selectedPart.description}
                  </div>
                  {selectedPart.manufacturer && (
                    <div className="text-xs text-gray-600 mt-1">
                      {selectedPart.manufacturer}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setSelectedPart(null)}
                  className="text-blue-600 hover:text-blue-800 text-sm ml-4"
                >
                  Change
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-600">Unit Cost:</span>{' '}
                  <span className="font-medium">${selectedPart.unitCost.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-gray-600">Unit Price:</span>{' '}
                  <span className="font-medium">${selectedPart.unitPrice.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-gray-600">Available:</span>{' '}
                  <span className="font-medium">{selectedPart.quantityAvailable}</span>
                </div>
              </div>

              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="input-field max-w-[150px]"
                />
              </div>
            </div>
          )}

          {/* No Results Message */}
          {searchQuery.length >= 2 && searchResults.length === 0 && !loading && !selectedPart && (
            <div className="text-center py-8 text-gray-500 text-sm">
              No parts found. Try a different search term.
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn-secondary"
            >
              Cancel
            </button>
            <button
              onClick={handleAddPart}
              disabled={!selectedPart}
              className="flex-1 btn-primary disabled:opacity-50"
            >
              Add Part
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
