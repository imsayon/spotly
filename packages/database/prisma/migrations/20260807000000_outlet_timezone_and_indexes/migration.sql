-- Keep daily token counters and operating hours aligned with each outlet's
-- local calendar day. Existing outlets retain the platform's original IST
-- behaviour until a merchant selects another IANA timezone.
ALTER TABLE "Outlet"
ADD COLUMN IF NOT EXISTS "timezone" TEXT NOT NULL DEFAULT 'Asia/Kolkata';

-- Supports the common merchant outlet lookup filtered by its open/active state.
CREATE INDEX IF NOT EXISTS "Outlet_merchantId_isActive_idx"
ON "Outlet" ("merchantId", "isActive");
