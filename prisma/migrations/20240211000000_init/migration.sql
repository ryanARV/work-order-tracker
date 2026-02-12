-- Initial migration with hardening features built-in

-- Create enums
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'TECH');
CREATE TYPE "WorkOrderStatus" AS ENUM ('DRAFT', 'OPEN', 'IN_PROGRESS', 'READY_TO_BILL', 'CLOSED');
CREATE TYPE "LineItemStatus" AS ENUM ('OPEN', 'DONE');
CREATE TYPE "ApprovalState" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'LOCKED');

-- CreateTable: users
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable: customers
CREATE TABLE "customers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "billing_info" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable: work_orders
CREATE TABLE "work_orders" (
    "id" TEXT NOT NULL,
    "wo_number" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "status" "WorkOrderStatus" NOT NULL DEFAULT 'DRAFT',
    "priority" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "closed_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "work_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable: line_items
CREATE TABLE "line_items" (
    "id" TEXT NOT NULL,
    "work_order_id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "billable" BOOLEAN NOT NULL DEFAULT true,
    "estimate_minutes" INTEGER,
    "status" "LineItemStatus" NOT NULL DEFAULT 'OPEN',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "line_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable: line_item_assignments
CREATE TABLE "line_item_assignments" (
    "id" TEXT NOT NULL,
    "line_item_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "line_item_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable: time_entries
CREATE TABLE "time_entries" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "work_order_id" TEXT NOT NULL,
    "line_item_id" TEXT NOT NULL,
    "start_ts" TIMESTAMP(3) NOT NULL,
    "end_ts" TIMESTAMP(3),
    "duration_seconds" INTEGER,
    "notes" TEXT,
    "approval_state" "ApprovalState" NOT NULL DEFAULT 'DRAFT',
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "edited_reason" TEXT,
    "edited_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "time_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable: audit_log
CREATE TABLE "audit_log" (
    "id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "actor_id" TEXT NOT NULL,
    "before_json" TEXT,
    "after_json" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: Unique constraints
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "work_orders_wo_number_key" ON "work_orders"("wo_number");
CREATE UNIQUE INDEX "line_item_assignments_line_item_id_user_id_key" ON "line_item_assignments"("line_item_id", "user_id");

-- CreateIndex: Regular indexes
CREATE INDEX "users_deleted_at_idx" ON "users"("deleted_at");
CREATE INDEX "customers_deleted_at_idx" ON "customers"("deleted_at");
CREATE INDEX "work_orders_customer_id_idx" ON "work_orders"("customer_id");
CREATE INDEX "work_orders_deleted_at_idx" ON "work_orders"("deleted_at");
CREATE INDEX "line_items_work_order_id_idx" ON "line_items"("work_order_id");
CREATE INDEX "line_items_status_idx" ON "line_items"("status");
CREATE INDEX "line_items_deleted_at_idx" ON "line_items"("deleted_at");
CREATE INDEX "line_item_assignments_user_id_idx" ON "line_item_assignments"("user_id");
CREATE INDEX "time_entries_user_id_end_ts_idx" ON "time_entries"("user_id", "end_ts");
CREATE INDEX "time_entries_work_order_id_line_item_id_idx" ON "time_entries"("work_order_id", "line_item_id");
CREATE INDEX "time_entries_user_id_start_ts_idx" ON "time_entries"("user_id", "start_ts");
CREATE INDEX "time_entries_line_item_id_idx" ON "time_entries"("line_item_id");
CREATE INDEX "time_entries_deleted_at_idx" ON "time_entries"("deleted_at");
CREATE INDEX "time_entries_approval_state_idx" ON "time_entries"("approval_state");
CREATE INDEX "time_entries_edited_at_idx" ON "time_entries"("edited_at");
CREATE INDEX "audit_log_entity_type_entity_id_idx" ON "audit_log"("entity_type", "entity_id");
CREATE INDEX "audit_log_actor_id_idx" ON "audit_log"("actor_id");
CREATE INDEX "audit_log_created_at_idx" ON "audit_log"("created_at");

-- CRITICAL: One active timer per user constraint
-- This prevents race conditions at the database level
CREATE UNIQUE INDEX "time_entries_one_active_timer_per_user"
  ON "time_entries"("user_id")
  WHERE "end_ts" IS NULL AND "deleted_at" IS NULL;

COMMENT ON INDEX "time_entries_one_active_timer_per_user" IS
  'Prevents duplicate active timers. Only one timer per user can have end_ts = NULL at a time.';

-- AddForeignKey
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "line_items" ADD CONSTRAINT "line_items_work_order_id_fkey" FOREIGN KEY ("work_order_id") REFERENCES "work_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "line_item_assignments" ADD CONSTRAINT "line_item_assignments_line_item_id_fkey" FOREIGN KEY ("line_item_id") REFERENCES "line_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "line_item_assignments" ADD CONSTRAINT "line_item_assignments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_work_order_id_fkey" FOREIGN KEY ("work_order_id") REFERENCES "work_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_line_item_id_fkey" FOREIGN KEY ("line_item_id") REFERENCES "line_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
