interface DashboardCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: string;
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'orange' | 'gray';
  trend?: {
    value: number;
    isPositive: boolean;
  };
  onClick?: () => void;
}

export default function DashboardCard({
  title,
  value,
  subtitle,
  icon,
  color = 'blue',
  trend,
  onClick
}: DashboardCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200',
    green: 'bg-green-50 border-green-200',
    red: 'bg-red-50 border-red-200',
    yellow: 'bg-yellow-50 border-yellow-200',
    purple: 'bg-purple-50 border-purple-200',
    orange: 'bg-orange-50 border-orange-200',
    gray: 'bg-gray-50 border-gray-200',
  };

  const textColorClasses = {
    blue: 'text-blue-900',
    green: 'text-green-900',
    red: 'text-red-900',
    yellow: 'text-yellow-900',
    purple: 'text-purple-900',
    orange: 'text-orange-900',
    gray: 'text-gray-900',
  };

  return (
    <div
      onClick={onClick}
      className={`${colorClasses[color]} border-2 rounded-lg p-4 md:p-6 transition-all ${
        onClick ? 'cursor-pointer hover:shadow-md hover:scale-105' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="text-sm font-medium text-gray-600 mb-1">{title}</div>
          <div className={`dashboard-card-metric ${textColorClasses[color]}`}>
            {value}
          </div>
          {subtitle && (
            <div className="text-xs text-gray-500 mt-1">{subtitle}</div>
          )}
          {trend && (
            <div className={`text-xs mt-2 font-medium ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
            </div>
          )}
        </div>
        {icon && (
          <div className="text-2xl md:text-3xl ml-2">{icon}</div>
        )}
      </div>
    </div>
  );
}
