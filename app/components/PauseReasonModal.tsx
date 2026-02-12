'use client';

import { useState } from 'react';

interface PauseReasonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void;
  lineItemDescription: string;
}

const COMMON_REASONS = [
  { value: 'Parts needed', icon: '🔧', color: 'orange' },
  { value: 'Waiting for approval', icon: '⏳', color: 'yellow' },
  { value: 'Equipment unavailable', icon: '🛠️', color: 'red' },
  { value: 'Break/Lunch', icon: '☕', color: 'green' },
  { value: 'Called to another job', icon: '📞', color: 'blue' },
  { value: 'End of shift', icon: '🏁', color: 'purple' },
  { value: 'Other', icon: '✏️', color: 'gray' },
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
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full animate-in fade-in duration-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
              <span className="text-xl">⏸️</span>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Stop Timer</h2>
              <p className="text-sm text-gray-500 mt-0.5">Why are you pausing work?</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
            <p className="text-sm text-blue-900">
              <span className="font-medium">Current task:</span> {lineItemDescription}
            </p>
          </div>

          <div className="space-y-2 mb-6">
            {COMMON_REASONS.map((reason) => (
              <button
                key={reason.value}
                onClick={() => setSelectedReason(reason.value)}
                className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-all duration-200 flex items-center gap-3 ${
                  selectedReason === reason.value
                    ? 'border-blue-500 bg-blue-50 shadow-sm'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <span className="text-2xl">{reason.icon}</span>
                <span className={`font-medium ${
                  selectedReason === reason.value ? 'text-blue-900' : 'text-gray-700'
                }`}>
                  {reason.value}
                </span>
                {selectedReason === reason.value && (
                  <svg className="w-5 h-5 ml-auto text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            ))}
          </div>

          {isOtherSelected && (
            <div className="mb-6 animate-in fade-in duration-200">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Please specify the reason:
              </label>
              <textarea
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                className="input-field"
                rows={3}
                placeholder="Enter a brief description..."
                autoFocus
              />
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="btn-danger flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Stop Timer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
