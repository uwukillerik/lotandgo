import { NextRequest } from "next/server";
import { eq, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { bids, auctions, lots } from "@/lib/db/schema";
import { requireUserId, handleApiError } from "@/lib/auth-request";

export async function GET(request: NextRequest) {
  try {
    const userId = requireUserId(request);

    const userBids = await db
      .select({
        id: bids.id,
        auctionId: bids.auctionId,
        amount: bids.amount,
        createdAt: bids.createdAt,
        auctionTitle: lots.title,
        auctionStatus: auctions.status,
        currentPrice: auctions.currentPrice,
        endsAt: auctions.endsAt,
        winnerId: auctions.winnerId,
      })
      .from(bids)
      .innerJoin(auctions, eq(bids.auctionId, auctions.id))
      .innerJoin(lots, eq(auctions.lotId, lots.id))
      .where(eq(bids.userId, userId))
      .orderBy(desc(bids.createdAt));

    const seen = new Set<string>();
    const unique = userBids.filter((b) => {
      if (seen.has(b.auctionId)) return false;
      seen.add(b.auctionId);
      return true;
    });

    return Response.json({
      bids: unique.map((b) => ({
        id: b.id,
        auctionId: b.auctionId,
        amount: b.amount,
        createdAt: b.createdAt.toISOString(),
        auctionTitle: b.auctionTitle,
        auctionStatus: b.auctionStatus,
        currentPrice: b.currentPrice,
        endsAt: b.endsAt.toISOString(),
        isWinner: b.winnerId === userId,
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
