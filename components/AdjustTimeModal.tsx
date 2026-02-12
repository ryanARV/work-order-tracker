'use client';

import { useState } from 'react';

interface TimeEntry {
  id: string;
  durationSeconds: number | null;
  user: {
    id: string;
    name: string;
  };
}

interface AdjustTimeModalProps {
  timeEntry: TimeEntry;
  onClose: () => void;
  onAdjusted: () => void;
}

export default function AdjustTimeModal({
  timeEntry,
  onClose,
  onAdjusted,
}: AdjustTimeModalProps) {
  const originalMinutes = Math.floor((timeEntry.durationSeconds || 0) / 60);
  const originalHours = Math.floor(originalMinutes / 60);
  const originalMins = originalMinutes % 60;

  const [hours, setHours] = useState(originalHours);
  const [minutes, setMinutes] = useState(originalMins);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const totalMinutes = hours * 60 + minutes;
    if (totalMinutes <= 0) {
      alert('Duration must be greater than 0');
      return;
    }

    if (reason.trim().length < 10) {
      alert('Reason must be at least 10 characters');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch(`/api/time-entries/${timeEntry.id}/adjust`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newDurationSeconds: totalMinutes * 60,
          reason: reason.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Failed to adjust time entry');
        setSubmitting(false);
        return;
      }

      onAdjusted();
    } catch (error) {
      console.error('Error adjusting time entry:', error);
      alert('Failed to adjust time entry');
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Adjust Time Entry</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Technician
            </label>
            <div className="text-sm text-gray-900 font-medium">
              {timeEntry.user.name}
            </div>
          </div>

          <div className="bg-gray-50 p-3 rounded">
            <div className="text-xs text-gray-500 mb-1">Original Duration</div>
            <div className="text-lg font-medium text-gray-900">
              {originalHours}h {originalMins}m
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Duration <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Hours</label>
                <input
                  type="number"
                  min="0"
                  value={hours}
                  onChange={(e) => setHours(parseInt(e.target.value) || 0)}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Minutes</label>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={minutes}
                  onChange={(e) => setMinutes(parseInt(e.target.value) || 0)}
                  className="input-field"
                  required
                />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Total: {hours * 60 + minutes} minutes
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reason for Adjustment <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="input-field"
              rows={3}
              placeholder="Explain why this adjustment is being made (minimum 10 characters)"
              required
              minLength={10}
            />
            <p className="text-xs text-gray-500 mt-1">
              {reason.length}/10 characters minimum
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
              disabled={submitting || reason.trim().length < 10}
            >
              {submitting ? 'Adjusting...' : 'Adjust Time'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
