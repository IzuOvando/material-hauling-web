-- Rename VoucherCamion primary key column from uuid to folio.
-- This is a non-destructive rename: all existing rows and their data are preserved.
ALTER TABLE "VoucherCamion" RENAME COLUMN "uuid" TO "folio";
