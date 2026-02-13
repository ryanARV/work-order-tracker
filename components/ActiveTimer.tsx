'use client';

import { useEffect, useState } from 'react';

interface ActiveTimerProps {
  timer: {
    id: string;
    startTs: string;
    workOrder: {
      woNumber: string;
      customer: {
        name: string;
      };
    };
    lineItem: {
      description: string;
    };
  };
  onStop: (notes?: string, isGoodwill?: boolean) => void;
}

export default function ActiveTimer({ timer, onStop }: ActiveTimerProps) {
  const [elapsed, setElapsed] = useState(0);
  const [notes, setNotes] = useState('');
  const [showNotes, setShowNotes] = useState(false);
  const [isGoodwill, setIsGoodwill] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Calculate initial elapsed time
    const start = new Date(timer.startTs).getTime();
    const now = Date.now();
    setElapsed(Math.floor((now - start) / 1000));

    const interval = setInterval(() => {
      const start = new Date(timer.startTs).getTime();
      const now = Date.now();
      setElapsed(Math.floor((now - start) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [timer.startTs]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStop = () => {
    onStop(notes || undefined, isGoodwill);
    setNotes('');
    setShowNotes(false);
    setIsGoodwill(false);
  };

  return (
    <div className="bg-green-50 border-2 border-green-500 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <span className="font-semibold text-green-800">Timer Running</span>
        </div>
        <div className="text-2xl font-mono font-bold text-green-800">
          {mounted ? formatTime(elapsed) : '00:00:00'}
        </div>
      </div>

      <div className="text-sm text-gray-700 mb-3">
        <div className="font-medium">{timer.lineItem.description}</div>
        <div className="text-xs text-gray-600">
          {timer.workOrder.woNumber} - {timer.workOrder.customer.name}
        </div>
      </div>

      {showNotes && (
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add notes (optional)"
          className="w-full px-3 py-2 border border-gray-300 rounded-md mb-2 text-sm"
          rows={2}
        />
      )}

      <div className="mb-3 flex items-center">
        <input
          type="checkbox"
          id="goodwill-checkbox"
          checked={isGoodwill}
          onChange={(e) => setIsGoodwill(e.target.checked)}
          className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
        />
        <label htmlFor="goodwill-checkbox" className="ml-2 block text-sm text-gray-700">
          Mark as <span className="font-semibold text-purple-700">Goodwill</span> (non-billable)
        </label>
      </div>

      <div className="flex space-x-2">
        <button
          onClick={handleStop}
          className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg shadow-md transition-colors"
        >
          Stop Timer
        </button>
        <button
          onClick={() => setShowNotes(!showNotes)}
          className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 px-4 rounded-lg shadow-md transition-colors"
        >
          {showNotes ? 'Hide' : 'Notes'}
        </button>
      </div>
    </div>
  );
}
