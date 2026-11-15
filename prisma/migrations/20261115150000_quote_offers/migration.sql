-- AlterEnum
ALTER TYPE "QuoteStatus" ADD VALUE 'SENT';

-- AlterTable
ALTER TABLE "Quote" ADD COLUMN     "declineReason" TEXT,
ADD COLUMN     "defaultMilestones" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "dueDate" TIMESTAMP(3),
ADD COLUMN     "hostingBilling" TEXT,
ADD COLUMN     "hostingPlanKey" TEXT,
ADD COLUMN     "hostingPrice" INTEGER,
ADD COLUMN     "invoiceOnAccept" TEXT,
ADD COLUMN     "message" TEXT,
ADD COLUMN     "price" INTEGER,
ADD COLUMN     "projectDescription" TEXT,
ADD COLUMN     "projectTitle" TEXT,
ADD COLUMN     "respondedAt" TIMESTAMP(3),
ADD COLUMN     "sentAt" TIMESTAMP(3),
ADD COLUMN     "startDate" TIMESTAMP(3);

