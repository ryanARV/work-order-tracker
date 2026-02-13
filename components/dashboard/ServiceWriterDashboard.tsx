import WorkOrderSummaryCards from './WorkOrderSummaryCards';
import WorkOrderStatusChart from './WorkOrderStatusChart';
import RecentActivityList from './RecentActivityList';
import DashboardCard from './DashboardCard';

interface ServiceWriterDashboardProps {
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
    kanbanPreview: Record<string, number>;
    recentEstimates: any[];
    recentActivity: any[];
  };
}

export default function ServiceWriterDashboard({ data }: ServiceWriterDashboardProps) {
  const { workOrderSummary, kanbanPreview, recentEstimates, recentActivity } = data;

  return (
    <div className="space-y-6">
      {/* Work Order Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <WorkOrderSummaryCards summary={workOrderSummary} />
      </div>

      {/* Charts and Kanban Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WorkOrderStatusChart data={workOrderSummary} />

        {/* Kanban Preview */}
        <div className="bg-white rounded-lg shadow p-4 md:p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Kanban Board Preview</h3>
          <div className="space-y-2">
            {Object.entries(kanbanPreview).map(([column, count]) => (
              <div key={column} className="flex justify-between items-center">
                <span className="text-sm text-gray-700">{column.replace(/_/g, ' ')}</span>
                <span className="text-sm font-semibold text-gray-900">{count}</span>
              </div>
            ))}
          </div>
          <a
            href="/work-orders/board"
            className="mt-4 block text-center text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            View Full Board →
          </a>
        </div>
      </div>

      {/* Recent Activity */}
      <RecentActivityList workOrders={recentActivity} maxItems={10} />
    </div>
  );
}
