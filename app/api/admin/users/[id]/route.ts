import { NextRequest } from "next/server";
import { eq, desc, sql } from "drizzle-orm";
import { z } from "zod";
import bcrypt from "bcrypt";
import { db } from "@/lib/db";
import {
  users,
  lots,
  auctions,
  bids,
  wallets,
  walletTransactions,
} from "@/lib/db/schema";
import { requireAdmin, handleApiError } from "@/lib/auth-request";
import { kopecksToRubles } from "@/lib/wallet-service";

const patchSchema = z.object({
  role: z.enum(["user", "admin"]).optional(),
  password: z.string().min(8).max(128).optional(),
  name: z.string().min(1).max(120).optional(),
  email: z.string().email().optional(),
});

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  try {
    await requireAdmin(request);
    const { id } = await params;

    const [user] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
        role: users.role,
        avatarUrl: users.avatarUrl,
        stripeCustomerId: users.stripeCustomerId,
        paymentVerifiedAt: users.paymentVerifiedAt,
        termsAcceptedAt: users.termsAcceptedAt,
        privacyAcceptedAt: users.privacyAcceptedAt,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, id));

    if (!user) return Response.json({ error: "Не найден" }, { status: 404 });

    const [wallet] = await db
      .select({ balanceKopecks: wallets.balanceKopecks })
      .from(wallets)
      .where(eq(wallets.userId, id));

    const [{ lotsCount }] = await db
      .select({ lotsCount: sql<number>`count(*)::int` })
      .from(lots)
      .where(eq(lots.sellerId, id));

    const [{ bidsCount }] = await db
      .select({ bidsCount: sql<number>`count(*)::int` })
      .from(bids)
      .where(eq(bids.userId, id));

    const [{ winsCount }] = await db
      .select({ winsCount: sql<number>`count(*)::int` })
      .from(auctions)
      .where(eq(auctions.winnerId, id));

    const userLots = await db
      .select({
        id: lots.id,
        title: lots.title,
        status: lots.status,
        category: lots.category,
        createdAt: lots.createdAt,
        auctionId: auctions.id,
        auctionStatus: auctions.status,
        currentPrice: auctions.currentPrice,
      })
      .from(lots)
      .leftJoin(auctions, eq(auctions.lotId, lots.id))
      .where(eq(lots.sellerId, id))
      .orderBy(desc(lots.createdAt))
      .limit(20);

    const userBids = await db
      .select({
        id: bids.id,
        amount: bids.amount,
        createdAt: bids.createdAt,
        auctionId: bids.auctionId,
        lotTitle: lots.title,
      })
      .from(bids)
      .innerJoin(auctions, eq(bids.auctionId, auctions.id))
      .innerJoin(lots, eq(auctions.lotId, lots.id))
      .where(eq(bids.userId, id))
      .orderBy(desc(bids.createdAt))
      .limit(20);

    const wonAuctions = await db
      .select({
        id: auctions.id,
        title: lots.title,
        currentPrice: auctions.currentPrice,
        dealStatus: auctions.dealStatus,
        endsAt: auctions.endsAt,
      })
      .from(auctions)
      .innerJoin(lots, eq(auctions.lotId, lots.id))
      .where(eq(auctions.winnerId, id))
      .orderBy(desc(auctions.endsAt))
      .limit(10);

    const transactions = await db
      .select({
        id: walletTransactions.id,
        type: walletTransactions.type,
        amountKopecks: walletTransactions.amountKopecks,
        createdAt: walletTransactions.createdAt,
      })
      .from(walletTransactions)
      .where(eq(walletTransactions.userId, id))
      .orderBy(desc(walletTransactions.createdAt))
      .limit(15);

    return Response.json({
      user: {
        ...user,
        paymentVerified: user.paymentVerifiedAt != null,
        createdAt: user.createdAt.toISOString(),
        paymentVerifiedAt: user.paymentVerifiedAt?.toISOString() ?? null,
        termsAcceptedAt: user.termsAcceptedAt?.toISOString() ?? null,
        privacyAcceptedAt: user.privacyAcceptedAt?.toISOString() ?? null,
        walletRubles: wallet ? kopecksToRubles(wallet.balanceKopecks) : 0,
        stats: {
          lotsCount: lotsCount ?? 0,
          bidsCount: bidsCount ?? 0,
          winsCount: winsCount ?? 0,
        },
        lots: userLots.map((l) => ({
          ...l,
          createdAt: l.createdAt.toISOString(),
        })),
        bids: userBids.map((b) => ({
          ...b,
          createdAt: b.createdAt.toISOString(),
        })),
        wonAuctions: wonAuctions.map((a) => ({
          ...a,
          endsAt: a.endsAt.toISOString(),
        })),
        transactions: transactions.map((t) => ({
          ...t,
          amountRubles: kopecksToRubles(t.amountKopecks),
          createdAt: t.createdAt.toISOString(),
        })),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    await requireAdmin(request);
    const { id } = await params;
    const body = await request.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: "Ошибка валидации" }, { status: 400 });
    }

    const updates: Partial<typeof users.$inferInsert> = {};
    if (parsed.data.role) updates.role = parsed.data.role;
    if (parsed.data.name) updates.name = parsed.data.name;
    if (parsed.data.email) updates.email = parsed.data.email;
    if (parsed.data.password) {
      updates.passwordHash = await bcrypt.hash(parsed.data.password, 12);
    }

    if (Object.keys(updates).length === 0) {
      return Response.json({ error: "Нет данных" }, { status: 400 });
    }

    const [user] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning({ id: users.id });

    if (!user) {
      return Response.json({ error: "Не найден" }, { status: 404 });
    }

    return Response.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const adminId = await requireAdmin(request);
    const { id } = await params;

    if (id === adminId) {
      return Response.json({ error: "Нельзя удалить свой аккаунт" }, { status: 400 });
    }

    const [target] = await db
      .select({ id: users.id, role: users.role })
      .from(users)
      .where(eq(users.id, id));

    if (!target) {
      return Response.json({ error: "Не найден" }, { status: 404 });
    }

    await db.update(auctions).set({ winnerId: null }).where(eq(auctions.winnerId, id));
    await db.delete(users).where(eq(users.id, id));

    return Response.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
