import DashboardCard from './DashboardCard';
import Link from 'next/link';

interface PartsDashboardProps {
  data: {
    role: string;
    inventoryStats: {
      totalParts: number;
      lowStockCount: number;
      criticalStockCount: number;
      totalValue: number;
    };
    lowStockParts: any[];
    recentTransactions: any[];
  };
}

export default function PartsDashboard({ data }: PartsDashboardProps) {
  const { inventoryStats, lowStockParts, recentTransactions } = data;

  return (
    <div className="space-y-6">
      {/* Inventory Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <DashboardCard
          title="Total Parts"
          value={inventoryStats.totalParts}
          icon="📦"
          color="blue"
        />
        <DashboardCard
          title="Low Stock Items"
          value={inventoryStats.lowStockCount}
          icon="⚠️"
          color="orange"
        />
        <DashboardCard
          title="Critical Stock"
          value={inventoryStats.criticalStockCount}
          subtitle="< 3 on hand"
          icon="🚨"
          color="red"
        />
        <DashboardCard
          title="Total Inventory Value"
          value={`$${inventoryStats.totalValue.toLocaleString()}`}
          icon="💰"
          color="green"
        />
      </div>

      {/* Low Stock Alert */}
      {lowStockParts.length > 0 && (
        <div className="alert-card">
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-sm font-semibold text-orange-900">⚠️ Low Stock Alert</h3>
            <Link
              href="/parts?lowStock=true"
              className="text-sm font-medium text-orange-700 hover:text-orange-900"
            >
              View All →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-orange-200">
              <thead>
                <tr>
                  <th className="text-left text-xs font-medium text-orange-900 uppercase">Part #</th>
                  <th className="text-left text-xs font-medium text-orange-900 uppercase">Description</th>
                  <th className="text-right text-xs font-medium text-orange-900 uppercase">On Hand</th>
                  <th className="text-right text-xs font-medium text-orange-900 uppercase">Reorder Level</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-orange-100">
                {lowStockParts.slice(0, 5).map((part: any) => (
                  <tr key={part.id}>
                    <td className="py-2 text-sm font-medium text-orange-900">{part.partNumber}</td>
                    <td className="py-2 text-sm text-orange-800">{part.description}</td>
                    <td className="py-2 text-right text-sm font-semibold text-orange-900">{part.quantityOnHand}</td>
                    <td className="py-2 text-right text-sm text-orange-700">{part.reorderLevel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent Transactions */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900">Recent Transactions</h3>
        </div>
        <ul className="divide-y divide-gray-200">
          {recentTransactions.length === 0 ? (
            <li className="px-4 py-8 text-center text-sm text-gray-500">No recent transactions</li>
          ) : (
            recentTransactions.slice(0, 10).map((txn: any) => (
              <li key={txn.id} className="px-4 py-3 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-gray-900">{txn.part.partNumber}</span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        txn.type === 'ISSUE' ? 'bg-red-100 text-red-800' :
                        txn.type === 'PURCHASE' ? 'bg-green-100 text-green-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {txn.type}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 truncate">{txn.part.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500">
                        Qty: {txn.quantity}
                      </span>
                      {txn.workOrderId && (
                        <span className="text-xs text-gray-500">
                          • WO ID: {txn.workOrderId}
                        </span>
                      )}
                      {txn.user && (
                        <span className="text-xs text-gray-500">
                          • By: {txn.user.name}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-gray-500 ml-2">
                    {new Date(txn.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
