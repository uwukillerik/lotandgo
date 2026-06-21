import { eq, and } from "drizzle-orm";
import { db } from "../db";
import { categorySubscriptions, users } from "../db/schema";
import { createNotification } from "./notificationService";
import { sendMail, isSmtpConfigured } from "../email";
import { sendPushToUser } from "../push";
import { SITE_URL } from "@shared/site-url";

export async function notifyCategorySubscribers(params: {
  category: string;
  auctionId: string;
  title: string;
}): Promise<void> {
  const subs = await db
    .select({
      userId: categorySubscriptions.userId,
      emailNotify: categorySubscriptions.emailNotify,
      pushNotify: categorySubscriptions.pushNotify,
      email: users.email,
      name: users.name,
      emailNotifications: users.emailNotifications,
    })
    .from(categorySubscriptions)
    .innerJoin(users, eq(categorySubscriptions.userId, users.id))
    .where(eq(categorySubscriptions.category, params.category));

  if (subs.length === 0) return;

  const url = `${SITE_URL}/auction/${params.auctionId}`;
  const message = `Новый лот в «${params.category}»: «${params.title}»`;

  for (const sub of subs) {
    await createNotification(sub.userId, params.auctionId, "auction_start", message, {
      auctionTitle: params.title,
    });

    if (sub.emailNotify && sub.emailNotifications && isSmtpConfigured()) {
      try {
        await sendMail({
          to: sub.email,
          subject: `Новый лот — ${params.category}`,
          html: `<p>${sub.name}, в категории «${params.category}» появился лот «${params.title}».</p><p><a href="${url}">Открыть лот</a></p>`,
        });
      } catch (err) {
        console.error("Category email failed:", err);
      }
    }

    if (sub.pushNotify) {
      void sendPushToUser(sub.userId, {
        title: `Новый лот: ${params.category}`,
        body: params.title,
        url,
      });
    }
  }
}

export async function listUserCategorySubscriptions(userId: string) {
  return db
    .select({
      category: categorySubscriptions.category,
      emailNotify: categorySubscriptions.emailNotify,
      pushNotify: categorySubscriptions.pushNotify,
    })
    .from(categorySubscriptions)
    .where(eq(categorySubscriptions.userId, userId));
}

export async function toggleCategorySubscription(
  userId: string,
  category: string,
  enabled: boolean,
) {
  if (!enabled) {
    await db
      .delete(categorySubscriptions)
      .where(
        and(
          eq(categorySubscriptions.userId, userId),
          eq(categorySubscriptions.category, category),
        ),
      );
    return { subscribed: false };
  }

  await db
    .insert(categorySubscriptions)
    .values({ userId, category, emailNotify: true, pushNotify: true })
    .onConflictDoUpdate({
      target: [categorySubscriptions.userId, categorySubscriptions.category],
      set: { emailNotify: true, pushNotify: true },
    });

  return { subscribed: true };
}
