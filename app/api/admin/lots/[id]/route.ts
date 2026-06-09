import { NextRequest } from "next/server";
import { eq, desc, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  lots,
  lotImages,
  users,
  auctions,
  bids,
  wallets,
  auctionMessages,
} from "@/lib/db/schema";
import { requireAdmin, handleApiError } from "@/lib/auth-request";
import { kopecksToRubles } from "@/lib/wallet-service";

const patchSchema = z.object({
  status: z.enum(["draft", "active", "ended", "sold"]).optional(),
});

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  try {
    await requireAdmin(request);
    const { id } = await params;

    const [row] = await db
      .select({
        id: lots.id,
        title: lots.title,
        description: lots.description,
        category: lots.category,
        status: lots.status,
        createdAt: lots.createdAt,
        sellerId: lots.sellerId,
        sellerId: lots.sellerId,
        sellerName: users.name,
        sellerEmail: users.email,
        sellerPhone: users.phone,
      })
      .from(lots)
      .innerJoin(users, eq(lots.sellerId, users.id))
      .where(eq(lots.id, id));

    if (!row) return Response.json({ error: "Не найден" }, { status: 404 });

    const images = await db
      .select()
      .from(lotImages)
      .where(eq(lotImages.lotId, id))
      .orderBy(lotImages.sortOrder);

    const [auction] = await db
      .select()
      .from(auctions)
      .where(eq(auctions.lotId, id));

    const bidRows = auction
      ? await db
          .select({
            id: bids.id,
            amount: bids.amount,
            userName: users.name,
            createdAt: bids.createdAt,
          })
          .from(bids)
          .innerJoin(users, eq(bids.userId, users.id))
          .where(eq(bids.auctionId, auction.id))
          .orderBy(desc(bids.amount))
          .limit(20)
      : [];

    const [{ bidsCount }] = auction
      ? await db
          .select({ bidsCount: sql<number>`count(*)::int` })
          .from(bids)
          .where(eq(bids.auctionId, auction.id))
      : [{ bidsCount: 0 }];

    const [winner] =
      auction?.winnerId
        ? await db
            .select({ name: users.name, email: users.email })
            .from(users)
            .where(eq(users.id, auction.winnerId))
        : [];

    const [{ msgCount }] = auction
      ? await db
          .select({ msgCount: sql<number>`count(*)::int` })
          .from(auctionMessages)
          .where(eq(auctionMessages.auctionId, auction.id))
      : [{ msgCount: 0 }];

    const [sellerWallet] = await db
      .select({ balanceKopecks: wallets.balanceKopecks })
      .from(wallets)
      .where(eq(wallets.userId, row.sellerId));

    return Response.json({
      lot: {
        ...row,
        createdAt: row.createdAt.toISOString(),
        images: images.map((i) => ({ id: i.id, url: i.url, sortOrder: i.sortOrder })),
        sellerWalletRubles: sellerWallet ? kopecksToRubles(sellerWallet.balanceKopecks) : 0,
        auction: auction
          ? {
              id: auction.id,
              status: auction.status,
              startPrice: auction.startPrice,
              currentPrice: auction.currentPrice,
              bidStep: auction.bidStep,
              dealStatus: auction.dealStatus,
              startsAt: auction.startsAt.toISOString(),
              endsAt: auction.endsAt.toISOString(),
              winnerName: winner?.name ?? null,
              winnerEmail: winner?.email ?? null,
              bidsCount: bidsCount ?? 0,
              messagesCount: msgCount ?? 0,
              bids: bidRows.map((b) => ({
                ...b,
                createdAt: b.createdAt.toISOString(),
              })),
            }
          : null,
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
    if (!parsed.success || !parsed.data.status) {
      return Response.json({ error: "Ошибка валидации" }, { status: 400 });
    }

    const [lot] = await db
      .update(lots)
      .set({ status: parsed.data.status })
      .where(eq(lots.id, id))
      .returning();

    if (!lot) return Response.json({ error: "Не найден" }, { status: 404 });
    return Response.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    await requireAdmin(_request);
    const { id } = await params;
    await db.delete(lotImages).where(eq(lotImages.lotId, id));
    await db.delete(lots).where(eq(lots.id, id));
    return Response.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
