-- AlterTable
ALTER TABLE "CallLog" ADD COLUMN "note" TEXT;

-- AlterTable
ALTER TABLE "Ticket" ADD COLUMN "cancelReason" TEXT;
ALTER TABLE "Ticket" ADD COLUMN "fullName" TEXT;
ALTER TABLE "Ticket" ADD COLUMN "studentCode" TEXT;
