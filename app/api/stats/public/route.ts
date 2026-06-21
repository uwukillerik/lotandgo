import { NextRequest } from "next/server";
import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { auctions, lots, users, bids } from "@/lib/db/schema";
import { handleApiError } from "@/lib/auth-request";

export async function GET(_request: NextRequest) {
  try {
    const [{ activeAuctions }] = await db
      .select({ activeAuctions: sql<number>`count(*)::int` })
      .from(auctions)
      .where(eq(auctions.status, "active"));

    const [{ lotsCount }] = await db
      .select({ lotsCount: sql<number>`count(*)::int` })
      .from(lots);

    const [{ usersCount }] = await db
      .select({ usersCount: sql<number>`count(*)::int` })
      .from(users);

    const [{ totalBids }] = await db
      .select({ totalBids: sql<number>`count(*)::int` })
      .from(bids);

    return Response.json({
      stats: {
        activeAuctions: activeAuctions ?? 0,
        totalLots: lotsCount ?? 0,
        totalUsers: usersCount ?? 0,
        totalBids: totalBids ?? 0,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
