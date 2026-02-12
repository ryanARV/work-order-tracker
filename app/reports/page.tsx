'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ReportsPage() {
  const router = useRouter();

  useEffect(() => {
    // Check auth on mount
    fetch('/api/auth/me').then((res) => {
      if (!res.ok) {
        router.push('/login');
      }
    });
  }, [router]);

  const reports = [
    {
      id: 'actual-vs-estimated',
      title: 'Actual vs Estimated',
      description: 'Compare estimated time vs actual tracked time for all work orders. Track profitability and estimate accuracy.',
      icon: '📊',
      href: '/reports/actual-vs-estimated',
      color: 'bg-blue-50 hover:bg-blue-100 border-blue-200',
    },
    {
      id: 'wip-aging',
      title: 'WIP Aging',
      description: 'Track how long work orders have been in progress. Identify bottlenecks and stalled jobs.',
      icon: '⏱️',
      href: '/reports/wip-aging',
      color: 'bg-orange-50 hover:bg-orange-100 border-orange-200',
    },
    {
      id: 'tech-performance',
      title: 'Technician Performance',
      description: 'Individual technician productivity and efficiency metrics. Compare performance across the team.',
      icon: '👷',
      href: '/reports/tech-performance',
      color: 'bg-green-50 hover:bg-green-100 border-green-200',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-2 sm:p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-sm md:text-base text-gray-600 mt-2">
            Business intelligence and performance metrics for your service operations
          </p>
        </div>

        {/* Reports Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {reports.map((report) => (
            <Link
              key={report.id}
              href={report.href}
              className={`block p-6 rounded-lg border-2 transition-all ${report.color}`}
            >
              <div className="flex items-start">
                <div className="text-4xl mr-4">{report.icon}</div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{report.title}</h3>
                  <p className="text-sm text-gray-600">{report.description}</p>
                </div>
              </div>
              <div className="mt-4 text-blue-600 font-medium text-sm flex items-center">
                View Report
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          ))}
        </div>

        {/* Quick Stats Section */}
        <div className="mt-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Why Use Reports?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-blue-600 text-2xl mb-2">💰</div>
              <h3 className="font-semibold text-gray-900 mb-2">Improve Profitability</h3>
              <p className="text-sm text-gray-600">
                Track actual vs estimated time to identify which jobs are profitable and refine future estimates.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-orange-600 text-2xl mb-2">🚀</div>
              <h3 className="font-semibold text-gray-900 mb-2">Reduce Bottlenecks</h3>
              <p className="text-sm text-gray-600">
                WIP aging shows which jobs are stuck and need attention to keep work flowing smoothly.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-green-600 text-2xl mb-2">📈</div>
              <h3 className="font-semibold text-gray-900 mb-2">Optimize Team Performance</h3>
              <p className="text-sm text-gray-600">
                Identify top performers and provide targeted coaching where needed to improve overall efficiency.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
