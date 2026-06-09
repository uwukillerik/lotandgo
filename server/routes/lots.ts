import { Router } from "express";
import { eq, desc } from "drizzle-orm";
import { db } from "../db";
import { lots, lotImages, auctions } from "../db/schema";
import { createLotSchema } from "../../shared/schemas";
import { requireAuth, type AuthRequest } from "../middleware/auth";
import { upload, getUploadUrl } from "../middleware/upload";
import type { Lot } from "../../shared/api";

const router = Router();

router.post(
  "/",
  requireAuth,
  upload.array("images", 5),
  async (req: AuthRequest, res) => {
    const parsed = createLotSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: "Ошибка валидации",
        details: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const files = req.files as Express.Multer.File[] | undefined;
    if (!files || files.length === 0) {
      res.status(400).json({ error: "Загрузите хотя бы одно фото" });
      return;
    }

    const { title, description, category } = parsed.data;

    const [lot] = await db
      .insert(lots)
      .values({
        sellerId: req.userId!,
        title,
        description,
        category,
        status: "draft",
      })
      .returning();

    const imageRows = await db
      .insert(lotImages)
      .values(
        files.map((file, index) => ({
          lotId: lot.id,
          url: getUploadUrl(file.filename),
          sortOrder: index,
        })),
      )
      .returning();

    const result: Lot = {
      id: lot.id,
      sellerId: lot.sellerId,
      title: lot.title,
      description: lot.description,
      category: lot.category as Lot["category"],
      status: lot.status,
      images: imageRows.map((img) => ({
        id: img.id,
        url: img.url,
        sortOrder: img.sortOrder,
      })),
      createdAt: lot.createdAt.toISOString(),
    };

    res.status(201).json({ lot: result });
  },
);

router.get("/mine", requireAuth, async (req: AuthRequest, res) => {
  const userLots = await db
    .select()
    .from(lots)
    .where(eq(lots.sellerId, req.userId!))
    .orderBy(desc(lots.createdAt));

  const result = await Promise.all(
    userLots.map(async (lot) => {
      const images = await db
        .select()
        .from(lotImages)
        .where(eq(lotImages.lotId, lot.id))
        .orderBy(lotImages.sortOrder);

      const [auction] = await db
        .select()
        .from(auctions)
        .where(eq(auctions.lotId, lot.id));

      return {
        id: lot.id,
        sellerId: lot.sellerId,
        title: lot.title,
        description: lot.description,
        category: lot.category,
        status: lot.status,
        images: images.map((img) => ({
          id: img.id,
          url: img.url,
          sortOrder: img.sortOrder,
        })),
        createdAt: lot.createdAt.toISOString(),
        auction: auction
          ? {
              id: auction.id,
              status: auction.status,
              startPrice: auction.startPrice,
              currentPrice: auction.currentPrice,
              startsAt: auction.startsAt.toISOString(),
              endsAt: auction.endsAt.toISOString(),
              winnerId: auction.winnerId,
            }
          : null,
      };
    }),
  );

  res.json({ lots: result });
});

router.get("/:id", requireAuth, async (req: AuthRequest, res) => {
  const lotId = req.params.id as string;
  const [lot] = await db
    .select()
    .from(lots)
    .where(eq(lots.id, lotId));

  if (!lot) {
    res.status(404).json({ error: "Лот не найден" });
    return;
  }

  const images = await db
    .select()
    .from(lotImages)
    .where(eq(lotImages.lotId, lot.id))
    .orderBy(lotImages.sortOrder);

  res.json({
    lot: {
      id: lot.id,
      sellerId: lot.sellerId,
      title: lot.title,
      description: lot.description,
      category: lot.category,
      status: lot.status,
      images: images.map((img) => ({
        id: img.id,
        url: img.url,
        sortOrder: img.sortOrder,
      })),
      createdAt: lot.createdAt.toISOString(),
    },
  });
});

export default router;
