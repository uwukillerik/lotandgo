import { db } from "../db";
import { notifications, users } from "../db/schema";
import { eq } from "drizzle-orm";
import { emitToUser } from "../ws/emit";
import {
  sendMail,
  isSmtpConfigured,
  buildOutbidEmailHtml,
  buildWonEmailHtml,
} from "../email";
import { sendPushToUser } from "../push";
import { SITE_URL } from "@shared/site-url";

export type NotificationType =
  | "outbid"
  | "auction_start"
  | "auction_end"
  | "won"
  | "message"
  | "deal_update";

async function maybeSendEmail(
  userId: string,
  type: NotificationType,
  message: string,
  auctionId: string,
  extra?: { auctionTitle?: string; newPrice?: number },
): Promise<void> {
  if (!isSmtpConfigured()) return;
  if (!["outbid", "won", "auction_end"].includes(type)) return;

  const [user] = await db
    .select({
      email: users.email,
      name: users.name,
      emailNotifications: users.emailNotifications,
    })
    .from(users)
    .where(eq(users.id, userId));

  if (!user?.emailNotifications) return;

  const auctionUrl = `${SITE_URL}/auction/${auctionId}`;

  try {
    if (type === "outbid" && extra?.auctionTitle && extra?.newPrice != null) {
      await sendMail({
        to: user.email,
        subject: `Ставку перебили — ${extra.auctionTitle}`,
        html: buildOutbidEmailHtml({
          userName: user.name,
          auctionTitle: extra.auctionTitle,
          newPrice: extra.newPrice,
          auctionUrl,
        }),
      });
    } else if (type === "won" && extra?.auctionTitle) {
      await sendMail({
        to: user.email,
        subject: `Вы победили — ${extra.auctionTitle}`,
        html: buildWonEmailHtml({
          userName: user.name,
          auctionTitle: extra.auctionTitle,
          auctionUrl,
        }),
      });
    }
  } catch (err) {
    console.error("Email notification failed:", err);
  }
}

export async function createNotification(
  userId: string,
  auctionId: string,
  type: NotificationType,
  message: string,
  emailExtra?: { auctionTitle?: string; newPrice?: number },
): Promise<void> {
  const [row] = await db
    .insert(notifications)
    .values({ userId, auctionId, type, message })
    .returning();

  emitToUser(userId, "notification:new", {
    notification: {
      id: row.id,
      type: row.type,
      auctionId: row.auctionId,
      message: row.message,
      read: row.read,
      createdAt: row.createdAt.toISOString(),
    },
  });

  void sendPushToUser(userId, {
    title: "Lot&Go",
    body: message,
    url: `${SITE_URL}/auction/${auctionId}`,
  });

  void maybeSendEmail(userId, type, message, auctionId, emailExtra);
}

export async function createNotifications(
  items: Array<{
    userId: string;
    auctionId: string;
    type: NotificationType;
    message: string;
    auctionTitle?: string;
  }>,
): Promise<void> {
  if (items.length === 0) return;
  const rows = await db
    .insert(notifications)
    .values(
      items.map(({ userId, auctionId, type, message }) => ({
        userId,
        auctionId,
        type,
        message,
      })),
    )
    .returning();

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const item = items[i];
    emitToUser(row.userId, "notification:new", {
      notification: {
        id: row.id,
        type: row.type,
        auctionId: row.auctionId,
        message: row.message,
        read: row.read,
        createdAt: row.createdAt.toISOString(),
      },
    });
    void sendPushToUser(row.userId, {
      title: "Lot&Go",
      body: row.message,
      url: `${SITE_URL}/auction/${row.auctionId}`,
    });
    void maybeSendEmail(row.userId, row.type as NotificationType, row.message, row.auctionId, {
      auctionTitle: item.auctionTitle,
    });
  }
}
