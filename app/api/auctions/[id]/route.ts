import { NextRequest } from "next/server";
import { eq, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { auctions, lots, lotImages, bids, users } from "@/lib/db/schema";
import { getUserId, handleApiError } from "@/lib/auth-request";
import { getActivePromotionForLot } from "@/lib/promotion-service";
import { getChatAccess } from "@/lib/chat-access";

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
        sellerId: lots.sellerId,
        sellerName: users.name,
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
      .orderBy(desc(bids.createdAt))
      .limit(50);

    const chatAccess = userId ? await getChatAccess(auctionId, userId) : null;
    const promotion = await getActivePromotionForLot(row.lotId);

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
        bidsCount: bidRows.length,
        status: row.status,
        startsAt: row.startsAt.toISOString(),
        endsAt: row.endsAt.toISOString(),
        sellerId: row.sellerId,
        sellerName: row.sellerName,
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
