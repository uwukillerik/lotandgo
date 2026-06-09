import { NextRequest } from "next/server";
import { eq, and, ilike, desc, asc, gte, lte, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { auctions, lots, lotImages, bids, users } from "@/lib/db/schema";
import { createAuctionSchema } from "@shared/schemas";
import { getUserId, requireUserId, handleApiError } from "@/lib/auth-request";
import { getActivePromotionsMap, comparePromotionTier } from "@/lib/promotion-service";

const listQuerySchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  status: z.enum(["scheduled", "active", "ended", "all"]).optional(),
  minPrice: z.coerce.number().int().nonnegative().optional(),
  maxPrice: z.coerce.number().int().positive().optional(),
  sort: z
    .enum(["newest", "price_asc", "price_desc", "ending_soon", "bids_desc"])
    .optional()
    .default("newest"),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
});

export async function GET(request: NextRequest) {
  try {
    const params = Object.fromEntries(request.nextUrl.searchParams);
    const parsed = listQuerySchema.safeParse(params);
    if (!parsed.success) {
      return Response.json({ error: "Ошибка валидации" }, { status: 400 });
    }

    const { search, category, status, minPrice, maxPrice, sort, page, limit } = parsed.data;
    const offset = (page - 1) * limit;

    const conditions = [];
    if (search) conditions.push(ilike(lots.title, `%${search}%`));
    if (category && category !== "Все") conditions.push(eq(lots.category, category));
    if (status && status !== "all") conditions.push(eq(auctions.status, status));
    if (minPrice !== undefined) conditions.push(gte(auctions.currentPrice, minPrice));
    if (maxPrice !== undefined) conditions.push(lte(auctions.currentPrice, maxPrice));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const orderBy =
      sort === "price_asc"
        ? asc(auctions.currentPrice)
        : sort === "price_desc"
          ? desc(auctions.currentPrice)
          : sort === "ending_soon"
            ? asc(auctions.endsAt)
            : desc(auctions.createdAt);

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
      .from(auctions)
      .innerJoin(lots, eq(auctions.lotId, lots.id))
      .innerJoin(users, eq(lots.sellerId, users.id))
      .where(whereClause)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    const lotIds = rows.map((r) => r.lotId);
    const promoMap = await getActivePromotionsMap(lotIds);

    const items = await Promise.all(
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

        const promo = promoMap.get(row.lotId);

        return {
          id: row.id,
          lotId: row.lotId,
          title: row.title,
          category: row.category,
          imageUrl: images[0]?.url ?? null,
          imageCount: images.length,
          startPrice: row.startPrice,
          currentPrice: row.currentPrice,
          bidStep: row.bidStep,
          bidsCount: count,
          status: row.status,
          startsAt: row.startsAt.toISOString(),
          endsAt: row.endsAt.toISOString(),
          sellerId: row.sellerId,
          sellerName: row.sellerName,
          promotion: promo
            ? { tier: promo.tier, expiresAt: promo.expiresAt }
            : null,
        };
      }),
    );

    items.sort((a, b) => {
      const tierCmp = comparePromotionTier(a.promotion?.tier, b.promotion?.tier);
      if (tierCmp !== 0) return tierCmp;

      switch (sort) {
        case "price_asc":
          return a.currentPrice - b.currentPrice;
        case "price_desc":
          return b.currentPrice - a.currentPrice;
        case "ending_soon":
          return new Date(a.endsAt).getTime() - new Date(b.endsAt).getTime();
        case "bids_desc":
          return b.bidsCount - a.bidsCount;
        default:
          return new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime();
      }
    });

    return Response.json({ auctions: items, page, limit });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = requireUserId(request);
    const body = await request.json();
    const parsed = createAuctionSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: "Ошибка валидации", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { lotId, startPrice, bidStep, startsAt, endsAt } = parsed.data;

    if (endsAt <= startsAt) {
      return Response.json(
        { error: "Время окончания должно быть позже начала" },
        { status: 400 },
      );
    }

    const [lot] = await db
      .select()
      .from(lots)
      .where(and(eq(lots.id, lotId), eq(lots.sellerId, userId)));

    if (!lot) return Response.json({ error: "Лот не найден" }, { status: 404 });
    if (lot.status !== "draft") {
      return Response.json({ error: "Лот уже выставлен на торги" }, { status: 400 });
    }

    const [existing] = await db
      .select({ id: auctions.id })
      .from(auctions)
      .where(eq(auctions.lotId, lotId));

    if (existing) {
      return Response.json(
        { error: "Аукцион для этого лота уже существует" },
        { status: 409 },
      );
    }

    const now = new Date();
    const status = startsAt <= now ? "active" : "scheduled";

    const [auction] = await db
      .insert(auctions)
      .values({
        lotId,
        startPrice,
        bidStep,
        currentPrice: startPrice,
        startsAt,
        endsAt,
        status,
      })
      .returning();

    await db
      .update(lots)
      .set({ status: status === "active" ? "active" : "draft" })
      .where(eq(lots.id, lotId));

    return Response.json(
      {
        auction: {
          id: auction.id,
          lotId: auction.lotId,
          startPrice: auction.startPrice,
          bidStep: auction.bidStep,
          currentPrice: auction.currentPrice,
          status: auction.status,
          startsAt: auction.startsAt.toISOString(),
          endsAt: auction.endsAt.toISOString(),
        },
      },
      { status: 201 },
    );
  } catch (error) {
    return handleApiError(error);
  }
}
