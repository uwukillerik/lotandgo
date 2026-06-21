import { NextRequest } from "next/server";
import { eq, and, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { favorites, auctions, lots, lotImages, users, bids } from "@/lib/db/schema";
import { requireUserId, handleApiError } from "@/lib/auth-request";
import type { AuctionListItem } from "@shared/api";

async function mapFavoriteRows(userId: string): Promise<AuctionListItem[]> {
  const rows = await db
    .select({
      id: auctions.id,
      lotId: auctions.lotId,
      title: lots.title,
      category: lots.category,
      startPrice: auctions.startPrice,
      currentPrice: auctions.currentPrice,
      bidStep: auctions.bidStep,
      status: auctions.status,
      startsAt: auctions.startsAt,
      endsAt: auctions.endsAt,
      sellerId: lots.sellerId,
      sellerName: users.name,
    })
    .from(favorites)
    .innerJoin(auctions, eq(favorites.auctionId, auctions.id))
    .innerJoin(lots, eq(auctions.lotId, lots.id))
    .innerJoin(users, eq(lots.sellerId, users.id))
    .where(eq(favorites.userId, userId));

  return Promise.all(
    rows.map(async (row) => {
      const images = await db
        .select({ url: lotImages.url })
        .from(lotImages)
        .where(eq(lotImages.lotId, row.lotId))
        .orderBy(lotImages.sortOrder);
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(bids)
        .where(eq(bids.auctionId, row.id));
      return {
        id: row.id,
        lotId: row.lotId,
        title: row.title,
        category: row.category as AuctionListItem["category"],
        imageUrl: images[0]?.url ?? null,
        imageCount: images.length,
        startPrice: row.startPrice,
        currentPrice: row.currentPrice,
        bidStep: row.bidStep,
        bidsCount: count ?? 0,
        status: row.status as AuctionListItem["status"],
        startsAt: row.startsAt.toISOString(),
        endsAt: row.endsAt.toISOString(),
        sellerId: row.sellerId,
        sellerName: row.sellerName,
      };
    }),
  );
}

export async function GET(request: NextRequest) {
  try {
    const userId = requireUserId(request);
    const auctionId = request.nextUrl.searchParams.get("auctionId");
    if (auctionId) {
      const [fav] = await db
        .select({ id: favorites.id })
        .from(favorites)
        .where(and(eq(favorites.userId, userId), eq(favorites.auctionId, auctionId)));
      return Response.json({ favorited: Boolean(fav) });
    }
    const items = await mapFavoriteRows(userId);
    return Response.json({ favorites: items });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = requireUserId(request);
    const { auctionId } = z.object({ auctionId: z.string().uuid() }).parse(await request.json());
    const [auction] = await db.select({ id: auctions.id }).from(auctions).where(eq(auctions.id, auctionId));
    if (!auction) {
      return Response.json({ error: "Аукцион не найден" }, { status: 404 });
    }
    const [existing] = await db
      .select({ id: favorites.id })
      .from(favorites)
      .where(and(eq(favorites.userId, userId), eq(favorites.auctionId, auctionId)));
    if (!existing) {
      await db.insert(favorites).values({ userId, auctionId });
    }
    return Response.json({ ok: true, favorited: true });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = requireUserId(request);
    const auctionId = request.nextUrl.searchParams.get("auctionId");
    if (!auctionId) {
      return Response.json({ error: "auctionId обязателен" }, { status: 400 });
    }
    await db
      .delete(favorites)
      .where(and(eq(favorites.userId, userId), eq(favorites.auctionId, auctionId)));
    return Response.json({ ok: true, favorited: false });
  } catch (error) {
    return handleApiError(error);
  }
}
