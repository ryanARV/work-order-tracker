-- CreateEnum
CREATE TYPE "BillType" AS ENUM ('CUSTOMER_PAY', 'WARRANTY');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "WorkOrderStatus" ADD VALUE 'PENDING';
ALTER TYPE "WorkOrderStatus" ADD VALUE 'ON_HOLD_PARTS';
ALTER TYPE "WorkOrderStatus" ADD VALUE 'ON_HOLD_DELAY';
ALTER TYPE "WorkOrderStatus" ADD VALUE 'QC';

-- AlterTable
ALTER TABLE "line_items" ADD COLUMN     "bill_type" "BillType",
ADD COLUMN     "complaint" TEXT,
ADD COLUMN     "correction" TEXT;

-- AlterTable
ALTER TABLE "time_entries" ADD COLUMN     "pause_reason" TEXT;

-- AlterTable
ALTER TABLE "work_orders" ADD COLUMN     "warranty_authorization_number" TEXT;

-- CreateIndex
CREATE INDEX "line_items_bill_type_idx" ON "line_items"("bill_type");
