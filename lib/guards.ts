import { ApprovalState } from '@prisma/client';
import { prisma } from './db';

/**
 * Guard: Prevents modification of LOCKED time entries
 * LOCKED entries represent billed time and must not be changed without explicit unlock
 */
export function assertNotLocked(approvalState: ApprovalState, context: string): void {
  if (approvalState === 'LOCKED') {
    throw new Error(
      `Cannot ${context}: Time entry is LOCKED. Must unlock for correction first.`
    );
  }
}

/**
 * Guard: Ensures time entry exists and is not locked
 */
export async function assertTimeEntryMutable(
  timeEntryId: string,
  userId: string
): Promise<{ id: string; approvalState: ApprovalState; userId: string }> {
  const entry = await prisma.timeEntry.findFirst({
    where: {
      id: timeEntryId,
      deletedAt: null,
    },
    select: {
      id: true,
      approvalState: true,
      userId: true,
    },
  });

  if (!entry) {
    throw new Error('Time entry not found');
  }

  if (entry.userId !== userId) {
    throw new Error('Time entry does not belong to this user');
  }

  assertNotLocked(entry.approvalState, 'modify time entry');

  return entry;
}

/**
 * Unlock a LOCKED time entry for correction
 * Requires admin role and explicit reason
 */
export async function unlockForCorrection(
  timeEntryId: string,
  adminUserId: string,
  reason: string
): Promise<void> {
  if (!reason || reason.trim().length < 10) {
    throw new Error('Unlock reason must be at least 10 characters');
  }

  const entry = await prisma.timeEntry.findUnique({
    where: { id: timeEntryId },
  });

  if (!entry) {
    throw new Error('Time entry not found');
  }

  if (entry.approvalState !== 'LOCKED') {
    throw new Error('Time entry is not locked');
  }

  await prisma.$transaction([
    // Downgrade to APPROVED so it can be edited
    prisma.timeEntry.update({
      where: { id: timeEntryId },
      data: {
        approvalState: 'APPROVED',
        editedReason: reason,
        editedAt: new Date(),
      },
    }),

    // Audit the unlock action
    prisma.auditLog.create({
      data: {
        entityType: 'TimeEntry',
        entityId: timeEntryId,
        action: 'UNLOCK_FOR_CORRECTION',
        actorId: adminUserId,
        beforeJson: JSON.stringify({ approvalState: 'LOCKED' }),
        afterJson: JSON.stringify({ approvalState: 'APPROVED', reason }),
      },
    }),
  ]);
}

/**
 * Detect race condition from unique constraint violation
 */
export function isActiveTimerConstraintViolation(error: any): boolean {
  // PostgreSQL unique constraint violation error code
  return (
    error.code === 'P2002' &&
    error.meta?.target?.includes('time_entries_one_active_timer_per_user')
  );
}
