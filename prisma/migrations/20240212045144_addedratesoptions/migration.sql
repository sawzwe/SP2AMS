-- AlterEnum
ALTER TYPE "PaymentStatus" ADD VALUE 'Null';

-- AlterTable
ALTER TABLE "rates" ADD COLUMN     "Bill" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "Meter" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "Payment" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "Usage" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "VAT" BOOLEAN NOT NULL DEFAULT false;
