ALTER TABLE public."QueueEntry"
  ADD COLUMN "verificationTokenDigest" TEXT,
  ADD COLUMN "verificationExpiresAt" TIMESTAMP(3),
  ADD COLUMN "verificationUsedAt" TIMESTAMP(3),
  ADD COLUMN "verificationSessionId" TEXT;

CREATE UNIQUE INDEX "QueueEntry_verificationTokenDigest_key"
  ON public."QueueEntry"("verificationTokenDigest");
