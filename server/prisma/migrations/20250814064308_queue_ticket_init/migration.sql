-- AlterTable
ALTER TABLE "Ticket" ADD COLUMN "finishedAt" DATETIME;
ALTER TABLE "Ticket" ADD COLUMN "serviceStartAt" DATETIME;

-- CreateIndex
CREATE INDEX "Ticket_queueId_status_createdAt_idx" ON "Ticket"("queueId", "status", "createdAt");
