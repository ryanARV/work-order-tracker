# Changelog - Hardening Upgrade

## Version 1.1.0 - Accounting-Safe Internal Tool (2024-02-01)

This upgrade transforms the MVP into a production-hardened, accounting-trustworthy internal system.

### 🔐 Critical Database-Level Enforcement

#### One Active Timer Per User (Race Condition Prevention)

**Problem**: Application-level transactions could not fully prevent race conditions when multiple requests attempted to start timers simultaneously.

**Solution**: PostgreSQL partial unique index physically enforces the constraint at database level.

```sql
CREATE UNIQUE INDEX "time_entries_one_active_timer_per_user"
  ON "time_entries"("user_id")
  WHERE "end_ts" IS NULL AND "deleted_at" IS NULL;
```

**Impact**:
- Database **physically prevents** duplicate active timers
- Graceful handling when constraint is violated
- Returns existing timer instead of creating duplicate
- Transaction-safe across all concurrent requests

**Files Changed**:
- `prisma/migrations/.../migration.sql` - Constraint added
- `lib/guards.ts` - Constraint violation detection
- `app/api/timer/start/route.ts` - Graceful error handling

---

### ⏱ Time Precision Fix (Billing Safety)

**Problem**: Rounding minutes at capture time caused cumulative errors and inconsistent billing calculations.

**Solution**: Store `durationSeconds` (integer) instead of rounded minutes. Calculate hours at export time using consistent formula.

**Changes**:
- Database column: `duration_minutes` → `duration_seconds`
- Calculation: `Math.round(ms / 60000)` → `Math.floor(ms / 1000)`
- Export formula: `(seconds / 3600).toFixed(2)` hours

**Migration**: Existing data automatically converted (minutes × 60 = seconds)

**Impact**:
- Eliminates rounding errors
- Consistent billing exports
- Accurate time tracking to the second
- Matches accounting expectations (2 decimal hours)

**Files Changed**:
- `prisma/schema.prisma` - Schema updated
- `app/api/timer/start/route.ts` - Uses seconds
- `app/api/timer/stop/route.ts` - Uses seconds
- `app/api/export/pdf/[id]/route.ts` - Seconds to hours conversion
- `app/api/export/csv/[id]/route.ts` - Seconds to hours conversion

---

### 🔒 LOCKED Entry Immutability System

**Problem**: Once time is billed (LOCKED), it must not be changed without explicit approval and audit trail.

**Solution**: Guard functions enforce immutability. Admins must explicitly unlock with required reason.

**Features**:
1. **Guard Functions**: `assertNotLocked()` prevents all mutations
2. **Unlock for Correction**: Explicit admin action required
3. **Edit Tracking**: `editedReason` and `editedAt` fields added
4. **Audit Logging**: All unlocks and edits logged

**Business Rule**:
```
LOCKED entry → Admin unlocks with reason → Downgrades to APPROVED → Can be edited → Re-approve → Re-lock
```

**Impact**:
- Accounting-safe: billed time cannot be accidentally changed
- Full audit trail of corrections
- Compliant with financial record-keeping requirements

**Files Changed**:
- `lib/guards.ts` - Guard utilities
- `prisma/schema.prisma` - Added `editedReason`, `editedAt`
- All time entry mutation routes - Guards enforced

---

### 📊 Audit Log System

**Problem**: Original audit log incorrectly had foreign key to WorkOrder, limiting polymorphic use.

**Solution**: Removed FK constraint. Audit log now truly polymorphic.

**Audit Actions Tracked**:
- Timer start/stop/auto-stop
- Time entry approval
- Time entry unlock for correction
- Status changes
- Line item updates

**Impact**:
- Full operational history
- Debugging and compliance
- Tracks all critical operations

**Files Changed**:
- `lib/audit.ts` - Audit utilities
- `prisma/schema.prisma` - Removed incorrect FK
- `app/api/timer/start/route.ts` - Audit logging
- `app/api/timer/stop/route.ts` - Audit logging
- `app/api/work-orders/[id]/approve/route.ts` - Audit logging

---

### 🚨 Admin Exceptions Dashboard

**New Feature**: `/admin/exceptions` page for operational oversight.

**Detects**:
1. **Stale Timers**: Active timers running > 8 hours (forgotten or stuck)
2. **Data Integrity**: Work orders marked READY_TO_BILL with unapproved time
3. **Audit Trail**: Time entries edited after approval
4. **Suspicious Data**: Line items marked DONE with zero time tracked
5. **Orphaned Records**: Time entries with deleted parents

**Purpose**:
- Proactive problem detection
- Operational oversight
- Data quality monitoring
- Prevents billing issues before they reach accounting

**Files Added**:
- `app/api/admin/exceptions/route.ts` - API endpoint
- `app/admin/exceptions/page.tsx` - Dashboard UI
- `components/Navbar.tsx` - Added "Exceptions" link for admins

---

### 🗑️ Soft Delete Pattern

**Added**: `deletedAt` column to all major tables.

**Purpose**:
- Preserve historical data
- Support audit trail
- Allow "undelete" operations if needed
- Never lose time tracking data

**Impact**:
- All queries filter `deletedAt IS NULL`
- Data never truly lost
- Supports compliance requirements

**Files Changed**:
- `prisma/schema.prisma` - Added `deletedAt` columns
- All queries updated to filter soft deletes

---

### ✅ Safety Tests

**Added**: Minimal test suite for critical features.

**Tests**:
1. One active timer enforcement
2. LOCKED entry immutability
3. Approval flow integrity
4. Export calculation accuracy

**Run**: `npm test`

**Purpose**: Verify hardening features work correctly before deployment.

**Files Added**:
- `tests/safety.test.ts` - Test suite
- `package.json` - Added test script

---

## Migration Guide

### For Existing Deployments

1. **Backup database** before migrating
2. **Run migration**:
   ```bash
   npx prisma migrate deploy
   ```
3. **Regenerate Prisma client**:
   ```bash
   npm run prisma:generate
   ```
4. **Run safety tests**:
   ```bash
   npm test
   ```
5. **Deploy application**

### Database Changes

The migration will:
- Add `deletedAt` to all tables
- Rename `duration_minutes` to `duration_seconds` and convert data
- Add `editedReason` and `editedAt` to time_entries
- Create unique index for one active timer constraint
- Remove incorrect audit log foreign key

**Data Safety**: All existing data is preserved and converted automatically.

---

## Breaking Changes

### API Changes

- Time entry responses now include `durationSeconds` instead of `durationMinutes`
- Frontend must handle seconds-based durations
- Export calculations use seconds internally

### Frontend Updates Required

All UI displaying time durations must be updated to use seconds:
- Timer widgets
- Duration displays
- Rollup calculations

**Migration**: Convert `durationMinutes` references to `durationSeconds` and adjust math.

---

## Security Improvements

### Authentication

- ✅ bcrypt password hashing (already in place)
- ✅ HTTP-only cookies (already in place)
- ✅ Secure flag in production (already in place)
- ✅ 7-day session expiration (already in place)

### Authorization

- All mutations require authentication
- Admin-only endpoints enforced
- LOCKED entries require explicit unlock

---

## Performance

No performance regressions. All queries remain optimized with proper indexes.

**New Indexes**:
- `time_entries(deleted_at)` - Fast soft delete filtering
- `time_entries(approval_state)` - Fast approval queries
- `time_entries(edited_at)` - Fast edited entry queries

---

## Testing Checklist

Before deploying to production:

- [ ] Run `npm test` - All safety tests pass
- [ ] Verify timer start/stop works correctly
- [ ] Try starting timer twice (should prevent duplicate)
- [ ] Approve time entries
- [ ] Export PDF - verify hours calculated correctly
- [ ] Export CSV - verify hours calculated correctly
- [ ] Visit `/admin/exceptions` - dashboard loads
- [ ] Check audit log entries created

---

## What Was NOT Changed

In line with the hardening mandate, the following were **not** added:

- ❌ No new feature modules
- ❌ No SaaS multi-tenant features
- ❌ No billing integration
- ❌ No notification system
- ❌ No offline mode
- ❌ No unnecessary abstractions

**Philosophy**: Favor correctness over cleverness. Favor simplicity over abstraction. Favor database enforcement over application assumptions.

---

## Support

For questions or issues with the hardening upgrade, review:

1. This CHANGELOG
2. Migration logs
3. Test output (`npm test`)
4. Admin exceptions dashboard for data issues

---

**Summary**: This system is now accounting-safe, race-condition-proof, and audit-ready for production internal use.
