DO $$ BEGIN
  CREATE TYPE "promotion_tier" AS ENUM('boost', 'featured', 'premium');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "lot_promotions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "lot_id" uuid NOT NULL REFERENCES "lots"("id") ON DELETE CASCADE,
  "tier" "promotion_tier" NOT NULL,
  "price_rubles" integer NOT NULL,
  "starts_at" timestamp with time zone NOT NULL,
  "expires_at" timestamp with time zone NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "lot_promotions_lot_id_idx" ON "lot_promotions" ("lot_id");
CREATE INDEX IF NOT EXISTS "lot_promotions_expires_at_idx" ON "lot_promotions" ("expires_at");
