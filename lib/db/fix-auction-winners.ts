import "dotenv/config";
import { eq, isNull, and } from "drizzle-orm";
import { db } from "./index";
import { auctions } from "./schema";
import { resolveAuctionWinner } from "../services/auctionEngine";

async function fixAuctionWinners() {
  console.log("Назначение победителей для завершённых аукционов без winnerId…");

  const rows = await db
    .select({ id: auctions.id })
    .from(auctions)
    .where(and(eq(auctions.status, "ended"), isNull(auctions.winnerId)));

  let fixed = 0;
  for (const row of rows) {
    const winnerId = await resolveAuctionWinner(row.id);
    if (winnerId) {
      fixed++;
      console.log(`  ${row.id} → победитель ${winnerId}`);
    }
  }

  console.log(`Готово. Назначено победителей: ${fixed} из ${rows.length}`);
}

fixAuctionWinners()
  .catch(console.error)
  .finally(() => process.exit(0));
