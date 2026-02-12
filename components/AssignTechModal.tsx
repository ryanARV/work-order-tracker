'use client';

import { useState, useEffect } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AssignTechModalProps {
  lineItemId: string;
  currentAssignments: { id: string; userId: string; user: { id: string; name: string } }[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function AssignTechModal({
  lineItemId,
  currentAssignments,
  onClose,
  onSuccess,
}: AssignTechModalProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
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

  const handleAssign = async () => {
    if (!selectedUserId) {
      setError('Please select a technician');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const res = await fetch(`/api/line-items/${lineItemId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUserId }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to assign technician');
        setLoading(false);
        return;
      }

      onSuccess();
    } catch (err) {
      setError('An error occurred');
      setLoading(false);
    }
  };

  // Filter out already assigned techs
  const assignedUserIds = new Set(currentAssignments.map((a) => a.userId));
  const availableTechs = users.filter((u) => !assignedUserIds.has(u.id));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Assign Technician</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Select Technician
          </label>
          {availableTechs.length === 0 ? (
            <p className="text-sm text-gray-500">
              All available technicians are already assigned to this task.
            </p>
          ) : (
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="input-field"
            >
              <option value="">Choose a technician...</option>
              {availableTechs.map((tech) => (
                <option key={tech.id} value={tech.id}>
                  {tech.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {error && (
          <div className="bg-red-50 text-red-800 p-3 rounded-md text-sm mb-4">
            {error}
          </div>
        )}

        <div className="flex space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 btn-secondary"
          >
            Cancel
          </button>
          <button
            onClick={handleAssign}
            disabled={loading || !selectedUserId || availableTechs.length === 0}
            className="flex-1 btn-primary disabled:opacity-50"
          >
            {loading ? 'Assigning...' : 'Assign'}
          </button>
        </div>
      </div>
    </div>
  );
}
