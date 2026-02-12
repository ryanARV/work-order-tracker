'use client';

import { useEffect, useState } from 'react';

interface WorkOrderSummary {
  workOrder: {
    id: string;
    woNumber: string;
    customer: {
      name: string;
    };
  };
  totalSeconds: number;
  entryCount: number;
}

interface WeeklySummary {
  totalSeconds: number;
  startOfWeek: string;
  endOfWeek: string;
  workOrderSummaries: WorkOrderSummary[];
  entryCount: number;
}

export default function WeeklyTimeSummary() {
  const [summary, setSummary] = useState<WeeklySummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    try {
      const res = await fetch('/api/timer/weekly-summary');
      const data = await res.json();
      setSummary(data);
    } catch (error) {
      console.error('Error fetching weekly summary:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatHours = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="bg-white shadow-md rounded-lg p-6">
        <div className="text-sm text-gray-500">Loading weekly summary...</div>
      </div>
    );
  }

  if (!summary) {
    return null;
  }

  const totalHours = summary.totalSeconds / 3600;

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">This Week</h2>
          <p className="text-sm text-gray-500">
            {formatDate(summary.startOfWeek)} - {formatDate(summary.endOfWeek)}
          </p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-blue-600">
            {formatHours(summary.totalSeconds)}
          </div>
          <div className="text-xs text-gray-500">
            {summary.entryCount} {summary.entryCount === 1 ? 'entry' : 'entries'}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-xs text-gray-600 mb-1">
          <span>Weekly Progress</span>
          <span>{totalHours.toFixed(1)} / 40 hours</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${
              totalHours >= 40
                ? 'bg-green-500'
                : totalHours >= 30
                ? 'bg-blue-500'
                : 'bg-yellow-500'
            }`}
            style={{ width: `${Math.min((totalHours / 40) * 100, 100)}%` }}
          ></div>
        </div>
      </div>

      {/* Work Order Breakdown */}
      {summary.workOrderSummaries.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            Breakdown by Work Order
          </h3>
          <div className="space-y-2">
            {summary.workOrderSummaries.map((wo) => (
              <div
                key={wo.workOrder.id}
                className="flex justify-between items-center p-3 bg-gray-50 rounded-md"
              >
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">
                    {wo.workOrder.woNumber}
                  </div>
                  <div className="text-xs text-gray-500">
                    {wo.workOrder.customer.name} • {wo.entryCount}{' '}
                    {wo.entryCount === 1 ? 'entry' : 'entries'}
                  </div>
                </div>
                <div className="text-sm font-semibold text-blue-600">
                  {formatHours(wo.totalSeconds)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {summary.workOrderSummaries.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500 text-sm">No time entries this week yet</p>
        </div>
      )}
    </div>
  );
}
