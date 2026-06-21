import { NextRequest } from "next/server";
import { z } from "zod";
import { eq, and, desc, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { auctions, lots, sellerReviews, users } from "@/lib/db/schema";
import { requireUserId, handleApiError } from "@/lib/auth-request";

const createSchema = z.object({
  auctionId: z.string().uuid(),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const sellerId = request.nextUrl.searchParams.get("sellerId");
    if (!sellerId) {
      return Response.json({ error: "Укажите sellerId" }, { status: 400 });
    }

    const rows = await db
      .select({
        id: sellerReviews.id,
        rating: sellerReviews.rating,
        comment: sellerReviews.comment,
        createdAt: sellerReviews.createdAt,
        reviewerName: users.name,
      })
      .from(sellerReviews)
      .innerJoin(users, eq(sellerReviews.reviewerId, users.id))
      .where(eq(sellerReviews.sellerId, sellerId))
      .orderBy(desc(sellerReviews.createdAt))
      .limit(20);

    const [{ avg, count }] = await db
      .select({
        avg: sql<number>`coalesce(avg(${sellerReviews.rating}), 0)`,
        count: sql<number>`count(*)::int`,
      })
      .from(sellerReviews)
      .where(eq(sellerReviews.sellerId, sellerId));

    return Response.json({
      reviews: rows.map((r) => ({
        ...r,
        createdAt: r.createdAt.toISOString(),
      })),
      averageRating: Number(avg),
      totalReviews: count ?? 0,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = requireUserId(request);
    const body = await request.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: "Некорректные данные" }, { status: 400 });
    }

    const { auctionId, rating, comment } = parsed.data;

    const [auction] = await db
      .select({
        winnerId: auctions.winnerId,
        dealStatus: auctions.dealStatus,
        sellerId: lots.sellerId,
      })
      .from(auctions)
      .innerJoin(lots, eq(auctions.lotId, lots.id))
      .where(eq(auctions.id, auctionId));

    if (!auction) {
      return Response.json({ error: "Аукцион не найден" }, { status: 404 });
    }
    if (auction.winnerId !== userId) {
      return Response.json({ error: "Отзыв может оставить только победитель" }, { status: 403 });
    }
    if (auction.dealStatus !== "completed") {
      return Response.json({ error: "Отзыв доступен после завершения сделки" }, { status: 400 });
    }

    const [review] = await db
      .insert(sellerReviews)
      .values({
        sellerId: auction.sellerId,
        reviewerId: userId,
        auctionId,
        rating,
        comment: comment ?? null,
      })
      .returning();

    return Response.json({
      review: {
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt.toISOString(),
      },
    });
  } catch (error) {
    if ((error as { code?: string }).code === "23505") {
      return Response.json({ error: "Вы уже оставили отзыв по этому лоту" }, { status: 409 });
    }
    return handleApiError(error);
  }
}
