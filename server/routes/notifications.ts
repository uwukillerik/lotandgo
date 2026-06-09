import { Router } from "express";
import { eq, desc, and } from "drizzle-orm";
import { db } from "../db";
import { notifications, auctions, lots } from "../db/schema";
import { requireAuth, type AuthRequest } from "../middleware/auth";

const router = Router();

router.get("/", requireAuth, async (req: AuthRequest, res) => {
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
    .where(eq(notifications.userId, req.userId!))
    .orderBy(desc(notifications.createdAt))
    .limit(100);

  res.json({
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
});

router.patch("/:id/read", requireAuth, async (req: AuthRequest, res) => {
  const notifId = req.params.id as string;
  const [notif] = await db
    .select()
    .from(notifications)
    .where(
      and(
        eq(notifications.id, notifId),
        eq(notifications.userId, req.userId!),
      ),
    );

  if (!notif) {
    res.status(404).json({ error: "Уведомление не найдено" });
    return;
  }

  await db
    .update(notifications)
    .set({ read: true })
    .where(eq(notifications.id, notif.id));

  res.json({ ok: true });
});

router.patch("/read-all", requireAuth, async (req: AuthRequest, res) => {
  await db
    .update(notifications)
    .set({ read: true })
    .where(eq(notifications.userId, req.userId!));

  res.json({ ok: true });
});

export default router;
