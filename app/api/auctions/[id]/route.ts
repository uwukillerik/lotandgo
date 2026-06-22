import { NextRequest } from "next/server";
import { eq, desc, and, sql, asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { auctions, lots, lotImages, bids, users, sellerReviews } from "@/lib/db/schema";
import { getUserId, handleApiError } from "@/lib/auth-request";
import { getActivePromotionForLot } from "@/lib/promotion-service";
import { getChatAccess } from "@/lib/chat-access";
import { resolveAuctionWinner } from "@/lib/services/auctionEngine";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id: auctionId } = await params;
    const userId = getUserId(request);

    const [row] = await db
      .select({
        id: auctions.id,
        lotId: auctions.lotId,
        title: lots.title,
        description: lots.description,
        category: lots.category,
        startPrice: auctions.startPrice,
        currentPrice: auctions.currentPrice,
        bidStep: auctions.bidStep,
        status: auctions.status,
        startsAt: auctions.startsAt,
        endsAt: auctions.endsAt,
        auctionType: auctions.auctionType,
        holdDurationSeconds: auctions.holdDurationSeconds,
        leadingSince: auctions.leadingSince,
        sellerId: lots.sellerId,
        sellerName: users.name,
        sellerAvatarUrl: users.avatarUrl,
        winnerId: auctions.winnerId,
        dealStatus: auctions.dealStatus,
      })
      .from(auctions)
      .innerJoin(lots, eq(auctions.lotId, lots.id))
      .innerJoin(users, eq(lots.sellerId, users.id))
      .where(eq(auctions.id, auctionId));

    if (!row) {
      return Response.json({ error: "Аукцион не найден" }, { status: 404 });
    }

    if (row.status === "ended" && !row.winnerId) {
      const winnerId = await resolveAuctionWinner(auctionId);
      if (winnerId) {
        row.winnerId = winnerId;
        row.dealStatus = "awaiting_payment";
      }
    }

    const images = await db
      .select()
      .from(lotImages)
      .where(eq(lotImages.lotId, row.lotId))
      .orderBy(lotImages.sortOrder);

    const bidRows = await db
      .select({
        id: bids.id,
        auctionId: bids.auctionId,
        userId: bids.userId,
        userName: users.name,
        amount: bids.amount,
        createdAt: bids.createdAt,
      })
      .from(bids)
      .innerJoin(users, eq(bids.userId, users.id))
      .where(eq(bids.auctionId, row.id))
      .orderBy(desc(bids.amount), asc(bids.createdAt))
      .limit(50);

    const chatAccess = userId ? await getChatAccess(auctionId, userId) : null;
    const promotion = await getActivePromotionForLot(row.lotId);

    const winnerName =
      row.winnerId != null
        ? (bidRows.find((b) => b.userId === row.winnerId)?.userName ?? null)
        : null;

    const [{ endedLots }] = await db
      .select({ endedLots: sql<number>`count(*)::int` })
      .from(auctions)
      .innerJoin(lots, eq(auctions.lotId, lots.id))
      .where(and(eq(lots.sellerId, row.sellerId), eq(auctions.status, "ended")));

    const [{ avgRating, reviewCount }] = await db
      .select({
        avgRating: sql<number>`coalesce(avg(${sellerReviews.rating}), 0)`,
        reviewCount: sql<number>`count(*)::int`,
      })
      .from(sellerReviews)
      .where(eq(sellerReviews.sellerId, row.sellerId));

    const bidCount = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(bids)
      .where(eq(bids.auctionId, row.id))
      .then((r) => r[0]?.count ?? 0);

    return Response.json({
      auction: {
        id: row.id,
        lotId: row.lotId,
        title: row.title,
        description: row.description,
        category: row.category,
        imageUrl: images[0]?.url ?? null,
        startPrice: row.startPrice,
        currentPrice: row.currentPrice,
        bidStep: row.bidStep,
        bidsCount: bidCount,
        status: row.status,
        startsAt: row.startsAt.toISOString(),
        endsAt: row.endsAt.toISOString(),
        auctionType: row.auctionType,
        holdDurationSeconds: row.holdDurationSeconds,
        leadingSince: row.leadingSince?.toISOString() ?? null,
        sellerId: row.sellerId,
        sellerName: row.sellerName,
        sellerAvatarUrl: row.sellerAvatarUrl,
        sellerEndedLots: endedLots ?? 0,
        sellerRating: Number(avgRating),
        sellerReviewCount: reviewCount ?? 0,
        images: images.map((img) => ({
          id: img.id,
          url: img.url,
          sortOrder: img.sortOrder,
        })),
        bids: bidRows.map((b) => ({
          id: b.id,
          auctionId: b.auctionId,
          userId: b.userId,
          userName: b.userName,
          amount: b.amount,
          createdAt: b.createdAt.toISOString(),
        })),
        winnerId: row.winnerId,
        winnerName,
        dealStatus: row.dealStatus ?? "none",
        isWinner: Boolean(userId && row.winnerId && userId === row.winnerId),
        isSeller: Boolean(userId && userId === row.sellerId),
        canChat: Boolean(chatAccess),
        promotion: promotion
          ? { tier: promotion.tier, expiresAt: promotion.expiresAt }
          : null,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
