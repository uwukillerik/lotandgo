ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "terms_accepted_at" timestamp with time zone;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "privacy_accepted_at" timestamp with time zone;

-- Демо и существующие пользователи: считаем согласие принятым при регистрации
UPDATE "users"
SET
  "terms_accepted_at" = COALESCE("terms_accepted_at", "created_at", NOW()),
  "privacy_accepted_at" = COALESCE("privacy_accepted_at", "created_at", NOW())
WHERE "terms_accepted_at" IS NULL OR "privacy_accepted_at" IS NULL;
