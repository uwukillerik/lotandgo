DO $$ BEGIN
  CREATE TYPE "auction_type" AS ENUM('fixed', 'anti_snipe', 'soft_close');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "auctions" ADD COLUMN IF NOT EXISTS "auction_type" "auction_type" NOT NULL DEFAULT 'anti_snipe';
ALTER TABLE "auctions" ADD COLUMN IF NOT EXISTS "hold_duration_seconds" integer NOT NULL DEFAULT 3600;
ALTER TABLE "auctions" ADD COLUMN IF NOT EXISTS "leading_bidder_id" uuid REFERENCES "users"("id");
ALTER TABLE "auctions" ADD COLUMN IF NOT EXISTS "leading_since" timestamp with time zone;
