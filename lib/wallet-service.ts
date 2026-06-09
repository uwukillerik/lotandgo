import { eq, desc } from "drizzle-orm";
import { db } from "./db";
import { wallets, walletTransactions, auctions, lots, users } from "./db/schema";

export const PLATFORM_FEE_PERCENT = 5;

type DbTx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export function rublesToKopecks(rubles: number): number {
  return Math.round(rubles * 100);
}

export function kopecksToRubles(kopecks: number): number {
  return kopecks / 100;
}

async function ensureWalletTx(tx: DbTx, userId: string) {
  const [w] = await tx.select().from(wallets).where(eq(wallets.userId, userId));
  if (w) return w;
  const [created] = await tx
    .insert(wallets)
    .values({ userId, balanceKopecks: 0 })
    .returning();
  return created;
}

async function creditTx(
  tx: DbTx,
  userId: string,
  amountKopecks: number,
  type: "deposit" | "sale" | "refund",
  description: string,
  meta?: { auctionId?: string; counterpartyUserId?: string },
) {
  if (amountKopecks <= 0) throw new Error("Сумма должна быть положительной");
  const wallet = await ensureWalletTx(tx, userId);
  const next = wallet.balanceKopecks + amountKopecks;
  await tx.update(wallets).set({ balanceKopecks: next, updatedAt: new Date() }).where(eq(wallets.userId, userId));
  await tx.insert(walletTransactions).values({
    userId,
    type,
    amountKopecks,
    balanceAfterKopecks: next,
    description,
    auctionId: meta?.auctionId ?? null,
    counterpartyUserId: meta?.counterpartyUserId ?? null,
  });
  return next;
}

async function debitTx(
  tx: DbTx,
  userId: string,
  amountKopecks: number,
  type: "withdraw" | "purchase" | "fee",
  description: string,
  meta?: { auctionId?: string; counterpartyUserId?: string },
) {
  if (amountKopecks <= 0) throw new Error("Сумма должна быть положительной");
  const wallet = await ensureWalletTx(tx, userId);
  if (wallet.balanceKopecks < amountKopecks) {
    throw new Error("Недостаточно средств на балансе");
  }
  const next = wallet.balanceKopecks - amountKopecks;
  await tx.update(wallets).set({ balanceKopecks: next, updatedAt: new Date() }).where(eq(wallets.userId, userId));
  await tx.insert(walletTransactions).values({
    userId,
    type,
    amountKopecks: -amountKopecks,
    balanceAfterKopecks: next,
    description,
    auctionId: meta?.auctionId ?? null,
    counterpartyUserId: meta?.counterpartyUserId ?? null,
  });
  return next;
}

export async function getWalletSummary(userId: string) {
  const [wallet] = await db.select().from(wallets).where(eq(wallets.userId, userId));
  const balanceKopecks = wallet?.balanceKopecks ?? 0;
  return {
    balanceKopecks,
    balanceRubles: kopecksToRubles(balanceKopecks),
    hasWallet: Boolean(wallet),
  };
}

export async function getWalletTransactions(userId: string, limit = 30) {
  const rows = await db
    .select()
    .from(walletTransactions)
    .where(eq(walletTransactions.userId, userId))
    .orderBy(desc(walletTransactions.createdAt))
    .limit(limit);

  return rows.map((t) => ({
    id: t.id,
    type: t.type,
    amountKopecks: t.amountKopecks,
    amountRubles: kopecksToRubles(t.amountKopecks),
    balanceAfterRubles: kopecksToRubles(t.balanceAfterKopecks),
    description: t.description,
    auctionId: t.auctionId,
    createdAt: t.createdAt.toISOString(),
  }));
}

export async function testDeposit(userId: string, amountRubles: number) {
  const kopecks = rublesToKopecks(amountRubles);
  if (kopecks < 100 || kopecks > 10_000_000) {
    throw new Error("Сумма пополнения от 1 ₽ до 100 000 ₽");
  }
  return db.transaction(async (tx) => {
    await creditTx(tx, userId, kopecks, "deposit", `Пополнение баланса (тест) +${amountRubles.toLocaleString("ru-RU")} ₽`);
    return kopecksToRubles((await ensureWalletTx(tx, userId)).balanceKopecks);
  });
}

export async function testWithdraw(userId: string, amountRubles: number) {
  const kopecks = rublesToKopecks(amountRubles);
  if (kopecks < 100) throw new Error("Минимальный вывод — 1 ₽");
  return db.transaction(async (tx) => {
    await debitTx(tx, userId, kopecks, "withdraw", `Вывод на карту (тест) −${amountRubles.toLocaleString("ru-RU")} ₽`);
    return kopecksToRubles((await ensureWalletTx(tx, userId)).balanceKopecks);
  });
}

/** Списание с победителя → зачисление продавцу при оплате лота */
export async function settleAuctionPayment(auctionId: string, winnerId: string) {
  return db.transaction(async (tx) => {
    const [row] = await tx
      .select({
        currentPrice: auctions.currentPrice,
        dealStatus: auctions.dealStatus,
        sellerId: lots.sellerId,
        title: lots.title,
      })
      .from(auctions)
      .innerJoin(lots, eq(auctions.lotId, lots.id))
      .where(eq(auctions.id, auctionId));

    if (!row) throw new Error("Аукцион не найден");
    if (row.dealStatus !== "awaiting_payment") {
      throw new Error("Оплата уже проведена или недоступна");
    }

    const amountKopecks = rublesToKopecks(row.currentPrice);
    const feeKopecks = Math.round((amountKopecks * PLATFORM_FEE_PERCENT) / 100);
    const sellerKopecks = amountKopecks - feeKopecks;

    await debitTx(
      tx,
      winnerId,
      amountKopecks,
      "purchase",
      `Оплата лота «${row.title}»`,
      { auctionId, counterpartyUserId: row.sellerId },
    );

    await creditTx(
      tx,
      row.sellerId,
      sellerKopecks,
      "sale",
      `Продажа «${row.title}» (комиссия ${PLATFORM_FEE_PERCENT}%)`,
      { auctionId, counterpartyUserId: winnerId },
    );

    if (feeKopecks > 0) {
      const [admin] = await tx
        .select({ id: users.id })
        .from(users)
        .where(eq(users.role, "admin"))
        .limit(1);
      if (admin) {
        await creditTx(
          tx,
          admin.id,
          feeKopecks,
          "deposit",
          `Комиссия платформы: «${row.title}»`,
          { auctionId, counterpartyUserId: winnerId },
        );
      }
    }

    return { amountRubles: row.currentPrice, sellerReceivesRubles: kopecksToRubles(sellerKopecks) };
  });
}
