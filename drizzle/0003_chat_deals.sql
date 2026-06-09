DO $$ BEGIN
  CREATE TYPE "deal_status" AS ENUM('none', 'awaiting_payment', 'paid', 'shipped', 'completed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
ALTER TYPE "notification_type" ADD VALUE IF NOT EXISTS 'message';--> statement-breakpoint
ALTER TYPE "notification_type" ADD VALUE IF NOT EXISTS 'deal_update';--> statement-breakpoint
ALTER TABLE "auctions" ADD COLUMN IF NOT EXISTS "deal_status" "deal_status" DEFAULT 'none' NOT NULL;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "auction_messages" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "auction_id" uuid NOT NULL,
  "sender_id" uuid NOT NULL,
  "body" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "auction_messages" ADD CONSTRAINT "auction_messages_auction_id_auctions_id_fk" FOREIGN KEY ("auction_id") REFERENCES "public"."auctions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "auction_messages" ADD CONSTRAINT "auction_messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
UPDATE "auctions" SET "deal_status" = 'awaiting_payment' WHERE "status" = 'ended' AND "winner_id" IS NOT NULL AND "deal_status" = 'none';
