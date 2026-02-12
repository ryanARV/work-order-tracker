'use client';

import { useState, useEffect } from 'react';

interface User {
  id: string;
  name: string;
  role: string;
}

interface AddLineItemModalProps {
  workOrderId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddLineItemModal({
  workOrderId,
  onClose,
  onSuccess,
}: AddLineItemModalProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [description, setDescription] = useState('');
  const [estimateMinutes, setEstimateMinutes] = useState('');
  const [billable, setBillable] = useState(true);
  const [assignedUserIds, setAssignedUserIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      const techs = (data.users || []).filter((u: User) => u.role === 'TECH');
      setUsers(techs);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`/api/work-orders/${workOrderId}/line-items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description,
          estimateMinutes: estimateMinutes ? parseInt(estimateMinutes) : null,
          billable,
          assignedUserIds,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to add line item');
        setLoading(false);
        return;
      }

      onSuccess();
    } catch (err) {
      setError('An error occurred');
      setLoading(false);
    }
  };

  const toggleUser = (userId: string) => {
    if (assignedUserIds.includes(userId)) {
      setAssignedUserIds(assignedUserIds.filter((id) => id !== userId));
    } else {
      setAssignedUserIds([...assignedUserIds, userId]);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Add Line Item</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <textarea
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Replace hydraulic pump on Line 3"
              className="input-field"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estimate (minutes)
            </label>
            <input
              type="number"
              min="0"
              value={estimateMinutes}
              onChange={(e) => setEstimateMinutes(e.target.value)}
              placeholder="120"
              className="input-field"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="billable"
              checked={billable}
              onChange={(e) => setBillable(e.target.checked)}
              className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
            <label htmlFor="billable" className="ml-2 text-sm text-gray-700">
              Billable
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assign Technicians
            </label>
            <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-md p-2">
              {users.length === 0 ? (
                <p className="text-sm text-gray-500">No technicians available</p>
              ) : (
                users.map((user) => (
                  <label
                    key={user.id}
                    className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={assignedUserIds.includes(user.id)}
                      onChange={() => toggleUser(user.id)}
                      className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-900">
                      {user.name}
                    </span>
                  </label>
                ))
              )}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-800 p-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="flex space-x-3 pt-4">
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
              {loading ? 'Adding...' : 'Add Line Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
