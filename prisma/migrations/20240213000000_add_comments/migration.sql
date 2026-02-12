-- CreateTable: Add comments for work orders and line items
CREATE TABLE "comments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "work_order_id" TEXT,
    "line_item_id" TEXT,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    CONSTRAINT "comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "comments_work_order_id_fkey" FOREIGN KEY ("work_order_id") REFERENCES "work_orders" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "comments_line_item_id_fkey" FOREIGN KEY ("line_item_id") REFERENCES "line_items" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "comments_work_order_id_idx" ON "comments"("work_order_id");
CREATE INDEX "comments_line_item_id_idx" ON "comments"("line_item_id");
CREATE INDEX "comments_user_id_idx" ON "comments"("user_id");
CREATE INDEX "comments_deleted_at_idx" ON "comments"("deleted_at");
CREATE INDEX "comments_created_at_idx" ON "comments"("created_at");
