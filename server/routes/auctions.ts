import { Router } from "express";
import { eq, and, ilike, desc, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db";
import { auctions, lots, lotImages, bids, users } from "../db/schema";
import { createAuctionSchema, placeBidSchema } from "../../shared/schemas";
import {
  requireAuth,
  optionalAuth,
  type AuthRequest,
} from "../middleware/auth";
import { validateBody, validateQuery } from "../middleware/validate";
import { bidLimiter } from "../middleware/rateLimit";
import { placeBid } from "../services/auctionEngine";

const router = Router();

const listQuerySchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  status: z.enum(["scheduled", "active", "ended", "all"]).optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(50).optional().default(20),
});

router.get(
  "/",
  optionalAuth,
  validateQuery(listQuerySchema),
  async (req: AuthRequest, res) => {
    const { search, category, status, page, limit } = req.query as z.infer<
      typeof listQuerySchema
    >;
    const offset = (page - 1) * limit;

    const conditions = [];
    if (search) {
      conditions.push(ilike(lots.title, `%${search}%`));
    }
    if (category && category !== "Все") {
      conditions.push(eq(lots.category, category));
    }
    if (status && status !== "all") {
      conditions.push(eq(auctions.status, status));
    }

    const whereClause =
      conditions.length > 0 ? and(...conditions) : undefined;

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
      .orderBy(desc(auctions.createdAt))
      .limit(limit)
      .offset(offset);

    const items = await Promise.all(
      rows.map(async (row) => {
        const [image] = await db
          .select({ url: lotImages.url })
          .from(lotImages)
          .where(eq(lotImages.lotId, row.lotId))
          .orderBy(lotImages.sortOrder)
          .limit(1);

        const [{ count }] = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(bids)
          .where(eq(bids.auctionId, row.id));

        return {
          id: row.id,
          lotId: row.lotId,
          title: row.title,
          category: row.category,
          imageUrl: image?.url ?? null,
          startPrice: row.startPrice,
          currentPrice: row.currentPrice,
          bidStep: row.bidStep,
          bidsCount: count,
          status: row.status,
          startsAt: row.startsAt.toISOString(),
          endsAt: row.endsAt.toISOString(),
          sellerId: row.sellerId,
          sellerName: row.sellerName,
        };
      }),
    );

    res.json({ auctions: items, page, limit });
  },
);

router.get("/:id", optionalAuth, async (req: AuthRequest, res) => {
  const auctionId = req.params.id as string;
  const [row] = await db
    .select({
      id: auctions.id,
      lotId: auctions.lotId,
      title: lots.title,
      description: lots.description,
      category: lots.category,
      startPrice: auctions.startPrice,
      currentPrice: auctions.currentPrice,
      bidStep: auctions.bidStep,
      status: auctions.status,
      startsAt: auctions.startsAt,
      endsAt: auctions.endsAt,
      sellerId: lots.sellerId,
      sellerName: users.name,
      winnerId: auctions.winnerId,
    })
    .from(auctions)
    .innerJoin(lots, eq(auctions.lotId, lots.id))
    .innerJoin(users, eq(lots.sellerId, users.id))
    .where(eq(auctions.id, auctionId));

  if (!row) {
    res.status(404).json({ error: "Аукцион не найден" });
    return;
  }

  const images = await db
    .select()
    .from(lotImages)
    .where(eq(lotImages.lotId, row.lotId))
    .orderBy(lotImages.sortOrder);

  const bidRows = await db
    .select({
      id: bids.id,
      auctionId: bids.auctionId,
      userId: bids.userId,
      userName: users.name,
      amount: bids.amount,
      createdAt: bids.createdAt,
    })
    .from(bids)
    .innerJoin(users, eq(bids.userId, users.id))
    .where(eq(bids.auctionId, row.id))
    .orderBy(desc(bids.createdAt))
    .limit(50);

  res.json({
    auction: {
      id: row.id,
      lotId: row.lotId,
      title: row.title,
      description: row.description,
      category: row.category,
      imageUrl: images[0]?.url ?? null,
      startPrice: row.startPrice,
      currentPrice: row.currentPrice,
      bidStep: row.bidStep,
      bidsCount: bidRows.length,
      status: row.status,
      startsAt: row.startsAt.toISOString(),
      endsAt: row.endsAt.toISOString(),
      sellerId: row.sellerId,
      sellerName: row.sellerName,
      images: images.map((img) => ({
        id: img.id,
        url: img.url,
        sortOrder: img.sortOrder,
      })),
      bids: bidRows.map((b) => ({
        id: b.id,
        auctionId: b.auctionId,
        userId: b.userId,
        userName: b.userName,
        amount: b.amount,
        createdAt: b.createdAt.toISOString(),
      })),
      winnerId: row.winnerId,
      isWinner: Boolean(req.userId && row.winnerId && req.userId === row.winnerId),
      isSeller: Boolean(req.userId && req.userId === row.sellerId),
    },
  });
});

router.post(
  "/",
  requireAuth,
  validateBody(createAuctionSchema),
  async (req: AuthRequest, res) => {
    const { lotId, startPrice, bidStep, startsAt, endsAt } = req.body;

    if (endsAt <= startsAt) {
      res.status(400).json({ error: "Время окончания должно быть позже начала" });
      return;
    }

    const [lot] = await db
      .select()
      .from(lots)
      .where(and(eq(lots.id, lotId), eq(lots.sellerId, req.userId!)));

    if (!lot) {
      res.status(404).json({ error: "Лот не найден" });
      return;
    }

    if (lot.status !== "draft") {
      res.status(400).json({ error: "Лот уже выставлен на торги" });
      return;
    }

    const [existing] = await db
      .select({ id: auctions.id })
      .from(auctions)
      .where(eq(auctions.lotId, lotId));

    if (existing) {
      res.status(409).json({ error: "Аукцион для этого лота уже существует" });
      return;
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

    res.status(201).json({
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
    });
  },
);

router.post(
  "/:id/bids",
  requireAuth,
  bidLimiter,
  validateBody(placeBidSchema),
  async (req: AuthRequest, res) => {
    const auctionId = req.params.id as string;
    try {
      const result = await placeBid(
        auctionId,
        req.userId!,
        req.body.amount,
      );
      res.status(201).json(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Ошибка ставки";
      res.status(400).json({ error: message });
    }
  },
);

router.get(
  "/:id/seller-contact",
  requireAuth,
  async (req: AuthRequest, res) => {
    const auctionId = req.params.id as string;
    const [auction] = await db
      .select({
        status: auctions.status,
        winnerId: auctions.winnerId,
        lotId: auctions.lotId,
      })
      .from(auctions)
      .where(eq(auctions.id, auctionId));

    if (!auction) {
      res.status(404).json({ error: "Аукцион не найден" });
      return;
    }

    if (auction.status !== "ended") {
      res.status(403).json({ error: "Аукцион ещё не завершён" });
      return;
    }

    if (auction.winnerId !== req.userId) {
      res.status(403).json({ error: "Контакты доступны только победителю" });
      return;
    }

    const [lot] = await db
      .select({ sellerId: lots.sellerId })
      .from(lots)
      .where(eq(lots.id, auction.lotId));

    if (!lot) {
      res.status(404).json({ error: "Лот не найден" });
      return;
    }

    const [seller] = await db
      .select({
        name: users.name,
        email: users.email,
        phone: users.phone,
      })
      .from(users)
      .where(eq(users.id, lot.sellerId));

    if (!seller) {
      res.status(404).json({ error: "Продавец не найден" });
      return;
    }

    res.json({
      contact: {
        name: seller.name,
        email: seller.email,
        phone: seller.phone,
      },
    });
  },
);

export default router;
