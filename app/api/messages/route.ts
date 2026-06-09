import { NextRequest } from "next/server";
import { and, desc, eq, inArray, isNotNull, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { auctions, lots, lotImages, auctionMessages, users } from "@/lib/db/schema";
import { requireUserId, handleApiError } from "@/lib/auth-request";

export async function GET(request: NextRequest) {
  try {
    const userId = requireUserId(request);

    const [me] = await db
      .select({ role: users.role })
      .from(users)
      .where(eq(users.id, userId));

    const accessFilter =
      me?.role === "admin"
        ? and(eq(auctions.status, "ended"), isNotNull(auctions.winnerId))
        : and(
            eq(auctions.status, "ended"),
            isNotNull(auctions.winnerId),
            or(eq(lots.sellerId, userId), eq(auctions.winnerId, userId)),
          );

    const rows = await db
      .select({
        auctionId: auctions.id,
        title: lots.title,
        dealStatus: auctions.dealStatus,
        currentPrice: auctions.currentPrice,
        sellerId: lots.sellerId,
        sellerName: users.name,
        winnerId: auctions.winnerId,
      })
      .from(auctions)
      .innerJoin(lots, eq(auctions.lotId, lots.id))
      .innerJoin(users, eq(lots.sellerId, users.id))
      .where(accessFilter)
      .orderBy(desc(auctions.endsAt))
      .limit(50);

    if (rows.length === 0) {
      return Response.json({ conversations: [] });
    }

    const auctionIds = rows.map((r) => r.auctionId);

    const lotRows = await db
      .select({ auctionId: auctions.id, lotId: lots.id })
      .from(auctions)
      .innerJoin(lots, eq(auctions.lotId, lots.id))
      .where(inArray(auctions.id, auctionIds));

    const lotIdByAuction = new Map(lotRows.map((x) => [x.auctionId, x.lotId]));
    const lotIds = [...new Set(lotRows.map((x) => x.lotId))];

    const images =
      lotIds.length > 0
        ? await db
            .select({ lotId: lotImages.lotId, url: lotImages.url })
            .from(lotImages)
            .where(inArray(lotImages.lotId, lotIds))
            .orderBy(lotImages.sortOrder)
        : [];

    const imageByLot = new Map<string, string>();
    for (const img of images) {
      if (!imageByLot.has(img.lotId)) imageByLot.set(img.lotId, img.url);
    }

    const winnerIds = [...new Set(rows.map((r) => r.winnerId).filter(Boolean))] as string[];
    const winnerMap = new Map<string, string>();
    if (winnerIds.length > 0) {
      const winners = await db
        .select({ id: users.id, name: users.name })
        .from(users)
        .where(inArray(users.id, winnerIds));
      for (const w of winners) winnerMap.set(w.id, w.name);
    }

    const allMessages = await db
      .select({
        auctionId: auctionMessages.auctionId,
        body: auctionMessages.body,
        createdAt: auctionMessages.createdAt,
        senderId: auctionMessages.senderId,
      })
      .from(auctionMessages)
      .where(inArray(auctionMessages.auctionId, auctionIds))
      .orderBy(desc(auctionMessages.createdAt));

    const lastByAuction = new Map<
      string,
      { body: string; createdAt: Date; senderId: string }
    >();
    for (const m of allMessages) {
      if (!lastByAuction.has(m.auctionId)) {
        lastByAuction.set(m.auctionId, m);
      }
    }

    const conversations = rows.map((row) => {
      const isSeller = row.sellerId === userId;
      const counterpartName = isSeller
        ? (row.winnerId ? winnerMap.get(row.winnerId) : "Победитель")
        : row.sellerName;
      const last = lastByAuction.get(row.auctionId);
      const lotId = lotIdByAuction.get(row.auctionId);

      return {
        auctionId: row.auctionId,
        title: row.title,
        imageUrl: lotId ? (imageByLot.get(lotId) ?? null) : null,
        dealStatus: row.dealStatus,
        currentPrice: row.currentPrice,
        role: isSeller ? ("seller" as const) : ("winner" as const),
        counterpartName: counterpartName ?? "Участник",
        lastMessage: last
          ? {
              body: last.body,
              createdAt: last.createdAt.toISOString(),
              isMine: last.senderId === userId,
            }
          : null,
      };
    });

    return Response.json({ conversations });
  } catch (error) {
    return handleApiError(error);
  }
}
