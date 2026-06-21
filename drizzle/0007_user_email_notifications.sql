ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "email_notifications" boolean DEFAULT true NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "favorites_user_auction_idx" ON "favorites" ("user_id", "auction_id");
