# Developer Guide - Hardened System

## Critical Guard Functions

When modifying or extending this system, **always use these guard functions** to maintain data integrity.

### LOCKED Entry Protection

```typescript
import { assertNotLocked, assertTimeEntryMutable } from '@/lib/guards';

// Before modifying any time entry
assertNotLocked(entry.approvalState, 'update time entry');

// Or use the complete guard (includes user check)
await assertTimeEntryMutable(timeEntryId, userId);
```

### Unique Constraint Violation Detection

```typescript
import { isActiveTimerConstraintViolation } from '@/lib/guards';

try {
  await prisma.timeEntry.create({ ... });
} catch (error) {
  if (isActiveTimerConstraintViolation(error)) {
    // Handle gracefully - fetch existing timer
    const existing = await prisma.timeEntry.findFirst({
      where: { userId, endTs: null, deletedAt: null }
    });
    return existing;
  }
  throw error;
}
```

### Unlock for Correction (Admin Only)

```typescript
import { unlockForCorrection } from '@/lib/guards';

// Admin explicitly unlocking a LOCKED entry
await unlockForCorrection(
  timeEntryId,
  adminUserId,
  'Customer requested billing adjustment - invoice #1234'
);

// Entry is now APPROVED and can be edited
// editedReason and editedAt are automatically set
```

## Audit Logging

**Always audit critical operations:**

```typescript
import { writeAuditLog, createAuditLogData, TimeEntryActions } from '@/lib/audit';

// Standalone audit write
await writeAuditLog({
  entityType: 'TimeEntry',
  entityId: entry.id,
  action: TimeEntryActions.STOP,
  actorId: user.id,
  after: { durationSeconds, notes }
});

// In a transaction
await tx.auditLog.create({
  data: createAuditLogData({
    entityType: 'TimeEntry',
    entityId: entry.id,
    action: TimeEntryActions.APPROVE,
    actorId: user.id,
    before: { approvalState: 'DRAFT' },
    after: { approvalState: 'APPROVED' }
  })
});
```

### Available Actions

```typescript
// Time Entry Actions
TimeEntryActions.START
TimeEntryActions.STOP
TimeEntryActions.APPROVE
TimeEntryActions.LOCK
TimeEntryActions.UNLOCK
TimeEntryActions.EDIT
TimeEntryActions.DELETE

// Work Order Actions
WorkOrderActions.CREATE
WorkOrderActions.STATUS_CHANGE
WorkOrderActions.MARK_READY_TO_BILL
WorkOrderActions.CLOSE

// Line Item Actions
LineItemActions.CREATE
LineItemActions.EDIT
LineItemActions.MARK_DONE
LineItemActions.ASSIGN
LineItemActions.UNASSIGN
```

## Time Calculations

### Storing Duration (Seconds)

```typescript
const now = new Date();
const durationMs = now.getTime() - startTs.getTime();
const durationSeconds = Math.floor(durationMs / 1000); // Floor, not round

await prisma.timeEntry.update({
  where: { id },
  data: {
    endTs: now,
    durationSeconds
  }
});
```

### Exporting Duration (Hours)

```typescript
// Always use this formula for consistency
const hours = (durationSeconds / 3600).toFixed(2);

// Example: 5400 seconds = 1.50 hours
```

### Frontend Display

```typescript
// Convert seconds to hours and minutes for display
function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
}
```

## Soft Delete Pattern

**Never hard delete. Always soft delete:**

```typescript
// Instead of delete
await prisma.timeEntry.delete({ where: { id } });

// Do this
await prisma.timeEntry.update({
  where: { id },
  data: { deletedAt: new Date() }
});
```

**Always filter soft deletes in queries:**

```typescript
// Good
const entries = await prisma.timeEntry.findMany({
  where: {
    userId: user.id,
    deletedAt: null // Critical
  }
});

// Bad - includes deleted entries
const entries = await prisma.timeEntry.findMany({
  where: { userId: user.id }
});
```

## Database Constraints to Respect

### One Active Timer Per User

The database enforces this with a partial unique index. Your code must:

1. Handle `P2002` Prisma errors gracefully
2. Use `isActiveTimerConstraintViolation()` to detect it
3. Return existing timer instead of failing

```typescript
// This constraint prevents this scenario:
// user_id = 1, end_ts = NULL (Timer A)
// user_id = 1, end_ts = NULL (Timer B) ❌ BLOCKED BY DATABASE
```

### Approval State Progression

The recommended flow:

```
DRAFT → SUBMITTED → APPROVED → LOCKED
         ↑            ↓
         └─ UNLOCK ──┘
```

**Rules:**
- LOCKED entries cannot be modified without unlock
- Unlock downgrades to APPROVED
- Re-lock after corrections

## Common Patterns

### Creating a Time Entry

```typescript
const entry = await prisma.timeEntry.create({
  data: {
    userId: user.id,
    workOrderId: wo.id,
    lineItemId: li.id,
    startTs: new Date(),
    approvalState: 'DRAFT',
    // endTs and durationSeconds are NULL initially
  }
});

// Audit the start
await writeAuditLog({
  entityType: 'TimeEntry',
  entityId: entry.id,
  action: TimeEntryActions.START,
  actorId: user.id,
  after: { workOrderId: wo.id, lineItemId: li.id }
});
```

### Stopping a Timer

```typescript
const now = new Date();
const durationMs = now.getTime() - entry.startTs.getTime();
const durationSeconds = Math.floor(durationMs / 1000);

const stopped = await prisma.timeEntry.update({
  where: { id: entry.id },
  data: {
    endTs: now,
    durationSeconds,
    notes: userNotes
  }
});

await writeAuditLog({
  entityType: 'TimeEntry',
  entityId: entry.id,
  action: TimeEntryActions.STOP,
  actorId: user.id,
  after: { durationSeconds, notes: userNotes }
});
```

### Approving Time Entries

```typescript
// In a transaction for audit integrity
await prisma.$transaction(async (tx) => {
  // Get entries to approve
  const entries = await tx.timeEntry.findMany({
    where: { workOrderId, approvalState: 'DRAFT', deletedAt: null }
  });

  // Approve them
  await tx.timeEntry.updateMany({
    where: { workOrderId, approvalState: 'DRAFT', deletedAt: null },
    data: {
      approvalState: 'APPROVED',
      approvedById: admin.id,
      approvedAt: new Date()
    }
  });

  // Audit each
  for (const entry of entries) {
    await tx.auditLog.create({
      data: createAuditLogData({
        entityType: 'TimeEntry',
        entityId: entry.id,
        action: TimeEntryActions.APPROVE,
        actorId: admin.id,
        before: { approvalState: 'DRAFT' },
        after: { approvalState: 'APPROVED' }
      })
    });
  }
});
```

## Testing Your Changes

After modifying timer logic, always:

```bash
npm test
```

If you add new critical features, add tests to `tests/safety.test.ts`.

## Performance Considerations

### Indexes

These indexes support the hardened system:

```sql
-- Active timer lookup (O(1) with unique index)
CREATE UNIQUE INDEX "time_entries_one_active_timer_per_user"
  ON "time_entries"("user_id")
  WHERE "end_ts" IS NULL AND "deleted_at" IS NULL;

-- Soft delete filtering
CREATE INDEX "time_entries_deleted_at_idx"
  ON "time_entries"("deleted_at");

-- Approval state queries
CREATE INDEX "time_entries_approval_state_idx"
  ON "time_entries"("approval_state");

-- Edited entries
CREATE INDEX "time_entries_edited_at_idx"
  ON "time_entries"("edited_at");
```

### Query Patterns

**Always filter soft deletes:**
```typescript
where: { deletedAt: null }
```

**Use includes efficiently:**
```typescript
// Good - specific includes
include: {
  user: { select: { name: true } }
}

// Bad - overfetching
include: { user: true }
```

## Security Checklist

When adding new endpoints:

- [ ] Require authentication with `requireAuth()` or `requireAdmin()`
- [ ] Validate all inputs
- [ ] Check LOCKED state before mutations
- [ ] Filter `deletedAt: null` in queries
- [ ] Audit critical operations
- [ ] Use transactions for multi-step operations
- [ ] Handle constraint violations gracefully

## Common Mistakes to Avoid

❌ **DON'T**: Modify LOCKED entries without checking

```typescript
// Bad
await prisma.timeEntry.update({
  where: { id },
  data: { notes: 'Updated' }
});
```

✅ **DO**: Use guards

```typescript
// Good
await assertTimeEntryMutable(id, userId);
await prisma.timeEntry.update({
  where: { id },
  data: { notes: 'Updated' }
});
```

---

❌ **DON'T**: Forget to audit

```typescript
// Bad
await prisma.timeEntry.update({ ... });
```

✅ **DO**: Audit critical operations

```typescript
// Good
await prisma.timeEntry.update({ ... });
await writeAuditLog({ ... });
```

---

❌ **DON'T**: Use minutes

```typescript
// Bad
const durationMinutes = Math.round(durationMs / 60000);
```

✅ **DO**: Use seconds

```typescript
// Good
const durationSeconds = Math.floor(durationMs / 1000);
```

---

❌ **DON'T**: Hard delete

```typescript
// Bad
await prisma.timeEntry.delete({ where: { id } });
```

✅ **DO**: Soft delete

```typescript
// Good
await prisma.timeEntry.update({
  where: { id },
  data: { deletedAt: new Date() }
});
```

## Need Help?

1. Read [CHANGELOG.md](CHANGELOG.md) - Complete upgrade documentation
2. Check [HARDENING_SUMMARY.md](HARDENING_SUMMARY.md) - Quick reference
3. Review existing code in `app/api/timer/` for patterns
4. Run tests: `npm test`

---

**Remember**: This is an accounting-safe internal tool. Favor correctness over cleverness. When in doubt, use the guards.
