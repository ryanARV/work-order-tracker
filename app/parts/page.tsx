'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import PartModal from '@/components/PartModal';
import InventoryAdjustmentModal from '@/components/InventoryAdjustmentModal';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'TECH' | 'SERVICE_WRITER' | 'PARTS' | 'MANAGER';
}

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
  const [user, setUser] = useState<User | null>(null);
  const [parts, setParts] = useState<Part[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [selectedPart, setSelectedPart] = useState<Part | null>(null);
  const [showPartModal, setShowPartModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, [search, showLowStockOnly]);

  const fetchData = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (showLowStockOnly) params.set('lowStock', 'true');

      const [userRes, partsRes] = await Promise.all([
        fetch('/api/auth/me'),
        fetch(`/api/parts?${params.toString()}`),
      ]);

      if (!userRes.ok) {
        router.push('/login');
        return;
      }

      if (!partsRes.ok) {
        throw new Error('Failed to fetch parts');
      }

      const userData = await userRes.json();
      const partsData = await partsRes.json();

      setUser(userData.user);
      setParts(partsData.parts || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchParts = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (showLowStockOnly) params.set('lowStock', 'true');

      const res = await fetch(`/api/parts?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch parts');

      const data = await res.json();
      setParts(data.parts || []);
    } catch (error) {
      console.error('Error fetching parts:', error);
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600 font-medium">Loading parts catalog...</p>
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

      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 md:py-8">
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="section-header">Parts Catalog</h1>
            <p className="section-subheader">Manage inventory and part information</p>
          </div>
          <button
            onClick={handleAddPart}
            className="btn-primary whitespace-nowrap"
          >
            <span className="text-lg mr-2">+</span> Add Part
          </button>
        </div>

        {/* Filters */}
        <div className="card mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
            <div className="flex-1 w-full">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <input
                type="text"
                placeholder="Search by part # or description..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-field"
              />
            </div>
            <label className="flex items-center gap-2 whitespace-nowrap cursor-pointer pb-2.5">
              <input
                type="checkbox"
                checked={showLowStockOnly}
                onChange={(e) => setShowLowStockOnly(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Show Low Stock Only</span>
            </label>
          </div>
          {(search || showLowStockOnly) && (
            <div className="mt-3">
              <button
                onClick={() => {
                  setSearch('');
                  setShowLowStockOnly(false);
                }}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Clear All Filters
              </button>
            </div>
          )}
        </div>

        {/* Parts Table */}
        {parts.length === 0 ? (
          <div className="card text-center py-16">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🔧</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No parts found</h3>
            <p className="text-gray-500 mb-6">
              {search || showLowStockOnly
                ? 'Try adjusting your filters to see more results'
                : 'Get started by adding your first part to the catalog'}
            </p>
            {!search && !showLowStockOnly && (
              <button onClick={handleAddPart} className="btn-primary">
                <span className="text-lg mr-2">+</span> Add Part
              </button>
            )}
          </div>
        ) : (
          <div className="card overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="table-header">
                  <tr>
                    <th className="table-cell font-semibold text-xs text-gray-600 uppercase tracking-wider">
                      Part #
                    </th>
                    <th className="table-cell font-semibold text-xs text-gray-600 uppercase tracking-wider hidden md:table-cell">
                      Description
                    </th>
                    <th className="table-cell font-semibold text-xs text-gray-600 uppercase tracking-wider hidden lg:table-cell">
                      Manufacturer
                    </th>
                    <th className="table-cell font-semibold text-xs text-gray-600 uppercase tracking-wider text-right">
                      Available
                    </th>
                    <th className="table-cell font-semibold text-xs text-gray-600 uppercase tracking-wider text-right hidden sm:table-cell">
                      On Hand
                    </th>
                    <th className="table-cell font-semibold text-xs text-gray-600 uppercase tracking-wider text-right hidden md:table-cell">
                      Price
                    </th>
                    <th className="table-cell font-semibold text-xs text-gray-600 uppercase tracking-wider text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white">{
                  parts.map((part) => (
                    <tr key={part.id} className="table-row">
                      <td className="table-cell">
                        <div className="font-semibold text-gray-900">
                          {part.partNumber}
                        </div>
                        <div className="text-xs text-gray-500 md:hidden mt-1">
                          {part.description}
                        </div>
                      </td>
                      <td className="table-cell hidden md:table-cell">
                        <div className="font-medium">{part.description}</div>
                      </td>
                      <td className="table-cell text-gray-600 hidden lg:table-cell">
                        {part.manufacturer || '-'}
                      </td>
                      <td className="table-cell text-right">
                        <span
                          className={`badge ${
                            part.isLowStock ? 'badge-red' : 'badge-green'
                          }`}
                        >
                          {part.quantityAvailable}
                        </span>
                        {part.isLowStock && (
                          <div className="text-xs text-red-600 font-medium mt-1">
                            Low Stock
                          </div>
                        )}
                      </td>
                      <td className="table-cell text-right hidden sm:table-cell">
                        <span className="font-medium">{part.quantityOnHand}</span>
                        {part.quantityReserved > 0 && (
                          <div className="text-xs text-gray-500 mt-0.5">
                            ({part.quantityReserved} reserved)
                          </div>
                        )}
                      </td>
                      <td className="table-cell text-right hidden md:table-cell">
                        <span className="font-medium">${part.unitPrice.toFixed(2)}</span>
                      </td>
                      <td className="table-cell text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleEditPart(part)}
                            className="text-blue-600 hover:text-blue-700 font-medium"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleAdjustInventory(part)}
                            className="text-green-600 hover:text-green-700 font-medium"
                          >
                            Adjust
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Total Count */}
        {parts.length > 0 && (
          <div className="mt-4 text-sm text-gray-600 font-medium">
            Showing {parts.length} {parts.length === 1 ? 'part' : 'parts'}
          </div>
        )}
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
