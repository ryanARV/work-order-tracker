'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import ActiveTimer from '@/components/ActiveTimer';
import WeeklyTimeSummary from '@/components/WeeklyTimeSummary';
import PauseReasonModal from '@/app/components/PauseReasonModal';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'TECH';
}

interface LineItem {
  id: string;
  description: string;
  estimateMinutes: number | null;
  workOrder: {
    woNumber: string;
    priority: string | null;
    customer: {
      name: string;
    };
  };
  timeEntries: Array<{
    durationSeconds: number | null;
  }>;
}

interface ActiveTimer {
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
}

export default function MyWorkPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [activeTimer, setActiveTimer] = useState<ActiveTimer | null>(null);
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'OPEN' | 'DONE'>('ALL');
  const [showPauseModal, setShowPauseModal] = useState(false);
  const [pauseModalDescription, setPauseModalDescription] = useState('');
  const [pendingNotes, setPendingNotes] = useState<string | undefined>();

  const fetchData = async () => {
    try {
      const [userRes, timerRes, workRes] = await Promise.all([
        fetch('/api/auth/me'),
        fetch('/api/timer/active'),
        fetch('/api/line-items/my-work'),
      ]);

      if (!userRes.ok) {
        router.push('/login');
        return;
      }

      const userData = await userRes.json();
      const timerData = await timerRes.json();
      const workData = await workRes.json();

      setUser(userData.user);
      setActiveTimer(timerData.activeTimer);
      setLineItems(workData.lineItems);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleStartTimer = async (lineItemId: string) => {
    try {
      const res = await fetch('/api/timer/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lineItemId }),
      });

      if (res.ok) {
        await fetchData();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to start timer');
      }
    } catch (error) {
      console.error('Error starting timer:', error);
      alert('Failed to start timer');
    }
  };

  const handleStopTimerClick = (notes?: string) => {
    if (activeTimer) {
      setPendingNotes(notes);
      setPauseModalDescription(activeTimer.lineItem.description);
      setShowPauseModal(true);
    }
  };

  const handlePauseReasonSubmit = async (pauseReason: string) => {
    try {
      const res = await fetch('/api/timer/stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pauseReason, notes: pendingNotes }),
      });

      if (res.ok) {
        setShowPauseModal(false);
        setPendingNotes(undefined);
        await fetchData();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to stop timer');
      }
    } catch (error) {
      console.error('Error stopping timer:', error);
      alert('Failed to stop timer');
    }
  };

  const handleMarkDone = async (lineItemId: string) => {
    if (!confirm('Mark this task as done?')) return;

    try {
      const res = await fetch(`/api/line-items/${lineItemId}/done`, {
        method: 'POST',
      });

      if (res.ok) {
        await fetchData();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to mark as done');
      }
    } catch (error) {
      console.error('Error marking done:', error);
      alert('Failed to mark as done');
    }
  };

  const formatMinutes = (minutes: number | null) => {
    if (!minutes) return '0h 0m';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getTotalTracked = (item: LineItem) => {
    return item.timeEntries.reduce(
      (sum, entry) => sum + Math.floor((entry.durationSeconds || 0) / 60),
      0
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} />

      <div className="max-w-2xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">My Active Work</h1>

        {/* Weekly Time Summary */}
        <div className="mb-6">
          <WeeklyTimeSummary />
        </div>

        {activeTimer && (
          <ActiveTimer timer={activeTimer} onStop={handleStopTimerClick} />
        )}

        <PauseReasonModal
          isOpen={showPauseModal}
          onClose={() => setShowPauseModal(false)}
          onSubmit={handlePauseReasonSubmit}
          lineItemDescription={pauseModalDescription}
        />

        {/* Status Filter */}
        <div className="flex space-x-2 mb-4">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              statusFilter === 'ALL'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            All ({lineItems.length})
          </button>
          <button
            onClick={() => setStatusFilter('OPEN')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              statusFilter === 'OPEN'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Open ({lineItems.filter((li: any) => li.status === 'OPEN').length})
          </button>
          <button
            onClick={() => setStatusFilter('DONE')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              statusFilter === 'DONE'
                ? 'bg-green-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Done ({lineItems.filter((li: any) => li.status === 'DONE').length})
          </button>
        </div>

        {lineItems.filter((li: any) => statusFilter === 'ALL' || li.status === statusFilter).length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No active work assigned</p>
          </div>
        ) : (
          <div className="space-y-4">
            {lineItems
              .filter((li: any) => statusFilter === 'ALL' || li.status === statusFilter)
              .map((item) => {
              const totalTracked = getTotalTracked(item);
              const isOverEstimate =
                item.estimateMinutes && totalTracked > item.estimateMinutes;

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden"
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">
                          {item.description}
                        </h3>
                        <div className="text-sm text-gray-600">
                          <div>{item.workOrder.woNumber} - {item.workOrder.customer.name}</div>
                          {item.workOrder.priority && (
                            <div className="inline-block mt-1">
                              <span
                                className={`px-2 py-0.5 text-xs font-medium rounded ${
                                  item.workOrder.priority === 'HIGH'
                                    ? 'bg-red-100 text-red-800'
                                    : item.workOrder.priority === 'MEDIUM'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-green-100 text-green-800'
                                }`}
                              >
                                {item.workOrder.priority}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm mb-3">
                      <div>
                        <span className="text-gray-600">Estimate:</span>{' '}
                        <span className="font-medium">
                          {formatMinutes(item.estimateMinutes)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Tracked:</span>{' '}
                        <span
                          className={`font-medium ${
                            isOverEstimate ? 'text-red-600' : 'text-gray-900'
                          }`}
                        >
                          {formatMinutes(totalTracked)}
                        </span>
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleStartTimer(item.id)}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg shadow-md transition-colors"
                      >
                        {activeTimer?.lineItem ? 'Switch to This' : 'Start Timer'}
                      </button>
                      <button
                        onClick={() => handleMarkDone(item.id)}
                        className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg shadow-md transition-colors"
                      >
                        Done
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
