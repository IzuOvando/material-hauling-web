-- AlterTable
ALTER TABLE "VoucherCamion" ADD COLUMN     "arrivalLatitude" DOUBLE PRECISION,
ADD COLUMN     "arrivalLocationAccuracy" DOUBLE PRECISION,
ADD COLUMN     "arrivalLocationSource" TEXT,
ADD COLUMN     "arrivalLocationStatus" TEXT,
ADD COLUMN     "arrivalLocationTimestamp" TIMESTAMP(3),
ADD COLUMN     "arrivalLongitude" DOUBLE PRECISION,
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "locationAccuracy" DOUBLE PRECISION,
ADD COLUMN     "locationSource" TEXT,
ADD COLUMN     "locationStatus" TEXT,
ADD COLUMN     "locationTimestamp" TIMESTAMP(3),
ADD COLUMN     "longitude" DOUBLE PRECISION;
