/*
  Warnings:

  - Made the column `created_at` on table `bookings` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `bookings` MODIFY `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);
