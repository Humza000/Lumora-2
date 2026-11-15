-- AlterTable
ALTER TABLE "ClientProfile" ADD COLUMN     "stripeCustomerId" TEXT;

-- AlterTable
ALTER TABLE "HostingPlan" ADD COLUMN     "cancelAt" TIMESTAMP(3),
ADD COLUMN     "stripeSubscriptionId" TEXT,
ADD COLUMN     "subscriptionStatus" TEXT;

-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "stripeInvoiceId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "ClientProfile_stripeCustomerId_key" ON "ClientProfile"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "HostingPlan_stripeSubscriptionId_key" ON "HostingPlan"("stripeSubscriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_stripeInvoiceId_key" ON "Invoice"("stripeInvoiceId");

