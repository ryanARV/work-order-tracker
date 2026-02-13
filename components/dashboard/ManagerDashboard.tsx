import WorkOrderSummaryCards from './WorkOrderSummaryCards';
import WorkOrderStatusChart from './WorkOrderStatusChart';
import TeamPerformanceChart from './TeamPerformanceChart';
import RecentActivityList from './RecentActivityList';
import DashboardCard from './DashboardCard';
import Link from 'next/link';

interface ManagerDashboardProps {
  data: {
    role: string;
    workOrderSummary: {
      open: number;
      inProgress: number;
      onHold: number;
      qc: number;
      readyToBill: number;
      total: number;
    };
    teamPerformance: {
      totalTechs: number;
      averageEfficiency: number;
      topPerformer: { name: string; efficiency: number } | null;
      weeklyHours: number;
      techStats: Array<{ name: string; efficiency: number }>;
    };
    agingAlerts: {
      critical: number;
      stale: number;
      aging: number;
    };
    approvalsNeeded: {
      timeEntries: number;
      estimates: number;
    };
    recentActivity: any[];
  };
}

export default function ManagerDashboard({ data }: ManagerDashboardProps) {
  const { workOrderSummary, teamPerformance, agingAlerts, approvalsNeeded, recentActivity } = data;

  const hasAging = agingAlerts.critical > 0 || agingAlerts.stale > 0 || agingAlerts.aging > 0;

  return (
    <div className="space-y-6">
      {/* Work Order Summary */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <WorkOrderSummaryCards summary={workOrderSummary} />
      </div>

      {/* Team Performance Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <DashboardCard
          title="Total Technicians"
          value={teamPerformance.totalTechs}
          icon="👷"
          color="blue"
        />
        <DashboardCard
          title="Avg Efficiency"
          value={`${teamPerformance.averageEfficiency}%`}
          subtitle="target: < 100%"
          icon="📊"
          color={teamPerformance.averageEfficiency <= 100 ? 'green' : teamPerformance.averageEfficiency <= 120 ? 'yellow' : 'red'}
        />
        <DashboardCard
          title="Top Performer"
          value={teamPerformance.topPerformer?.name || 'N/A'}
          subtitle={teamPerformance.topPerformer ? `${teamPerformance.topPerformer.efficiency}%` : ''}
          icon="🏆"
          color="green"
        />
        <DashboardCard
          title="Weekly Hours"
          value={teamPerformance.weeklyHours}
          subtitle="total team hours"
          icon="⏰"
          color="purple"
        />
      </div>

      {/* Alerts and Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Aging Alerts */}
        {hasAging && (
          <div className="alert-card">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-sm font-semibold text-orange-900">⚠️ Aging Work Orders</h3>
              <Link
                href="/reports/wip-aging"
                className="text-sm font-medium text-orange-700 hover:text-orange-900"
              >
                View Report →
              </Link>
            </div>
            <div className="space-y-2">
              {agingAlerts.critical > 0 && (
                <div className="flex justify-between items-center p-2 bg-red-100 rounded">
                  <span className="text-sm font-medium text-red-900">Critical (30+ days)</span>
                  <span className="text-lg font-bold text-red-900">{agingAlerts.critical}</span>
                </div>
              )}
              {agingAlerts.stale > 0 && (
                <div className="flex justify-between items-center p-2 bg-orange-100 rounded">
                  <span className="text-sm font-medium text-orange-900">Stale (15-30 days)</span>
                  <span className="text-lg font-bold text-orange-900">{agingAlerts.stale}</span>
                </div>
              )}
              {agingAlerts.aging > 0 && (
                <div className="flex justify-between items-center p-2 bg-yellow-100 rounded">
                  <span className="text-sm font-medium text-yellow-900">Aging (8-14 days)</span>
                  <span className="text-lg font-bold text-yellow-900">{agingAlerts.aging}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Approvals Needed */}
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 md:p-6">
          <h3 className="text-sm font-semibold text-blue-900 mb-4">📋 Approvals Needed</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-blue-800">Pending Time Entries</span>
              <span className="text-2xl font-bold text-blue-900">{approvalsNeeded.timeEntries}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-blue-800">Pending Estimates</span>
              <span className="text-2xl font-bold text-blue-900">{approvalsNeeded.estimates}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Team Performance Chart */}
      {teamPerformance.techStats && teamPerformance.techStats.length > 0 && (
        <TeamPerformanceChart data={teamPerformance.techStats} />
      )}

      {/* WO Status Chart */}
      <WorkOrderStatusChart data={workOrderSummary} />

      {/* Recent Activity */}
      <RecentActivityList workOrders={recentActivity} maxItems={10} />
    </div>
  );
}
