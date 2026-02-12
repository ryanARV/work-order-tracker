-- AlterTable: Expand Customer model with detailed contact and billing fields
ALTER TABLE "customers"
  ADD COLUMN "contact_name" TEXT,
  ADD COLUMN "contact_email" TEXT,
  ADD COLUMN "contact_phone" TEXT,
  ADD COLUMN "billing_street" TEXT,
  ADD COLUMN "billing_city" TEXT,
  ADD COLUMN "billing_state" TEXT,
  ADD COLUMN "billing_zip" TEXT,
  ADD COLUMN "billing_country" TEXT,
  ADD COLUMN "notes" TEXT;

-- Drop the old billing_info column
ALTER TABLE "customers" DROP COLUMN "billing_info";

-- Add index on name for search performance
CREATE INDEX "customers_name_idx" ON "customers"("name");
