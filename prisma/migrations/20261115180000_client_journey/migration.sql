-- AlterEnum
ALTER TYPE "ProjectStatus" ADD VALUE 'AWAITING_PAYMENT';

-- AlterEnum
ALTER TYPE "QuoteStatus" ADD VALUE 'CHANGES_REQUESTED';

-- AlterTable
ALTER TABLE "HostingPlan" ADD COLUMN     "planKey" TEXT;

-- AlterTable
ALTER TABLE "Quote" ADD COLUMN     "changeRequest" TEXT,
ADD COLUMN     "previousAnswers" JSONB;

