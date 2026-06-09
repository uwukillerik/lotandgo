import { NextRequest } from "next/server";
import { eq, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { lots, lotImages, auctions } from "@/lib/db/schema";
import { requireUserId, handleApiError } from "@/lib/auth-request";
import { getActivePromotionsMap } from "@/lib/promotion-service";

export async function GET(request: NextRequest) {
  try {
    const userId = requireUserId(request);

    const userLots = await db
      .select()
      .from(lots)
      .where(eq(lots.sellerId, userId))
      .orderBy(desc(lots.createdAt));

    const promoMap = await getActivePromotionsMap(userLots.map((l) => l.id));

    const result = await Promise.all(
      userLots.map(async (lot) => {
        const images = await db
          .select()
          .from(lotImages)
          .where(eq(lotImages.lotId, lot.id))
          .orderBy(lotImages.sortOrder);

        const [auction] = await db
          .select()
          .from(auctions)
          .where(eq(auctions.lotId, lot.id));

        return {
          id: lot.id,
          sellerId: lot.sellerId,
          title: lot.title,
          description: lot.description,
          category: lot.category,
          status: lot.status,
          images: images.map((img) => ({
            id: img.id,
            url: img.url,
            sortOrder: img.sortOrder,
          })),
          createdAt: lot.createdAt.toISOString(),
          auction: auction
            ? {
                id: auction.id,
                status: auction.status,
                startPrice: auction.startPrice,
                currentPrice: auction.currentPrice,
                startsAt: auction.startsAt.toISOString(),
                endsAt: auction.endsAt.toISOString(),
                winnerId: auction.winnerId,
              }
            : null,
          promotion: (() => {
            const p = promoMap.get(lot.id);
            return p ? { tier: p.tier, expiresAt: p.expiresAt } : null;
          })(),
        };
      }),
    );

    return Response.json({ lots: result });
  } catch (error) {
    return handleApiError(error);
  }
}
