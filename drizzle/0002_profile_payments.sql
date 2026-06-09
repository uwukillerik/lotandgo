ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "avatar_url" varchar(500);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "stripe_customer_id" varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "stripe_payment_method_id" varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "payment_verified_at" timestamp with time zone;
