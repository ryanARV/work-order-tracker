'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'TECH';
}

interface ExceptionsData {
  staleTimers: {
    count: number;
    entries: any[];
  };
  readyToBillWithUnapproved: {
    count: number;
    workOrders: any[];
  };
  editedAfterApproval: {
    count: number;
    entries: any[];
  };
  doneWithNoTime: {
    count: number;
    lineItems: any[];
  };
  orphanedEntries: {
    count: number;
    entries: any[];
  };
}

export default function ExceptionsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [exceptions, setExceptions] = useState<ExceptionsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userRes, exceptionsRes] = await Promise.all([
          fetch('/api/auth/me'),
          fetch('/api/admin/exceptions'),
        ]);

        if (!userRes.ok) {
          router.push('/login');
          return;
        }

        const userData = await userRes.json();

        if (userData.user.role !== 'ADMIN') {
          router.push('/');
          return;
        }

        setUser(userData.user);

        if (exceptionsRes.ok) {
          const exceptionsData = await exceptionsRes.json();
          setExceptions(exceptionsData);
        }
      } catch (error) {
        console.error('Error fetching exceptions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const formatDuration = (startTs: string) => {
    const start = new Date(startTs).getTime();
    const now = Date.now();
    const durationMs = now - start;
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user || !exceptions) {
    return null;
  }

  const totalIssues =
    exceptions.staleTimers.count +
    exceptions.readyToBillWithUnapproved.count +
    exceptions.editedAfterApproval.count +
    exceptions.doneWithNoTime.count +
    exceptions.orphanedEntries.count;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="text-blue-600 hover:text-blue-800 mb-4"
          >
            ← Back
          </button>

          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">
              Exceptions Dashboard
            </h1>
            <div
              className={`text-2xl font-bold ${
                totalIssues > 0 ? 'text-red-600' : 'text-green-600'
              }`}
            >
              {totalIssues} Issue{totalIssues !== 1 ? 's' : ''}
            </div>
          </div>
          <p className="text-gray-600 mt-2">
            Operational oversight - identify and resolve data issues
          </p>
        </div>

        <div className="space-y-6">
          {/* Stale Timers */}
          <div className="bg-white shadow-md rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Active Timers &gt; 8 Hours
              </h2>
              <span
                className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  exceptions.staleTimers.count > 0
                    ? 'bg-red-100 text-red-800'
                    : 'bg-green-100 text-green-800'
                }`}
              >
                {exceptions.staleTimers.count}
              </span>
            </div>
            {exceptions.staleTimers.count === 0 ? (
              <p className="text-gray-500">No stale timers</p>
            ) : (
              <div className="space-y-2">
                {exceptions.staleTimers.entries.map((entry: any) => (
                  <div
                    key={entry.id}
                    className="border border-gray-200 rounded p-3 bg-red-50"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium text-gray-900">
                          {entry.user.name}
                        </div>
                        <div className="text-sm text-gray-600">
                          {entry.workOrder.woNumber} - {entry.lineItem.description}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Started: {new Date(entry.startTs).toLocaleString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-red-600">
                          {formatDuration(entry.startTs)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Ready to Bill with Unapproved */}
          <div className="bg-white shadow-md rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Ready to Bill with Unapproved Time
              </h2>
              <span
                className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  exceptions.readyToBillWithUnapproved.count > 0
                    ? 'bg-red-100 text-red-800'
                    : 'bg-green-100 text-green-800'
                }`}
              >
                {exceptions.readyToBillWithUnapproved.count}
              </span>
            </div>
            {exceptions.readyToBillWithUnapproved.count === 0 ? (
              <p className="text-gray-500">No issues found</p>
            ) : (
              <div className="space-y-2">
                {exceptions.readyToBillWithUnapproved.workOrders.map((wo: any) => (
                  <div
                    key={wo.id}
                    className="border border-gray-200 rounded p-3 bg-red-50 cursor-pointer hover:bg-red-100"
                    onClick={() => router.push(`/work-orders/${wo.id}`)}
                  >
                    <div className="font-medium text-gray-900">
                      {wo.woNumber} - {wo.customer.name}
                    </div>
                    <div className="text-sm text-red-600 mt-1">
                      {wo.timeEntries.length} unapproved time{' '}
                      {wo.timeEntries.length !== 1 ? 'entries' : 'entry'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Edited After Approval */}
          <div className="bg-white shadow-md rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Time Entries Edited After Approval
              </h2>
              <span
                className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  exceptions.editedAfterApproval.count > 0
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-green-100 text-green-800'
                }`}
              >
                {exceptions.editedAfterApproval.count}
              </span>
            </div>
            {exceptions.editedAfterApproval.count === 0 ? (
              <p className="text-gray-500">No edited entries</p>
            ) : (
              <div className="space-y-2">
                {exceptions.editedAfterApproval.entries.slice(0, 10).map((entry: any) => (
                  <div
                    key={entry.id}
                    className="border border-gray-200 rounded p-3 bg-yellow-50"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium text-gray-900">
                          {entry.user.name}
                        </div>
                        <div className="text-sm text-gray-600">
                          {entry.workOrder.woNumber} - {entry.lineItem.description}
                        </div>
                        {entry.editedReason && (
                          <div className="text-xs text-gray-700 mt-1 italic">
                            Reason: {entry.editedReason}
                          </div>
                        )}
                        <div className="text-xs text-gray-500 mt-1">
                          Edited: {new Date(entry.editedAt).toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <span
                          className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                            entry.approvalState === 'LOCKED'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {entry.approvalState}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Done with No Time */}
          <div className="bg-white shadow-md rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Line Items Marked DONE with Zero Time
              </h2>
              <span
                className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  exceptions.doneWithNoTime.count > 0
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-green-100 text-green-800'
                }`}
              >
                {exceptions.doneWithNoTime.count}
              </span>
            </div>
            {exceptions.doneWithNoTime.count === 0 ? (
              <p className="text-gray-500">No issues found</p>
            ) : (
              <div className="space-y-2">
                {exceptions.doneWithNoTime.lineItems.slice(0, 10).map((item: any) => (
                  <div
                    key={item.id}
                    className="border border-gray-200 rounded p-3 bg-yellow-50 cursor-pointer hover:bg-yellow-100"
                    onClick={() => router.push(`/work-orders/${item.workOrder.id}`)}
                  >
                    <div className="font-medium text-gray-900">{item.description}</div>
                    <div className="text-sm text-gray-600">
                      {item.workOrder.woNumber} - {item.workOrder.customer.name}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Orphaned Entries */}
          {exceptions.orphanedEntries.count > 0 && (
            <div className="bg-white shadow-md rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  Orphaned Time Entries
                </h2>
                <span className="px-3 py-1 rounded-full text-sm font-semibold bg-red-100 text-red-800">
                  {exceptions.orphanedEntries.count}
                </span>
              </div>
              <div className="space-y-2">
                {exceptions.orphanedEntries.entries.map((entry: any) => (
                  <div
                    key={entry.id}
                    className="border border-gray-200 rounded p-3 bg-red-50"
                  >
                    <div className="font-medium text-gray-900">{entry.user.name}</div>
                    <div className="text-sm text-red-600">
                      Deleted parent: {entry.workOrder?.woNumber || 'N/A'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
