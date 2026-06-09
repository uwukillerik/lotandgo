import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { auctions, lots } from "@/lib/db/schema";
import { requireUserId, handleApiError } from "@/lib/auth-request";
import { getChatAccess } from "@/lib/chat-access";
import { createNotification } from "@/lib/services/notificationService";
import { emitToAuction } from "@/lib/ws/emit";
import { settleAuctionPayment } from "@/lib/wallet-service";

type Params = { params: Promise<{ id: string }> };

const patchSchema = z.object({
  status: z.enum(["paid", "shipped", "completed"]),
});

const DEAL_LABELS: Record<string, string> = {
  paid: "Победитель отметил оплату",
  shipped: "Продавец отметил отправку",
  completed: "Сделка завершена",
};

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { id: auctionId } = await params;
    const userId = requireUserId(request);
    const access = await getChatAccess(auctionId, userId);
    if (!access) {
      return Response.json({ error: "Сделка недоступна" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: "Некорректный статус" }, { status: 400 });
    }

    const [auction] = await db
      .select({
        dealStatus: auctions.dealStatus,
        currentPrice: auctions.currentPrice,
        winnerId: auctions.winnerId,
      })
      .from(auctions)
      .where(eq(auctions.id, auctionId));

    if (!auction) {
      return Response.json({ error: "Аукцион не найден" }, { status: 404 });
    }

    const next = parsed.data.status;

    if (next === "paid" && !access.isWinner && !access.isAdmin) {
      return Response.json({ error: "Только победитель может отметить оплату" }, { status: 403 });
    }
    if (next === "shipped" && !access.isSeller && !access.isAdmin) {
      return Response.json({ error: "Только продавец может отметить отправку" }, { status: 403 });
    }
    if (next === "completed" && !access.isWinner && !access.isAdmin) {
      return Response.json({ error: "Только победитель может завершить сделку" }, { status: 403 });
    }

    const allowed: Record<string, string[]> = {
      awaiting_payment: ["paid"],
      paid: ["shipped"],
      shipped: ["completed"],
      completed: [],
      none: [],
    };

    const current = auction.dealStatus ?? "none";
    if (!allowed[current]?.includes(next)) {
      return Response.json(
        { error: `Нельзя перейти из «${current}» в «${next}»` },
        { status: 400 },
      );
    }

    let paymentInfo: { amountRubles: number; sellerReceivesRubles: number } | null = null;

    if (next === "paid") {
      paymentInfo = await settleAuctionPayment(auctionId, access.winnerId);
    }

    await db
      .update(auctions)
      .set({ dealStatus: next })
      .where(eq(auctions.id, auctionId));

    const [lot] = await db
      .select({ title: lots.title })
      .from(auctions)
      .innerJoin(lots, eq(auctions.lotId, lots.id))
      .where(eq(auctions.id, auctionId));

    const label = DEAL_LABELS[next] ?? "Статус сделки обновлён";
    const msg = `«${lot?.title ?? "Лот"}»: ${label}`;

    const otherId = access.isSeller ? access.winnerId : access.sellerId;
    await createNotification(otherId, auctionId, "deal_update", msg);

    emitToAuction(auctionId, "deal:updated", { auctionId, dealStatus: next });

    return Response.json({ ok: true, dealStatus: next, payment: paymentInfo });
  } catch (error) {
    return handleApiError(error);
  }
}
