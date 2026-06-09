import { NextRequest } from "next/server";
import { eq, desc, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { notifications, auctions, lots } from "@/lib/db/schema";
import { requireUserId, handleApiError } from "@/lib/auth-request";

export async function GET(request: NextRequest) {
  try {
    const userId = requireUserId(request);

    const rows = await db
      .select({
        id: notifications.id,
        type: notifications.type,
        auctionId: notifications.auctionId,
        message: notifications.message,
        read: notifications.read,
        createdAt: notifications.createdAt,
        auctionTitle: lots.title,
      })
      .from(notifications)
      .innerJoin(auctions, eq(notifications.auctionId, auctions.id))
      .innerJoin(lots, eq(auctions.lotId, lots.id))
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(100);

    return Response.json({
      notifications: rows.map((n) => ({
        id: n.id,
        type: n.type,
        auctionId: n.auctionId,
        auctionTitle: n.auctionTitle,
        message: n.message,
        read: n.read,
        createdAt: n.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
