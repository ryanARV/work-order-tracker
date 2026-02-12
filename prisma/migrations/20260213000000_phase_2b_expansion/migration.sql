-- CreateEnum
CREATE TYPE "EstimateStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'CONVERTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "PartTransactionType" AS ENUM ('PURCHASE', 'RETURN', 'ADJUSTMENT', 'RESERVE', 'UNRESERVE', 'ISSUE');

-- CreateEnum
CREATE TYPE "KanbanColumn" AS ENUM ('OPEN', 'IN_PROGRESS', 'ON_HOLD_PARTS', 'ON_HOLD_DELAY', 'QC', 'READY_TO_BILL');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "UserRole" ADD VALUE 'SERVICE_WRITER';
ALTER TYPE "UserRole" ADD VALUE 'PARTS';
ALTER TYPE "UserRole" ADD VALUE 'MANAGER';

-- DropIndex
DROP INDEX "line_item_assignments_line_item_id_user_id_key";

-- AlterTable
ALTER TABLE "comments" ADD COLUMN     "estimate_id" TEXT;

-- AlterTable
ALTER TABLE "time_entries" ADD COLUMN     "adjusted_by" TEXT;

-- AlterTable
ALTER TABLE "work_orders" ADD COLUMN     "converted_from_estimate_id" TEXT,
ADD COLUMN     "kanban_column" "KanbanColumn",
ADD COLUMN     "kanban_position" INTEGER;

-- CreateTable
CREATE TABLE "estimates" (
    "id" TEXT NOT NULL,
    "estimate_number" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "status" "EstimateStatus" NOT NULL DEFAULT 'DRAFT',
    "priority" TEXT,
    "warranty_authorization_number" TEXT,
    "valid_until" TIMESTAMP(3),
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "estimates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "estimate_line_items" (
    "id" TEXT NOT NULL,
    "estimate_id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "complaint" TEXT,
    "correction" TEXT,
    "bill_type" "BillType",
    "estimate_minutes" INTEGER,
    "labor_rate" DECIMAL(10,2),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "estimate_line_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parts" (
    "id" TEXT NOT NULL,
    "part_number" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "manufacturer" TEXT,
    "unit_cost" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "unit_price" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "quantity_on_hand" INTEGER NOT NULL DEFAULT 0,
    "quantity_reserved" INTEGER NOT NULL DEFAULT 0,
    "reorder_level" INTEGER NOT NULL DEFAULT 0,
    "location" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "parts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "estimate_part_items" (
    "id" TEXT NOT NULL,
    "estimate_id" TEXT NOT NULL,
    "part_id" TEXT,
    "description" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unit_cost" DECIMAL(10,2) NOT NULL,
    "unit_price" DECIMAL(10,2) NOT NULL,
    "bill_type" "BillType",
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "estimate_part_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_order_part_items" (
    "id" TEXT NOT NULL,
    "work_order_id" TEXT NOT NULL,
    "line_item_id" TEXT,
    "part_id" TEXT,
    "description" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "quantity_issued" INTEGER NOT NULL DEFAULT 0,
    "unit_cost" DECIMAL(10,2) NOT NULL,
    "unit_price" DECIMAL(10,2) NOT NULL,
    "bill_type" "BillType",
    "issued_by_id" TEXT,
    "issued_at" TIMESTAMP(3),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "work_order_part_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "part_transactions" (
    "id" TEXT NOT NULL,
    "part_id" TEXT NOT NULL,
    "type" "PartTransactionType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_cost" DECIMAL(10,2),
    "work_order_id" TEXT,
    "user_id" TEXT NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "part_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "estimates_estimate_number_key" ON "estimates"("estimate_number");

-- CreateIndex
CREATE INDEX "estimates_customer_id_idx" ON "estimates"("customer_id");

-- CreateIndex
CREATE INDEX "estimates_created_by_id_idx" ON "estimates"("created_by_id");

-- CreateIndex
CREATE INDEX "estimates_status_idx" ON "estimates"("status");

-- CreateIndex
CREATE INDEX "estimates_deleted_at_idx" ON "estimates"("deleted_at");

-- CreateIndex
CREATE INDEX "estimate_line_items_estimate_id_idx" ON "estimate_line_items"("estimate_id");

-- CreateIndex
CREATE INDEX "estimate_line_items_deleted_at_idx" ON "estimate_line_items"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "parts_part_number_key" ON "parts"("part_number");

-- CreateIndex
CREATE INDEX "parts_part_number_idx" ON "parts"("part_number");

-- CreateIndex
CREATE INDEX "parts_active_idx" ON "parts"("active");

-- CreateIndex
CREATE INDEX "parts_deleted_at_idx" ON "parts"("deleted_at");

-- CreateIndex
CREATE INDEX "estimate_part_items_estimate_id_idx" ON "estimate_part_items"("estimate_id");

-- CreateIndex
CREATE INDEX "estimate_part_items_part_id_idx" ON "estimate_part_items"("part_id");

-- CreateIndex
CREATE INDEX "estimate_part_items_deleted_at_idx" ON "estimate_part_items"("deleted_at");

-- CreateIndex
CREATE INDEX "work_order_part_items_work_order_id_idx" ON "work_order_part_items"("work_order_id");

-- CreateIndex
CREATE INDEX "work_order_part_items_line_item_id_idx" ON "work_order_part_items"("line_item_id");

-- CreateIndex
CREATE INDEX "work_order_part_items_part_id_idx" ON "work_order_part_items"("part_id");

-- CreateIndex
CREATE INDEX "work_order_part_items_deleted_at_idx" ON "work_order_part_items"("deleted_at");

-- CreateIndex
CREATE INDEX "part_transactions_part_id_idx" ON "part_transactions"("part_id");

-- CreateIndex
CREATE INDEX "part_transactions_user_id_idx" ON "part_transactions"("user_id");

-- CreateIndex
CREATE INDEX "part_transactions_created_at_idx" ON "part_transactions"("created_at");

-- CreateIndex
CREATE INDEX "comments_estimate_id_idx" ON "comments"("estimate_id");

-- CreateIndex
CREATE INDEX "line_item_assignments_line_item_id_user_id_idx" ON "line_item_assignments"("line_item_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "work_orders_converted_from_estimate_id_key" ON "work_orders"("converted_from_estimate_id");

-- CreateIndex
CREATE INDEX "work_orders_kanban_column_kanban_position_idx" ON "work_orders"("kanban_column", "kanban_position");

-- AddForeignKey
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_converted_from_estimate_id_fkey" FOREIGN KEY ("converted_from_estimate_id") REFERENCES "estimates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_adjusted_by_fkey" FOREIGN KEY ("adjusted_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_estimate_id_fkey" FOREIGN KEY ("estimate_id") REFERENCES "estimates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estimates" ADD CONSTRAINT "estimates_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estimates" ADD CONSTRAINT "estimates_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estimate_line_items" ADD CONSTRAINT "estimate_line_items_estimate_id_fkey" FOREIGN KEY ("estimate_id") REFERENCES "estimates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estimate_part_items" ADD CONSTRAINT "estimate_part_items_estimate_id_fkey" FOREIGN KEY ("estimate_id") REFERENCES "estimates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estimate_part_items" ADD CONSTRAINT "estimate_part_items_part_id_fkey" FOREIGN KEY ("part_id") REFERENCES "parts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_order_part_items" ADD CONSTRAINT "work_order_part_items_work_order_id_fkey" FOREIGN KEY ("work_order_id") REFERENCES "work_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_order_part_items" ADD CONSTRAINT "work_order_part_items_line_item_id_fkey" FOREIGN KEY ("line_item_id") REFERENCES "line_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_order_part_items" ADD CONSTRAINT "work_order_part_items_part_id_fkey" FOREIGN KEY ("part_id") REFERENCES "parts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_order_part_items" ADD CONSTRAINT "work_order_part_items_issued_by_id_fkey" FOREIGN KEY ("issued_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "part_transactions" ADD CONSTRAINT "part_transactions_part_id_fkey" FOREIGN KEY ("part_id") REFERENCES "parts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "part_transactions" ADD CONSTRAINT "part_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
