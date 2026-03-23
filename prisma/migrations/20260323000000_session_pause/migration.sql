-- Add session pause support: status field and persisted timer elapsed
ALTER TABLE "Session" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE "Session" ADD COLUMN "timerElapsed" INTEGER NOT NULL DEFAULT 0;
