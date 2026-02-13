import DashboardCard from './DashboardCard';
import DailyHoursChart from './DailyHoursChart';
import RecentActivityList from './RecentActivityList';

interface TechDashboardProps {
  data: {
    role: string;
    personalStats: {
      openTasks: number;
      doneTasks: number;
      totalTasks: number;
      weeklyHours: number;
      activeTimer: {
        workOrder: {
          id: string;
          woNumber: string;
          customer: {
            id: string;
            name: string;
          };
        };
        lineItem: {
          id: string;
          description: string;
        };
        durationSeconds: number;
        startTs: string;
      } | null;
    };
    dailyHours: Array<{
      day: string;
      hours: number;
    }>;
    recentActivity: Array<{
      id: string;
      woNumber: string;
      customer: {
        name: string;
      };
      status: string;
      priority: string | null;
      createdAt: string;
    }>;
  };
}

export default function TechDashboard({ data }: TechDashboardProps) {
  const { personalStats, dailyHours, recentActivity } = data;

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="space-y-6">
      {/* Active Timer Alert */}
      {personalStats.activeTimer && (
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 md:p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">⏱️</span>
                <h3 className="text-lg font-semibold text-blue-900">Timer Running</h3>
              </div>
              <p className="text-sm text-blue-800 mb-1">
                <span className="font-medium">{personalStats.activeTimer.workOrder.woNumber}</span> - {personalStats.activeTimer.workOrder.customer.name}
              </p>
              <p className="text-sm text-blue-700">{personalStats.activeTimer.lineItem.description}</p>
              <p className="text-lg font-bold text-blue-900 mt-2">
                {formatDuration(personalStats.activeTimer.durationSeconds)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Task Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <DashboardCard
          title="Open Tasks"
          value={personalStats.openTasks}
          icon="📋"
          color="blue"
        />
        <DashboardCard
          title="Completed Tasks"
          value={personalStats.doneTasks}
          icon="✅"
          color="green"
        />
        <DashboardCard
          title="Weekly Hours"
          value={personalStats.weeklyHours}
          subtitle="hours this week"
          icon="⏰"
          color="purple"
        />
      </div>

      {/* Daily Hours Chart */}
      <DailyHoursChart data={dailyHours} />

      {/* Recent Activity */}
      <RecentActivityList workOrders={recentActivity} maxItems={5} />
    </div>
  );
}
