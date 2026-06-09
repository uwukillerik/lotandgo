import { NextRequest } from "next/server";
import { eq, desc, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { lots, users, lotImages, auctions } from "@/lib/db/schema";
import { requireAdmin, handleApiError } from "@/lib/auth-request";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);

    const rows = await db
      .select({
        id: lots.id,
        title: lots.title,
        description: lots.description,
        category: lots.category,
        status: lots.status,
        sellerName: users.name,
        sellerEmail: users.email,
        createdAt: lots.createdAt,
        auctionId: auctions.id,
        auctionStatus: auctions.status,
        currentPrice: auctions.currentPrice,
        dealStatus: auctions.dealStatus,
      })
      .from(lots)
      .innerJoin(users, eq(lots.sellerId, users.id))
      .leftJoin(auctions, eq(auctions.lotId, lots.id))
      .orderBy(desc(lots.createdAt))
      .limit(100);

    const lotIds = rows.map((r) => r.id);
    const images =
      lotIds.length > 0
        ? await db
            .select({ lotId: lotImages.lotId, url: lotImages.url })
            .from(lotImages)
            .where(inArray(lotImages.lotId, lotIds))
            .orderBy(lotImages.sortOrder)
        : [];

    const imageMap = new Map<string, string>();
    for (const img of images) {
      if (!imageMap.has(img.lotId)) imageMap.set(img.lotId, img.url);
    }

    return Response.json({
      lots: rows.map((l) => ({
        ...l,
        imageUrl: imageMap.get(l.id) ?? null,
        createdAt: l.createdAt.toISOString(),
        description: l.description.slice(0, 120) + (l.description.length > 120 ? "…" : ""),
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
