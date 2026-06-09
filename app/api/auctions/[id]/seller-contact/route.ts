import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { auctions, lots, users } from "@/lib/db/schema";
import { requireUserId, handleApiError } from "@/lib/auth-request";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id: auctionId } = await params;
    const userId = requireUserId(request);

    const [auction] = await db
      .select({
        status: auctions.status,
        winnerId: auctions.winnerId,
        lotId: auctions.lotId,
      })
      .from(auctions)
      .where(eq(auctions.id, auctionId));

    if (!auction) {
      return Response.json({ error: "Аукцион не найден" }, { status: 404 });
    }
    if (auction.status !== "ended") {
      return Response.json({ error: "Аукцион ещё не завершён" }, { status: 403 });
    }
    if (auction.winnerId !== userId) {
      return Response.json(
        { error: "Контакты доступны только победителю" },
        { status: 403 },
      );
    }

    const [lot] = await db
      .select({ sellerId: lots.sellerId })
      .from(lots)
      .where(eq(lots.id, auction.lotId));

    if (!lot) {
      return Response.json({ error: "Лот не найден" }, { status: 404 });
    }

    const [seller] = await db
      .select({ name: users.name, email: users.email, phone: users.phone })
      .from(users)
      .where(eq(users.id, lot.sellerId));

    if (!seller) {
      return Response.json({ error: "Продавец не найден" }, { status: 404 });
    }

    return Response.json({
      contact: { name: seller.name, email: seller.email, phone: seller.phone },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
