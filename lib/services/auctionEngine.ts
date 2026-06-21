import { eq, and, lte, desc, asc, sql } from "drizzle-orm";
import { db } from "../db";
import { auctions, lots, bids, users } from "../db/schema";
import { createNotification, createNotifications } from "./notificationService";
import { isPaymentRequired, getPaymentProvider } from "../payments";
import { shouldExtendAuction, extendedEndsAt } from "@shared/auction-helpers";
import { notifyCategorySubscribers } from "./categorySubscriptionService";

const LOCAL_METHOD_ID = "local:test";
import type { Server as SocketServer } from "socket.io";

let io: SocketServer | null = null;

export function setAuctionEngineIo(socketIo: SocketServer): void {
  io = socketIo;
}

export async function processAuctionLifecycle(): Promise<void> {
  const now = new Date();

  const toActivate = await db
    .select()
    .from(auctions)
    .where(
      and(eq(auctions.status, "scheduled"), lte(auctions.startsAt, now)),
    );

  for (const auction of toActivate) {
    await db
      .update(auctions)
      .set({ status: "active" })
      .where(eq(auctions.id, auction.id));

    await db
      .update(lots)
      .set({ status: "active" })
      .where(eq(lots.id, auction.lotId));

    const [lot] = await db
      .select({ title: lots.title, sellerId: lots.sellerId, category: lots.category })
      .from(lots)
      .where(eq(lots.id, auction.lotId));

    if (lot) {
      await createNotification(
        lot.sellerId,
        auction.id,
        "auction_start",
        `Торги начались: «${lot.title}»`,
      );
      void notifyCategorySubscribers({
        category: lot.category,
        auctionId: auction.id,
        title: lot.title,
      });
    }

    io?.to(`auction:${auction.id}`).emit("auction:started", {
      auctionId: auction.id,
    });
  }

  const toEnd = await db
    .select()
    .from(auctions)
    .where(and(eq(auctions.status, "active"), lte(auctions.endsAt, now)));

  for (const auction of toEnd) {
    await endAuction(auction.id);
  }
}

export async function endAuction(auctionId: string): Promise<void> {
  const [auction] = await db
    .select()
    .from(auctions)
    .where(eq(auctions.id, auctionId));

  if (!auction || auction.status === "ended") return;

  const topBid = await db
    .select({
      userId: bids.userId,
      amount: bids.amount,
    })
    .from(bids)
    .where(eq(bids.auctionId, auctionId))
    .orderBy(desc(bids.amount), asc(bids.createdAt))
    .limit(1);

  const winnerId = topBid[0]?.userId ?? null;

  await db
    .update(auctions)
    .set({
      status: "ended",
      winnerId,
      dealStatus: winnerId ? "awaiting_payment" : "none",
    })
    .where(eq(auctions.id, auctionId));

  await db
    .update(lots)
    .set({ status: winnerId ? "sold" : "ended" })
    .where(eq(lots.id, auction.lotId));

  const [lot] = await db
    .select({ title: lots.title, sellerId: lots.sellerId })
    .from(lots)
    .where(eq(lots.id, auction.lotId));

  if (!lot) return;

  const bidderRows = await db
    .select({ userId: bids.userId })
    .from(bids)
    .where(eq(bids.auctionId, auctionId))
    .groupBy(bids.userId);

  const notifItems: Array<{
    userId: string;
    auctionId: string;
    type: "auction_end" | "won";
    message: string;
    auctionTitle?: string;
  }> = [
    {
      userId: lot.sellerId,
      auctionId,
      type: "auction_end",
      message: winnerId
        ? `Аукцион «${lot.title}» завершён. Есть победитель.`
        : `Аукцион «${lot.title}» завершён без ставок.`,
    },
  ];

  if (winnerId) {
    notifItems.push({
      userId: winnerId,
      auctionId,
      type: "won",
      message: `Вы победили в аукционе «${lot.title}»! Откройте лот — чат с продавцом и оплата.`,
      auctionTitle: lot.title,
    });
  }

  for (const row of bidderRows) {
    if (row.userId !== winnerId && row.userId !== lot.sellerId) {
      notifItems.push({
        userId: row.userId,
        auctionId,
        type: "auction_end",
        message: `Аукцион «${lot.title}» завершён.`,
        auctionTitle: lot.title,
      });
    }
  }

  await createNotifications(
    notifItems.map((n) => ({
      userId: n.userId,
      auctionId: n.auctionId,
      type: n.type,
      message: n.message,
      auctionTitle: "auctionTitle" in n ? n.auctionTitle : lot.title,
    })),
  );

  io?.to(`auction:${auctionId}`).emit("auction:ended", {
    auctionId,
    winnerId,
    currentPrice: auction.currentPrice,
  });
}

export async function placeBid(
  auctionId: string,
  userId: string,
  amount: number,
): Promise<{ bidId: string; newPrice: number }> {
  return db.transaction(async (tx) => {
    const [auction] = await tx
      .select()
      .from(auctions)
      .where(eq(auctions.id, auctionId))
      .for("update");

    if (!auction) throw new Error("Аукцион не найден");
    if (auction.status !== "active") throw new Error("Торги не активны");

    const now = new Date();
    if (now > auction.endsAt) {
      throw new Error("Время торгов истекло");
    }

    const [lot] = await tx
      .select({ sellerId: lots.sellerId, title: lots.title })
      .from(lots)
      .where(eq(lots.id, auction.lotId));

    if (!lot) throw new Error("Лот не найден");
    if (lot.sellerId === userId) {
      throw new Error("Продавец не может делать ставки");
    }

    const [bidder] = await tx
      .select({
        role: users.role,
        paymentVerifiedAt: users.paymentVerifiedAt,
        stripePaymentMethodId: users.stripePaymentMethodId,
      })
      .from(users)
      .where(eq(users.id, userId));

    if (isPaymentRequired() && bidder?.role !== "admin") {
      const provider = getPaymentProvider();
      const verified =
        provider === "local"
          ? bidder?.paymentVerifiedAt != null &&
            bidder?.stripePaymentMethodId === LOCAL_METHOD_ID
          : bidder?.paymentVerifiedAt != null &&
            Boolean(bidder?.stripePaymentMethodId) &&
            bidder?.stripePaymentMethodId !== LOCAL_METHOD_ID;
      if (!verified) {
        throw new Error("Подтвердите способ оплаты в профиле для участия в торгах");
      }
    }

    const bidCount = await tx
      .select({ count: sql<number>`count(*)::int` })
      .from(bids)
      .where(eq(bids.auctionId, auctionId))
      .then((r) => r[0]?.count ?? 0);

    const minBid =
      bidCount === 0 ? auction.startPrice : auction.currentPrice + auction.bidStep;

    if (amount < minBid) {
      throw new Error(`Минимальная ставка: ${minBid} ₽`);
    }

    const previousTop = await tx
      .select({ userId: bids.userId, amount: bids.amount })
      .from(bids)
      .where(eq(bids.auctionId, auctionId))
      .orderBy(desc(bids.amount), asc(bids.createdAt))
      .limit(1);

    let newEndsAt = auction.endsAt;
    if (shouldExtendAuction(auction.endsAt, now)) {
      newEndsAt = extendedEndsAt(auction.endsAt);
    }

    const [bid] = await tx
      .insert(bids)
      .values({ auctionId, userId, amount })
      .returning();

    await tx
      .update(auctions)
      .set({
        currentPrice: amount,
        ...(newEndsAt.getTime() !== auction.endsAt.getTime()
          ? { endsAt: newEndsAt }
          : {}),
      })
      .where(eq(auctions.id, auctionId));

    const [user] = await tx
      .select({ name: users.name })
      .from(users)
      .where(eq(users.id, userId));

    if (
      previousTop[0] &&
      previousTop[0].userId !== userId &&
      previousTop[0].userId !== lot.sellerId
    ) {
      await createNotification(
        previousTop[0].userId,
        auctionId,
        "outbid",
        `Вашу ставку на «${lot.title}» перебили. Новая цена: ${amount} ₽`,
        { auctionTitle: lot.title, newPrice: amount },
      );
    }

    if (lot.sellerId !== userId) {
      await createNotification(
        lot.sellerId,
        auctionId,
        "auction_start",
        `Новая ставка на «${lot.title}»: ${amount} ₽ (${user?.name ?? "Участник"})`,
      );
    }

    io?.to(`auction:${auctionId}`).emit("bid:new", {
      auctionId,
      bid: {
        id: bid.id,
        auctionId,
        userId,
        userName: user?.name ?? "Участник",
        amount,
        createdAt: bid.createdAt.toISOString(),
      },
      currentPrice: amount,
      endsAt:
        newEndsAt.getTime() !== auction.endsAt.getTime()
          ? newEndsAt.toISOString()
          : undefined,
      extended: newEndsAt.getTime() !== auction.endsAt.getTime(),
    });

    return {
      bidId: bid.id,
      newPrice: amount,
      endsAt:
        newEndsAt.getTime() !== auction.endsAt.getTime()
          ? newEndsAt.toISOString()
          : undefined,
    };
  });
}

export function startAuctionEngine(): void {
  processAuctionLifecycle().catch(console.error);
  setInterval(() => {
    processAuctionLifecycle().catch(console.error);
  }, 30_000);
}
