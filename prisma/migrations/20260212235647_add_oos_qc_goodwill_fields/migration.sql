-- AlterTable
ALTER TABLE "time_entries" ADD COLUMN     "is_goodwill" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "work_orders" ADD COLUMN     "is_out_of_service" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "qc_approved_at" TIMESTAMP(3),
ADD COLUMN     "qc_approved_by_id" TEXT,
ADD COLUMN     "qc_rejected_reason" TEXT;

-- AddForeignKey
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_qc_approved_by_id_fkey" FOREIGN KEY ("qc_approved_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
