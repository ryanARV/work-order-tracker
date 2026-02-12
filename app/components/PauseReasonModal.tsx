'use client';

import { useState } from 'react';

interface PauseReasonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void;
  lineItemDescription: string;
}

const COMMON_REASONS = [
  'Parts needed',
  'Waiting for approval',
  'Equipment unavailable',
  'Break/Lunch',
  'Called to another job',
  'End of shift',
  'Other',
];

export default function PauseReasonModal({
  isOpen,
  onClose,
  onSubmit,
  lineItemDescription,
}: PauseReasonModalProps) {
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [customReason, setCustomReason] = useState<string>('');

  if (!isOpen) return null;

  const handleSubmit = () => {
    const reason = selectedReason === 'Other' ? customReason : selectedReason;
    if (reason.trim()) {
      onSubmit(reason);
      setSelectedReason('');
      setCustomReason('');
    }
  };

  const isOtherSelected = selectedReason === 'Other';
  const canSubmit = selectedReason && (isOtherSelected ? customReason.trim() : true);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-2">Pause Timer</h2>
          <p className="text-sm text-gray-600 mb-4">
            Why are you stopping work on: <span className="font-medium">{lineItemDescription}</span>?
          </p>

          <div className="space-y-2 mb-4">
            {COMMON_REASONS.map((reason) => (
              <button
                key={reason}
                onClick={() => setSelectedReason(reason)}
                className={`w-full text-left px-4 py-2 rounded border transition-colors ${
                  selectedReason === reason
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                }`}
              >
                {reason}
              </button>
            ))}
          </div>

          {isOtherSelected && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Please specify:
              </label>
              <textarea
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Enter reason..."
                autoFocus
              />
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className={`flex-1 px-4 py-2 rounded transition-colors ${
                canSubmit
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Stop Timer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
