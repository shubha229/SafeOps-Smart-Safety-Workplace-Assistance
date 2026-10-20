-- AlterTable
ALTER TABLE "evidence" ADD COLUMN     "authTag" TEXT,
ADD COLUMN     "encryptionIv" TEXT,
ADD COLUMN     "fileData" BYTEA,
ADD COLUMN     "isEncrypted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "mimeType" TEXT;
