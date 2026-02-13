'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import ActiveTimer from '@/components/ActiveTimer';
import WeeklyTimeSummary from '@/components/WeeklyTimeSummary';
import PauseReasonModal from '@/app/components/PauseReasonModal';
import { useToast } from '@/components/ToastProvider';

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
  const toast = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [activeTimer, setActiveTimer] = useState<ActiveTimer | null>(null);
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'OPEN' | 'DONE'>('ALL');
  const [showPauseModal, setShowPauseModal] = useState(false);
  const [pauseModalDescription, setPauseModalDescription] = useState('');
  const [pendingNotes, setPendingNotes] = useState<string | undefined>();
  const [pendingGoodwill, setPendingGoodwill] = useState(false);

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
        toast.success('Timer started successfully');
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to start timer');
      }
    } catch (error) {
      console.error('Error starting timer:', error);
      toast.error('Failed to start timer');
    }
  };

  const handleStopTimerClick = (notes?: string, isGoodwill?: boolean) => {
    if (activeTimer) {
      setPendingNotes(notes);
      setPendingGoodwill(isGoodwill || false);
      setPauseModalDescription(activeTimer.lineItem.description);
      setShowPauseModal(true);
    }
  };

  const handlePauseReasonSubmit = async (pauseReason: string) => {
    try {
      const res = await fetch('/api/timer/stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pauseReason, notes: pendingNotes, isGoodwill: pendingGoodwill }),
      });

      if (res.ok) {
        setShowPauseModal(false);
        setPendingNotes(undefined);
        setPendingGoodwill(false);
        await fetchData();
        toast.success('Timer stopped successfully');
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to stop timer');
      }
    } catch (error) {
      console.error('Error stopping timer:', error);
      toast.error('Failed to stop timer');
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
        toast.success('Task marked as done');
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to mark as done');
      }
    } catch (error) {
      console.error('Error marking done:', error);
      toast.error('Failed to mark as done');
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600 font-medium">Loading your work...</p>
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

      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="section-header">My Active Work</h1>
          <p className="section-subheader">Track time and manage your assigned tasks</p>
        </div>

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
        <div className="card mb-4 p-4">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm ${
                statusFilter === 'ALL'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
              }`}
            >
              All ({lineItems.length})
            </button>
            <button
              onClick={() => setStatusFilter('OPEN')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm ${
                statusFilter === 'OPEN'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
              }`}
            >
              Open ({lineItems.filter((li: any) => li.status === 'OPEN').length})
            </button>
            <button
              onClick={() => setStatusFilter('DONE')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm ${
                statusFilter === 'DONE'
                  ? 'bg-green-600 text-white shadow-md'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
              }`}
            >
              Done ({lineItems.filter((li: any) => li.status === 'DONE').length})
            </button>
          </div>
        </div>

        {lineItems.filter((li: any) => statusFilter === 'ALL' || li.status === statusFilter).length === 0 ? (
          <div className="card text-center py-16">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">📋</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No tasks found</h3>
            <p className="text-gray-500">
              {statusFilter === 'ALL'
                ? 'You have no active work assigned at the moment'
                : `You have no ${statusFilter.toLowerCase()} tasks`}
            </p>
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
                  className="card hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-2 text-lg">
                        {item.description}
                      </h3>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div className="font-medium">{item.workOrder.woNumber} - {item.workOrder.customer.name}</div>
                        {item.workOrder.priority && (
                          <div className="inline-block mt-2">
                            <span
                              className={`badge ${
                                item.workOrder.priority === 'HIGH'
                                  ? 'badge-red'
                                  : item.workOrder.priority === 'MEDIUM'
                                  ? 'badge-yellow'
                                  : 'badge-green'
                              }`}
                            >
                              {item.workOrder.priority}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-3 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <div>
                        <span className="text-gray-600">Estimate:</span>{' '}
                        <span className="font-semibold text-gray-900">
                          {formatMinutes(item.estimateMinutes)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Tracked:</span>{' '}
                        <span
                          className={`font-semibold ${
                            isOverEstimate ? 'text-red-600' : 'text-gray-900'
                          }`}
                        >
                          {formatMinutes(totalTracked)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleStartTimer(item.id)}
                      className="flex-1 btn-primary"
                    >
                      {activeTimer?.lineItem ? 'Switch to This' : '▶ Start Timer'}
                    </button>
                    <button
                      onClick={() => handleMarkDone(item.id)}
                      className="btn-success"
                    >
                      ✓ Done
                    </button>
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
