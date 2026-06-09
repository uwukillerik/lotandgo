import { eq, and, gt, inArray, desc } from "drizzle-orm";
import { db } from "./db";
import { lotPromotions, lots, auctions, wallets, walletTransactions } from "./db/schema";
import {
  getPromotionPlan,
  PROMOTION_TIER_ORDER,
  type PromotionTier,
} from "./promotion-config";
import { rublesToKopecks, kopecksToRubles } from "./wallet-service";

type DbTx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export type ActivePromotion = {
  tier: PromotionTier;
  expiresAt: string;
  priceRubles: number;
};

export async function getActivePromotionForLot(lotId: string): Promise<ActivePromotion | null> {
  const map = await getActivePromotionsMap([lotId]);
  return map.get(lotId) ?? null;
}

export async function getActivePromotionsMap(
  lotIds: string[],
): Promise<Map<string, ActivePromotion>> {
  const map = new Map<string, ActivePromotion>();
  if (lotIds.length === 0) return map;

  const now = new Date();
  const rows = await db
    .select()
    .from(lotPromotions)
    .where(and(inArray(lotPromotions.lotId, lotIds), gt(lotPromotions.expiresAt, now)))
    .orderBy(desc(lotPromotions.expiresAt));

  for (const row of rows) {
    if (!map.has(row.lotId)) {
      map.set(row.lotId, {
        tier: row.tier as PromotionTier,
        expiresAt: row.expiresAt.toISOString(),
        priceRubles: row.priceRubles,
      });
    }
  }
  return map;
}

export function comparePromotionTier(
  a: PromotionTier | null | undefined,
  b: PromotionTier | null | undefined,
): number {
  const oa = a ? PROMOTION_TIER_ORDER[a] : 99;
  const ob = b ? PROMOTION_TIER_ORDER[b] : 99;
  return oa - ob;
}

async function debitPromotion(
  tx: DbTx,
  userId: string,
  amountKopecks: number,
  description: string,
  auctionId?: string,
) {
  const [wallet] = await tx.select().from(wallets).where(eq(wallets.userId, userId));
  if (!wallet || wallet.balanceKopecks < amountKopecks) {
    throw new Error("Недостаточно средств на балансе. Пополните кошелёк.");
  }
  const next = wallet.balanceKopecks - amountKopecks;
  await tx
    .update(wallets)
    .set({ balanceKopecks: next, updatedAt: new Date() })
    .where(eq(wallets.userId, userId));
  await tx.insert(walletTransactions).values({
    userId,
    type: "purchase",
    amountKopecks: -amountKopecks,
    balanceAfterKopecks: next,
    description,
    auctionId: auctionId ?? null,
  });
}

export async function purchaseLotPromotion(
  userId: string,
  lotId: string,
  tier: PromotionTier,
) {
  const plan = getPromotionPlan(tier);
  const [lot] = await db.select().from(lots).where(eq(lots.id, lotId));
  if (!lot) throw new Error("Лот не найден");
  if (lot.sellerId !== userId) throw new Error("Можно продвигать только свои лоты");

  const [auction] = await db.select().from(auctions).where(eq(auctions.lotId, lotId));
  if (!auction || auction.status === "ended") {
    throw new Error("Продвижение доступно только для активных и запланированных аукционов");
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + plan.days * 24 * 60 * 60 * 1000);
  const kopecks = rublesToKopecks(plan.priceRubles);

  return db.transaction(async (tx) => {
    await debitPromotion(
      tx,
      userId,
      kopecks,
      `Продвижение «${plan.name}» — ${lot.title}`,
      auction.id,
    );

    await tx.insert(lotPromotions).values({
      lotId,
      tier,
      priceRubles: plan.priceRubles,
      startsAt: now,
      expiresAt,
    });

    const [w] = await tx.select().from(wallets).where(eq(wallets.userId, userId));

    return {
      tier,
      expiresAt: expiresAt.toISOString(),
      priceRubles: plan.priceRubles,
      balanceRubles: kopecksToRubles(w?.balanceKopecks ?? 0),
    };
  });
}
