'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import PartModal from '@/components/PartModal';
import InventoryAdjustmentModal from '@/components/InventoryAdjustmentModal';

interface Part {
  id: string;
  partNumber: string;
  description: string;
  manufacturer: string | null;
  unitCost: number;
  unitPrice: number;
  quantityOnHand: number;
  quantityReserved: number;
  quantityAvailable: number;
  reorderLevel: number;
  location: string | null;
  isLowStock: boolean;
}

export default function PartsPage() {
  const router = useRouter();
  const [parts, setParts] = useState<Part[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [selectedPart, setSelectedPart] = useState<Part | null>(null);
  const [showPartModal, setShowPartModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);

  useEffect(() => {
    fetchParts();
  }, [search, showLowStockOnly]);

  const fetchParts = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (showLowStockOnly) params.set('lowStock', 'true');

      const res = await fetch(`/api/parts?${params.toString()}`);

      if (!res.ok) {
        if (res.status === 401) {
          router.push('/login');
          return;
        }
        throw new Error('Failed to fetch parts');
      }

      const data = await res.json();
      setParts(data.parts || []);
    } catch (error) {
      console.error('Error fetching parts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPart = () => {
    setSelectedPart(null);
    setShowPartModal(true);
  };

  const handleEditPart = (part: Part) => {
    setSelectedPart(part);
    setShowPartModal(true);
  };

  const handleAdjustInventory = (part: Part) => {
    setSelectedPart(part);
    setShowAdjustModal(true);
  };

  const handleModalClose = () => {
    setShowPartModal(false);
    setShowAdjustModal(false);
    setSelectedPart(null);
    fetchParts();
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

  return (
    <div className="min-h-screen bg-gray-50 p-2 sm:p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-4 md:mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Parts Catalog</h1>
          <button
            onClick={handleAddPart}
            className="btn-primary text-sm md:text-base whitespace-nowrap"
          >
            + Add Part
          </button>
        </div>

        {/* Filters */}
        <div className="mb-4 md:mb-6 flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Search parts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field flex-1 text-sm md:text-base"
          />
          <label className="flex items-center gap-2 text-sm md:text-base whitespace-nowrap cursor-pointer">
            <input
              type="checkbox"
              checked={showLowStockOnly}
              onChange={(e) => setShowLowStockOnly(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-gray-700">Low Stock Only</span>
          </label>
        </div>

        {/* Parts Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Part #
                  </th>
                  <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                    Description
                  </th>
                  <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                    Manufacturer
                  </th>
                  <th className="px-3 md:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Available
                  </th>
                  <th className="px-3 md:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                    On Hand
                  </th>
                  <th className="px-3 md:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                    Price
                  </th>
                  <th className="px-3 md:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {parts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500 text-sm">
                      {search || showLowStockOnly ? 'No parts found' : 'No parts in catalog. Click "Add Part" to get started.'}
                    </td>
                  </tr>
                ) : (
                  parts.map((part) => (
                    <tr key={part.id} className="hover:bg-gray-50">
                      <td className="px-3 md:px-6 py-4 whitespace-nowrap">
                        <div className="text-xs md:text-sm font-medium text-gray-900">
                          {part.partNumber}
                        </div>
                        <div className="text-xs text-gray-500 md:hidden">
                          {part.description}
                        </div>
                      </td>
                      <td className="px-3 md:px-6 py-4 hidden md:table-cell">
                        <div className="text-sm text-gray-900">{part.description}</div>
                      </td>
                      <td className="px-3 md:px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden lg:table-cell">
                        {part.manufacturer || '-'}
                      </td>
                      <td className="px-3 md:px-6 py-4 whitespace-nowrap text-right">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            part.isLowStock
                              ? 'bg-red-100 text-red-800'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {part.quantityAvailable}
                        </span>
                        {part.isLowStock && (
                          <div className="text-xs text-red-600 mt-1">
                            Low Stock
                          </div>
                        )}
                      </td>
                      <td className="px-3 md:px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right hidden sm:table-cell">
                        {part.quantityOnHand}
                        {part.quantityReserved > 0 && (
                          <div className="text-xs text-gray-500">
                            ({part.quantityReserved} reserved)
                          </div>
                        )}
                      </td>
                      <td className="px-3 md:px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right hidden md:table-cell">
                        ${part.unitPrice.toFixed(2)}
                      </td>
                      <td className="px-3 md:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleEditPart(part)}
                            className="text-blue-600 hover:text-blue-900 text-xs md:text-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleAdjustInventory(part)}
                            className="text-green-600 hover:text-green-900 text-xs md:text-sm"
                          >
                            Adjust
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Total Count */}
        <div className="mt-4 text-sm text-gray-600">
          Showing {parts.length} {parts.length === 1 ? 'part' : 'parts'}
        </div>
      </div>

      {/* Modals */}
      {showPartModal && (
        <PartModal
          part={selectedPart}
          onClose={handleModalClose}
          onSuccess={handleModalClose}
        />
      )}

      {showAdjustModal && selectedPart && (
        <InventoryAdjustmentModal
          part={selectedPart}
          onClose={handleModalClose}
          onSuccess={handleModalClose}
        />
      )}
    </div>
  );
}
