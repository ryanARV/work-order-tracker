import Link from 'next/link';

interface WorkOrder {
  id: string;
  woNumber: string;
  customer: {
    name: string;
  };
  status: string;
  priority: string | null;
  createdAt: string;
}

interface RecentActivityListProps {
  workOrders: WorkOrder[];
  maxItems?: number;
  showViewAll?: boolean;
}

export default function RecentActivityList({
  workOrders,
  maxItems = 10,
  showViewAll = true
}: RecentActivityListProps) {
  const displayedOrders = workOrders.slice(0, maxItems);

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      OPEN: 'bg-blue-100 text-blue-800',
      IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
      ON_HOLD_PARTS: 'bg-orange-100 text-orange-800',
      ON_HOLD_DELAY: 'bg-orange-100 text-orange-800',
      QC: 'bg-purple-100 text-purple-800',
      READY_TO_BILL: 'bg-green-100 text-green-800',
      CLOSED: 'bg-gray-100 text-gray-800',
    };

    const labels: Record<string, string> = {
      OPEN: 'Open',
      IN_PROGRESS: 'In Progress',
      ON_HOLD_PARTS: 'On Hold - Parts',
      ON_HOLD_DELAY: 'On Hold - Delay',
      QC: 'QC',
      READY_TO_BILL: 'Ready to Bill',
      CLOSED: 'Closed',
    };

    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {labels[status] || status}
      </span>
    );
  };

  const getPriorityBadge = (priority: string | null) => {
    if (!priority) return null;

    const styles: Record<string, string> = {
      HIGH: 'bg-red-100 text-red-800',
      MEDIUM: 'bg-yellow-100 text-yellow-800',
      LOW: 'bg-green-100 text-green-800',
    };

    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${styles[priority.toUpperCase()] || ''}`}>
        {priority}
      </span>
    );
  };

  const timeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  if (displayedOrders.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
        <p className="text-sm">No recent work orders</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-900">Recent Activity</h3>
      </div>
      <ul className="divide-y divide-gray-200">
        {displayedOrders.map((wo) => (
          <li key={wo.id} className="hover:bg-gray-50 transition-colors">
            <Link href={`/work-orders/${wo.id}`} className="block px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-blue-600 hover:text-blue-800">
                      {wo.woNumber}
                    </span>
                    {getStatusBadge(wo.status)}
                    {wo.priority && getPriorityBadge(wo.priority)}
                  </div>
                  <p className="text-sm text-gray-900 truncate">{wo.customer.name}</p>
                  <p className="text-xs text-gray-500">{timeAgo(wo.createdAt)}</p>
                </div>
                <svg
                  className="w-5 h-5 text-gray-400 flex-shrink-0 ml-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          </li>
        ))}
      </ul>
      {showViewAll && workOrders.length > maxItems && (
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
          <Link
            href="/work-orders"
            className="text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center justify-center"
          >
            View All Work Orders
            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      )}
    </div>
  );
}
