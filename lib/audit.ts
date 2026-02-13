import { prisma } from './db';

export interface AuditContext {
  entityType: string;
  entityId: string;
  action: string;
  actorId: string;
  before?: any;
  after?: any;
}

/**
 * Write an audit log entry
 * Used for tracking critical operations: approvals, edits, status changes
 */
export async function writeAuditLog(context: AuditContext): Promise<void> {
  await prisma.auditLog.create({
    data: {
      entityType: context.entityType,
      entityId: context.entityId,
      action: context.action,
      actorId: context.actorId,
      beforeJson: context.before ? JSON.stringify(context.before) : null,
      afterJson: context.after ? JSON.stringify(context.after) : null,
    },
  });
}

/**
 * Batch write audit logs (used in transactions)
 */
export function createAuditLogData(context: AuditContext) {
  return {
    entityType: context.entityType,
    entityId: context.entityId,
    action: context.action,
    actorId: context.actorId,
    beforeJson: context.before ? JSON.stringify(context.before) : null,
    afterJson: context.after ? JSON.stringify(context.after) : null,
  };
}

/**
 * Audit actions for time entries
 */
export const TimeEntryActions = {
  START: 'START_TIMER',
  STOP: 'STOP_TIMER',
  APPROVE: 'APPROVE',
  LOCK: 'LOCK',
  UNLOCK: 'UNLOCK_FOR_CORRECTION',
  EDIT: 'EDIT',
  DELETE: 'DELETE',
} as const;

/**
 * Audit actions for work orders
 */
export const WorkOrderActions = {
  CREATE: 'CREATE',
  STATUS_CHANGE: 'STATUS_CHANGE',
  MARK_READY_TO_BILL: 'MARK_READY_TO_BILL',
  QC_APPROVE: 'QC_APPROVE',
  QC_REJECT: 'QC_REJECT',
  TOGGLE_OOS: 'TOGGLE_OUT_OF_SERVICE',
  CLOSE: 'CLOSE',
} as const;

/**
 * Audit actions for line items
 */
export const LineItemActions = {
  CREATE: 'CREATE',
  EDIT: 'EDIT',
  MARK_DONE: 'MARK_DONE',
  ASSIGN: 'ASSIGN_TECH',
  UNASSIGN: 'UNASSIGN_TECH',
} as const;
