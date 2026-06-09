import "dotenv/config";
import { eq, inArray, or, isNull } from "drizzle-orm";
import { db } from "./index";
import { users } from "./schema";

const DEMO_EMAILS = [
  "admin@lotgo.ru",
  "seller@lotgo.ru",
  "bidder1@lotgo.ru",
  "bidder2@lotgo.ru",
];

/** Проставляет согласие с документами всем демо-аккаунтам и пользователям без даты принятия. */
export async function ensureDemoLegalConsent() {
  const now = new Date();

  const pending = await db
    .select()
    .from(users)
    .where(or(isNull(users.termsAcceptedAt), isNull(users.privacyAcceptedAt)));

  for (const u of pending) {
    await db
      .update(users)
      .set({
        termsAcceptedAt: u.termsAcceptedAt ?? u.createdAt ?? now,
        privacyAcceptedAt: u.privacyAcceptedAt ?? u.createdAt ?? now,
      })
      .where(eq(users.id, u.id));
  }

  await db
    .update(users)
    .set({ termsAcceptedAt: now, privacyAcceptedAt: now })
    .where(inArray(users.email, DEMO_EMAILS));
}

async function main() {
  await ensureDemoLegalConsent();
  console.log("Согласия для демо-аккаунтов обновлены.");
}

const isDirectRun = process.argv[1]?.replace(/\\/g, "/").endsWith("ensure-demo-consent.ts");
if (isDirectRun) {
  main()
    .catch(console.error)
    .finally(() => process.exit(0));
}
