-- AlterTable
ALTER TABLE "public"."appointments" ALTER COLUMN "duration" DROP NOT NULL,
ALTER COLUMN "duration" SET DEFAULT 30;
