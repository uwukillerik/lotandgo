import { NextRequest } from "next/server";
import { eq, sql, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, auctions, lots, bids, wallets } from "@/lib/db/schema";
import { requireAdmin, handleApiError } from "@/lib/auth-request";
import { kopecksToRubles } from "@/lib/wallet-service";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);

    const [{ usersCount }] = await db
      .select({ usersCount: sql<number>`count(*)::int` })
      .from(users);

    const [{ lotsCount }] = await db
      .select({ lotsCount: sql<number>`count(*)::int` })
      .from(lots);

    const [{ activeAuctions }] = await db
      .select({ activeAuctions: sql<number>`count(*)::int` })
      .from(auctions)
      .where(eq(auctions.status, "active"));

    const [{ totalBids }] = await db
      .select({ totalBids: sql<number>`count(*)::int` })
      .from(bids);

    const [{ walletsCount }] = await db
      .select({ walletsCount: sql<number>`count(*)::int` })
      .from(wallets);

    const [{ totalKopecks }] = await db
      .select({ totalKopecks: sql<number>`coalesce(sum(${wallets.balanceKopecks}), 0)::int` })
      .from(wallets);

    const recentUsers = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(desc(users.createdAt))
      .limit(10);

    const recentAuctions = await db
      .select({
        id: auctions.id,
        title: lots.title,
        status: auctions.status,
        currentPrice: auctions.currentPrice,
        endsAt: auctions.endsAt,
      })
      .from(auctions)
      .innerJoin(lots, eq(auctions.lotId, lots.id))
      .orderBy(desc(auctions.createdAt))
      .limit(8);

    return Response.json({
      stats: {
        usersCount,
        lotsCount,
        activeAuctions,
        totalBids,
        walletsCount,
        totalWalletRubles: kopecksToRubles(totalKopecks ?? 0),
      },
      recentUsers: recentUsers.map((u) => ({
        ...u,
        createdAt: u.createdAt.toISOString(),
      })),
      recentAuctions: recentAuctions.map((a) => ({
        ...a,
        endsAt: a.endsAt.toISOString(),
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
