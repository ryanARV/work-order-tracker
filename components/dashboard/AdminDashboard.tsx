import WorkOrderSummaryCards from './WorkOrderSummaryCards';
import WorkOrderStatusChart from './WorkOrderStatusChart';
import TeamPerformanceChart from './TeamPerformanceChart';
import RecentActivityList from './RecentActivityList';
import DashboardCard from './DashboardCard';
import Link from 'next/link';

interface AdminDashboardProps {
  data: {
    role: string;
    systemStats: {
      totalUsers: number;
      totalCustomers: number;
      activeWorkOrders: number;
    };
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
    inventoryStats: {
      totalParts: number;
      lowStockCount: number;
      totalValue: number;
    };
    agingAlerts: {
      critical: number;
      stale: number;
      aging: number;
    };
    recentActivity: any[];
  };
}

export default function AdminDashboard({ data }: AdminDashboardProps) {
  const { systemStats, workOrderSummary, teamPerformance, inventoryStats, agingAlerts, recentActivity } = data;

  const hasAging = agingAlerts.critical > 0 || agingAlerts.stale > 0 || agingAlerts.aging > 0;

  return (
    <div className="space-y-6">
      {/* System Overview Cards */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">System Overview</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <DashboardCard
            title="Active Users"
            value={systemStats.totalUsers}
            icon="👥"
            color="blue"
          />
          <DashboardCard
            title="Customers"
            value={systemStats.totalCustomers}
            icon="🏢"
            color="green"
          />
          <DashboardCard
            title="Active Work Orders"
            value={systemStats.activeWorkOrders}
            icon="📋"
            color="yellow"
          />
          <DashboardCard
            title="Total Parts"
            value={inventoryStats.totalParts}
            icon="📦"
            color="purple"
          />
          <DashboardCard
            title="Low Stock Items"
            value={inventoryStats.lowStockCount}
            icon="⚠️"
            color="orange"
          />
          <DashboardCard
            title="Inventory Value"
            value={`$${inventoryStats.totalValue.toLocaleString()}`}
            icon="💰"
            color="green"
          />
        </div>
      </div>

      {/* Work Order Summary */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Work Orders</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <WorkOrderSummaryCards summary={workOrderSummary} />
        </div>
      </div>

      {/* Team Performance Summary */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Team Performance</h2>
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
      </div>

      {/* Alerts */}
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {agingAlerts.critical > 0 && (
              <div className="flex justify-between items-center p-3 bg-red-100 rounded">
                <span className="text-sm font-medium text-red-900">Critical (30+ days)</span>
                <span className="text-2xl font-bold text-red-900">{agingAlerts.critical}</span>
              </div>
            )}
            {agingAlerts.stale > 0 && (
              <div className="flex justify-between items-center p-3 bg-orange-100 rounded">
                <span className="text-sm font-medium text-orange-900">Stale (15-30 days)</span>
                <span className="text-2xl font-bold text-orange-900">{agingAlerts.stale}</span>
              </div>
            )}
            {agingAlerts.aging > 0 && (
              <div className="flex justify-between items-center p-3 bg-yellow-100 rounded">
                <span className="text-sm font-medium text-yellow-900">Aging (8-14 days)</span>
                <span className="text-2xl font-bold text-yellow-900">{agingAlerts.aging}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WorkOrderStatusChart data={workOrderSummary} />
        {teamPerformance.techStats && teamPerformance.techStats.length > 0 && (
          <TeamPerformanceChart data={teamPerformance.techStats} />
        )}
      </div>

      {/* Recent Activity */}
      <RecentActivityList workOrders={recentActivity} maxItems={10} />
    </div>
  );
}
