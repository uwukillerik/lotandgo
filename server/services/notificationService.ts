import { db } from "../db";
import { notifications } from "../db/schema";

export type NotificationType =
  | "outbid"
  | "auction_start"
  | "auction_end"
  | "won";

export async function createNotification(
  userId: string,
  auctionId: string,
  type: NotificationType,
  message: string,
): Promise<void> {
  await db.insert(notifications).values({
    userId,
    auctionId,
    type,
    message,
  });
}

export async function createNotifications(
  items: Array<{
    userId: string;
    auctionId: string;
    type: NotificationType;
    message: string;
  }>,
): Promise<void> {
  if (items.length === 0) return;
  await db.insert(notifications).values(items);
}
