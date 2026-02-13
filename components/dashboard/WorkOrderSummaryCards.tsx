import { useRouter } from 'next/navigation';
import DashboardCard from './DashboardCard';

interface WorkOrderSummaryCardsProps {
  summary: {
    open: number;
    inProgress: number;
    onHold: number;
    qc: number;
    readyToBill: number;
    total: number;
  };
  showTotal?: boolean;
}

export default function WorkOrderSummaryCards({ summary, showTotal = false }: WorkOrderSummaryCardsProps) {
  const router = useRouter();

  const cards = [
    {
      title: 'Open',
      value: summary.open,
      color: 'blue' as const,
      icon: '📋',
      status: 'OPEN'
    },
    {
      title: 'In Progress',
      value: summary.inProgress,
      color: 'yellow' as const,
      icon: '⚙️',
      status: 'IN_PROGRESS'
    },
    {
      title: 'On Hold',
      value: summary.onHold,
      color: 'orange' as const,
      icon: '⏸️',
      status: 'ON_HOLD'
    },
    {
      title: 'QC',
      value: summary.qc,
      color: 'purple' as const,
      icon: '✓',
      status: 'QC'
    },
    {
      title: 'Ready to Bill',
      value: summary.readyToBill,
      color: 'green' as const,
      icon: '💵',
      status: 'READY_TO_BILL'
    },
  ];

  if (showTotal) {
    cards.push({
      title: 'Total',
      value: summary.total,
      color: 'blue' as const,
      icon: '📊',
      status: ''
    });
  }

  return (
    <>
      {cards.map((card) => (
        <DashboardCard
          key={card.title}
          title={card.title}
          value={card.value}
          icon={card.icon}
          color={card.color}
          onClick={card.status ? () => router.push(`/work-orders?status=${card.status}`) : undefined}
        />
      ))}
    </>
  );
}
