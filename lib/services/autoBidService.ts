import { eq, and, desc, asc, sql } from "drizzle-orm";
import { db } from "../db";
import { auctions, autoBids, bids, lots } from "../db/schema";
import { placeBid } from "./auctionEngine";

export async function processAutoBids(auctionId: string): Promise<void> {
  for (let i = 0; i < 15; i++) {
    const placed = await tryOneAutoBid(auctionId);
    if (!placed) break;
  }
}

async function tryOneAutoBid(auctionId: string): Promise<boolean> {
  const [auction] = await db
    .select({
      id: auctions.id,
      status: auctions.status,
      currentPrice: auctions.currentPrice,
      bidStep: auctions.bidStep,
      startPrice: auctions.startPrice,
      endsAt: auctions.endsAt,
      lotId: auctions.lotId,
    })
    .from(auctions)
    .where(eq(auctions.id, auctionId));

  if (!auction || auction.status !== "active" || new Date() > auction.endsAt) {
    return false;
  }

  const [lot] = await db
    .select({ sellerId: lots.sellerId })
    .from(lots)
    .where(eq(lots.id, auction.lotId));

  if (!lot) return false;

  const bidCount = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(bids)
    .where(eq(bids.auctionId, auctionId))
    .then((r) => r[0]?.count ?? 0);

  const minBid =
    bidCount === 0 ? auction.startPrice : auction.currentPrice + auction.bidStep;

  const topBid = await db
    .select({ userId: bids.userId })
    .from(bids)
    .where(eq(bids.auctionId, auctionId))
    .orderBy(desc(bids.amount), asc(bids.createdAt))
    .limit(1);

  const leaderId = topBid[0]?.userId ?? null;

  const candidates = await db
    .select({
      userId: autoBids.userId,
      maxAmount: autoBids.maxAmount,
      updatedAt: autoBids.updatedAt,
    })
    .from(autoBids)
    .where(
      and(
        eq(autoBids.auctionId, auctionId),
        eq(autoBids.active, true),
        sql`${autoBids.maxAmount} >= ${minBid}`,
      ),
    )
    .orderBy(desc(autoBids.maxAmount), asc(autoBids.updatedAt));

  const pick = candidates.find(
    (c) => c.userId !== leaderId && c.userId !== lot.sellerId,
  );

  if (!pick) return false;

  const amount = Math.min(minBid, pick.maxAmount);

  try {
    await placeBid(auctionId, pick.userId, amount);
    return true;
  } catch {
    return false;
  }
}

export async function upsertAutoBid(
  auctionId: string,
  userId: string,
  maxAmount: number,
): Promise<{ maxAmount: number }> {
  const now = new Date();
  await db
    .insert(autoBids)
    .values({ auctionId, userId, maxAmount, active: true, updatedAt: now })
    .onConflictDoUpdate({
      target: [autoBids.auctionId, autoBids.userId],
      set: { maxAmount, active: true, updatedAt: now },
    });

  await processAutoBids(auctionId);
  return { maxAmount };
}

export async function disableAutoBid(auctionId: string, userId: string): Promise<void> {
  await db
    .update(autoBids)
    .set({ active: false, updatedAt: new Date() })
    .where(and(eq(autoBids.auctionId, auctionId), eq(autoBids.userId, userId)));
}

export async function getUserAutoBid(auctionId: string, userId: string) {
  const [row] = await db
    .select({
      maxAmount: autoBids.maxAmount,
      active: autoBids.active,
    })
    .from(autoBids)
    .where(and(eq(autoBids.auctionId, auctionId), eq(autoBids.userId, userId)));
  return row ?? null;
}
