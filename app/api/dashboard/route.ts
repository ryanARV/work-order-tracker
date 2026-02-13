import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const user = await requireAuth();

    // Calculate date ranges
    const now = new Date();
    const dayOfWeek = now.getDay();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - dayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);

    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);

    // Return role-specific dashboard data
    switch (user.role) {
      case 'TECH':
        return NextResponse.json(await getTechDashboard(user.id, startOfWeek, endOfWeek, thirtyDaysAgo));

      case 'SERVICE_WRITER':
        return NextResponse.json(await getServiceWriterDashboard(user.id, thirtyDaysAgo));

      case 'PARTS':
        return NextResponse.json(await getPartsDashboard(user.id, thirtyDaysAgo));

      case 'MANAGER':
        return NextResponse.json(await getManagerDashboard(user.id, startOfWeek, endOfWeek, thirtyDaysAgo));

      case 'ADMIN':
        return NextResponse.json(await getAdminDashboard(user.id, startOfWeek, endOfWeek, thirtyDaysAgo));

      default:
        return NextResponse.json(
          { error: 'Invalid role' },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('Dashboard API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    );
  }
}

// TECH Dashboard
async function getTechDashboard(userId: string, startOfWeek: Date, endOfWeek: Date, thirtyDaysAgo: Date) {
  const [lineItemsData, timeEntries, activeTimer, recentActivity] = await Promise.all([
    // Count open vs done line items
    prisma.lineItem.findMany({
      where: {
        deletedAt: null,
        assignments: {
          some: { userId }
        }
      },
      select: { id: true, status: true }
    }),

    // Get time entries for this week
    prisma.timeEntry.findMany({
      where: {
        userId,
        startTs: { gte: startOfWeek, lt: endOfWeek },
        deletedAt: null
      },
      select: {
        durationSeconds: true,
        startTs: true
      }
    }),

    // Get active timer
    prisma.timeEntry.findFirst({
      where: {
        userId,
        endTs: null,
        deletedAt: null
      },
      include: {
        workOrder: {
          select: {
            id: true,
            woNumber: true,
            customer: {
              select: { id: true, name: true }
            }
          }
        },
        lineItem: {
          select: {
            id: true,
            description: true
          }
        }
      }
    }),

    // Recent work orders assigned to tech
    prisma.workOrder.findMany({
      where: {
        deletedAt: null,
        lineItems: {
          some: {
            assignments: {
              some: { userId }
            }
          }
        }
      },
      select: {
        id: true,
        woNumber: true,
        status: true,
        priority: true,
        createdAt: true,
        customer: {
          select: { name: true }
        }
      },
      orderBy: { updatedAt: 'desc' },
      take: 5
    })
  ]);

  // Calculate stats
  const openTasks = lineItemsData.filter(li => li.status !== 'DONE').length;
  const doneTasks = lineItemsData.filter(li => li.status === 'DONE').length;
  const totalTasks = lineItemsData.length;

  const weeklySeconds = timeEntries.reduce((sum, entry) => sum + (entry.durationSeconds || 0), 0);
  const weeklyHours = Math.round((weeklySeconds / 3600) * 10) / 10;

  // Group time by day for chart
  const dailyHours = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(startOfWeek);
    day.setDate(startOfWeek.getDate() + i);
    const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][i];

    const dayStart = new Date(day);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(day);
    dayEnd.setHours(23, 59, 59, 999);

    const dayEntries = timeEntries.filter(e => {
      const entryDate = new Date(e.startTs);
      return entryDate >= dayStart && entryDate <= dayEnd;
    });

    const daySeconds = dayEntries.reduce((sum, entry) => sum + (entry.durationSeconds || 0), 0);
    const hours = Math.round((daySeconds / 3600) * 10) / 10;

    return { day: dayName, hours };
  });

  return {
    role: 'TECH',
    personalStats: {
      openTasks,
      doneTasks,
      totalTasks,
      weeklyHours,
      activeTimer: activeTimer ? {
        workOrder: activeTimer.workOrder,
        lineItem: activeTimer.lineItem,
        durationSeconds: activeTimer.durationSeconds,
        startTs: activeTimer.startTs
      } : null
    },
    dailyHours,
    recentActivity
  };
}

// SERVICE_WRITER Dashboard
async function getServiceWriterDashboard(userId: string, thirtyDaysAgo: Date) {
  const [workOrders, kanbanData, recentEstimates, recentActivity] = await Promise.all([
    // Get all active work orders for status summary
    prisma.workOrder.findMany({
      where: {
        deletedAt: null,
        status: { notIn: ['DRAFT', 'CLOSED'] }
      },
      select: { id: true, status: true }
    }),

    // Get kanban column counts
    prisma.workOrder.groupBy({
      by: ['kanbanColumn'],
      where: {
        deletedAt: null,
        kanbanColumn: { not: null }
      },
      _count: { id: true }
    }),

    // Recent estimates
    prisma.estimate.findMany({
      where: {
        deletedAt: null,
        createdAt: { gte: thirtyDaysAgo }
      },
      select: {
        id: true,
        estimateNumber: true,
        status: true,
        createdAt: true,
        customer: {
          select: { name: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    }),

    // Recent work orders
    prisma.workOrder.findMany({
      where: {
        deletedAt: null
      },
      select: {
        id: true,
        woNumber: true,
        status: true,
        priority: true,
        createdAt: true,
        customer: {
          select: { name: true }
        }
      },
      orderBy: { updatedAt: 'desc' },
      take: 10
    })
  ]);

  // Calculate status counts
  const statusCounts = {
    open: 0,
    inProgress: 0,
    onHold: 0,
    qc: 0,
    readyToBill: 0,
    total: workOrders.length
  };

  workOrders.forEach(wo => {
    if (wo.status === 'OPEN') statusCounts.open++;
    else if (wo.status === 'IN_PROGRESS') statusCounts.inProgress++;
    else if (wo.status === 'ON_HOLD_PARTS' || wo.status === 'ON_HOLD_DELAY') statusCounts.onHold++;
    else if (wo.status === 'QC') statusCounts.qc++;
    else if (wo.status === 'READY_TO_BILL') statusCounts.readyToBill++;
  });

  // Convert kanban data to object
  const kanbanPreview = kanbanData.reduce((acc, item) => {
    if (item.kanbanColumn) {
      acc[item.kanbanColumn] = item._count.id;
    }
    return acc;
  }, {} as Record<string, number>);

  return {
    role: 'SERVICE_WRITER',
    workOrderSummary: statusCounts,
    kanbanPreview,
    recentEstimates,
    recentActivity
  };
}

// PARTS Dashboard
async function getPartsDashboard(userId: string, thirtyDaysAgo: Date) {
  const [parts, lowStockParts, recentTransactions] = await Promise.all([
    // Get all parts for stats
    prisma.part.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        quantityOnHand: true,
        quantityReserved: true,
        reorderLevel: true,
        unitCost: true
      }
    }),

    // Get low stock parts
    prisma.$queryRaw`
      SELECT id, "partNumber", description, "quantityOnHand", "quantityReserved", "reorderLevel", location
      FROM parts
      WHERE "deletedAt" IS NULL
        AND ("quantityOnHand" - "quantityReserved" <= "reorderLevel" OR "quantityOnHand" < 3)
      ORDER BY ("quantityOnHand" - "quantityReserved") ASC
      LIMIT 10
    `,

    // Recent part transactions
    prisma.partTransaction.findMany({
      where: {
        createdAt: { gte: thirtyDaysAgo }
      },
      select: {
        id: true,
        type: true,
        quantity: true,
        workOrderId: true,
        createdAt: true,
        part: {
          select: {
            partNumber: true,
            description: true
          }
        },
        user: {
          select: {
            name: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    })
  ]);

  // Calculate stats
  const totalParts = parts.length;
  const lowStockCount = parts.filter(p => (p.quantityOnHand - p.quantityReserved) <= p.reorderLevel).length;
  const criticalStockCount = parts.filter(p => p.quantityOnHand < 3).length;
  const totalValue = parts.reduce((sum, p) => sum + (p.quantityOnHand * Number(p.unitCost)), 0);

  return {
    role: 'PARTS',
    inventoryStats: {
      totalParts,
      lowStockCount,
      criticalStockCount,
      totalValue: Math.round(totalValue * 100) / 100
    },
    lowStockParts,
    recentTransactions
  };
}

// MANAGER Dashboard
async function getManagerDashboard(userId: string, startOfWeek: Date, endOfWeek: Date, thirtyDaysAgo: Date) {
  const [workOrders, techStats, agingWOs, pendingApprovals, recentActivity] = await Promise.all([
    // Get all active work orders for status summary
    prisma.workOrder.findMany({
      where: {
        deletedAt: null,
        status: { notIn: ['DRAFT', 'CLOSED'] }
      },
      select: { id: true, status: true, createdAt: true }
    }),

    // Get tech performance stats
    prisma.user.findMany({
      where: {
        role: 'TECH',
        active: true
      },
      select: {
        id: true,
        name: true,
        timeEntries: {
          where: {
            startTs: { gte: startOfWeek, lt: endOfWeek },
            deletedAt: null
          },
          select: {
            durationSeconds: true,
            lineItem: {
              select: {
                estimateMinutes: true
              }
            }
          }
        }
      }
    }),

    // Aging work orders
    prisma.workOrder.findMany({
      where: {
        deletedAt: null,
        status: { notIn: ['CLOSED', 'DRAFT'] },
        createdAt: { lte: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000) }
      },
      select: { id: true, createdAt: true }
    }),

    // Pending approvals
    Promise.all([
      prisma.timeEntry.count({
        where: {
          deletedAt: null,
          approvalState: 'PENDING'
        }
      }),
      prisma.estimate.count({
        where: {
          deletedAt: null,
          status: 'PENDING_APPROVAL'
        }
      })
    ]),

    // Recent work orders
    prisma.workOrder.findMany({
      where: {
        deletedAt: null
      },
      select: {
        id: true,
        woNumber: true,
        status: true,
        priority: true,
        createdAt: true,
        customer: {
          select: { name: true }
        }
      },
      orderBy: { updatedAt: 'desc' },
      take: 10
    })
  ]);

  // Calculate work order status counts
  const statusCounts = {
    open: 0,
    inProgress: 0,
    onHold: 0,
    qc: 0,
    readyToBill: 0,
    total: workOrders.length
  };

  workOrders.forEach(wo => {
    if (wo.status === 'OPEN') statusCounts.open++;
    else if (wo.status === 'IN_PROGRESS') statusCounts.inProgress++;
    else if (wo.status === 'ON_HOLD_PARTS' || wo.status === 'ON_HOLD_DELAY') statusCounts.onHold++;
    else if (wo.status === 'QC') statusCounts.qc++;
    else if (wo.status === 'READY_TO_BILL') statusCounts.readyToBill++;
  });

  // Calculate team performance
  let totalWeeklyHours = 0;
  let totalEfficiency = 0;
  let techCount = 0;
  let topPerformer: { name: string; efficiency: number } | null = null;
  let lowestEfficiency = Infinity;

  const techPerformance = techStats.map(tech => {
    const totalSeconds = tech.timeEntries.reduce((sum, entry) => sum + (entry.durationSeconds || 0), 0);
    const totalActualMinutes = totalSeconds / 60;
    const totalEstimateMinutes = tech.timeEntries.reduce((sum, entry) => sum + (entry.lineItem?.estimateMinutes || 0), 0);

    const efficiency = totalEstimateMinutes > 0 ? (totalActualMinutes / totalEstimateMinutes) * 100 : 100;

    totalWeeklyHours += totalSeconds / 3600;

    if (totalEstimateMinutes > 0) {
      totalEfficiency += efficiency;
      techCount++;

      if (efficiency < lowestEfficiency) {
        lowestEfficiency = efficiency;
        topPerformer = { name: tech.name, efficiency: Math.round(efficiency * 10) / 10 };
      }
    }

    return {
      name: tech.name,
      efficiency: Math.round(efficiency * 10) / 10
    };
  });

  const averageEfficiency = techCount > 0 ? Math.round((totalEfficiency / techCount) * 10) / 10 : 0;

  // Calculate aging categories
  const now = Date.now();
  const agingCounts = {
    critical: 0,
    stale: 0,
    aging: 0
  };

  agingWOs.forEach(wo => {
    const ageInDays = (now - new Date(wo.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    if (ageInDays >= 30) agingCounts.critical++;
    else if (ageInDays >= 15) agingCounts.stale++;
    else if (ageInDays >= 8) agingCounts.aging++;
  });

  return {
    role: 'MANAGER',
    workOrderSummary: statusCounts,
    teamPerformance: {
      totalTechs: techStats.length,
      averageEfficiency,
      topPerformer,
      weeklyHours: Math.round(totalWeeklyHours * 10) / 10,
      techStats: techPerformance
    },
    agingAlerts: agingCounts,
    approvalsNeeded: {
      timeEntries: pendingApprovals[0],
      estimates: pendingApprovals[1]
    },
    recentActivity
  };
}

// ADMIN Dashboard
async function getAdminDashboard(userId: string, startOfWeek: Date, endOfWeek: Date, thirtyDaysAgo: Date) {
  // Admin gets everything
  const [systemCounts, managerData] = await Promise.all([
    Promise.all([
      prisma.user.count({ where: { active: true } }),
      prisma.customer.count({ where: { deletedAt: null } }),
      prisma.workOrder.count({
        where: {
          deletedAt: null,
          status: { notIn: ['CLOSED', 'DRAFT'] }
        }
      })
    ]),
    getManagerDashboard(userId, startOfWeek, endOfWeek, thirtyDaysAgo)
  ]);

  const [parts] = await Promise.all([
    prisma.part.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        quantityOnHand: true,
        quantityReserved: true,
        reorderLevel: true,
        unitCost: true
      }
    })
  ]);

  const totalParts = parts.length;
  const lowStockCount = parts.filter(p => (p.quantityOnHand - p.quantityReserved) <= p.reorderLevel).length;
  const totalValue = parts.reduce((sum, p) => sum + (p.quantityOnHand * p.unitCost), 0);

  return {
    role: 'ADMIN',
    systemStats: {
      totalUsers: systemCounts[0],
      totalCustomers: systemCounts[1],
      activeWorkOrders: systemCounts[2]
    },
    workOrderSummary: managerData.workOrderSummary,
    teamPerformance: managerData.teamPerformance,
    inventoryStats: {
      totalParts,
      lowStockCount,
      totalValue: Math.round(totalValue * 100) / 100
    },
    agingAlerts: managerData.agingAlerts,
    recentActivity: managerData.recentActivity
  };
}
