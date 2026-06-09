import { NextRequest } from "next/server";
import { eq, desc, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { auctions, lots, bids, users } from "@/lib/db/schema";
import { requireAdmin, handleApiError } from "@/lib/auth-request";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);

    const rows = await db
      .select({
        id: auctions.id,
        title: lots.title,
        status: auctions.status,
        currentPrice: auctions.currentPrice,
        endsAt: auctions.endsAt,
        winnerId: auctions.winnerId,
        dealStatus: auctions.dealStatus,
        winnerName: users.name,
      })
      .from(auctions)
      .innerJoin(lots, eq(auctions.lotId, lots.id))
      .leftJoin(users, eq(auctions.winnerId, users.id))
      .orderBy(desc(auctions.createdAt))
      .limit(50);

    const withCounts = await Promise.all(
      rows.map(async (a) => {
        const [{ count }] = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(bids)
          .where(eq(bids.auctionId, a.id));
        return { ...a, bidsCount: count ?? 0, endsAt: a.endsAt.toISOString() };
      }),
    );

    return Response.json({ auctions: withCounts });
  } catch (error) {
    return handleApiError(error);
  }
}
