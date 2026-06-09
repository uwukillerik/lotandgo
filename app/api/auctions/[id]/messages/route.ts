import { NextRequest } from "next/server";
import { eq, asc } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { auctionMessages, users } from "@/lib/db/schema";
import { requireUserId, handleApiError } from "@/lib/auth-request";
import { getChatAccess } from "@/lib/chat-access";
import { createNotification } from "@/lib/services/notificationService";
import { emitToAuction } from "@/lib/ws/emit";

type Params = { params: Promise<{ id: string }> };

const postSchema = z.object({
  body: z.string().trim().min(1).max(2000),
});

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id: auctionId } = await params;
    const userId = requireUserId(request);
    const access = await getChatAccess(auctionId, userId);
    if (!access) {
      return Response.json({ error: "Чат недоступен" }, { status: 403 });
    }

    const rows = await db
      .select({
        id: auctionMessages.id,
        auctionId: auctionMessages.auctionId,
        senderId: auctionMessages.senderId,
        senderName: users.name,
        body: auctionMessages.body,
        createdAt: auctionMessages.createdAt,
      })
      .from(auctionMessages)
      .innerJoin(users, eq(auctionMessages.senderId, users.id))
      .where(eq(auctionMessages.auctionId, auctionId))
      .orderBy(asc(auctionMessages.createdAt))
      .limit(200);

    return Response.json({
      messages: rows.map((m) => ({
        id: m.id,
        auctionId: m.auctionId,
        senderId: m.senderId,
        senderName: m.senderName,
        body: m.body,
        createdAt: m.createdAt.toISOString(),
        isMine: m.senderId === userId,
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { id: auctionId } = await params;
    const userId = requireUserId(request);
    const access = await getChatAccess(auctionId, userId);
    if (!access) {
      return Response.json({ error: "Чат недоступен" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = postSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: "Сообщение от 1 до 2000 символов" }, { status: 400 });
    }

    const [sender] = await db
      .select({ name: users.name })
      .from(users)
      .where(eq(users.id, userId));

    const [msg] = await db
      .insert(auctionMessages)
      .values({
        auctionId,
        senderId: userId,
        body: parsed.data.body,
      })
      .returning();

    const message = {
      id: msg.id,
      auctionId: msg.auctionId,
      senderId: msg.senderId,
      senderName: sender?.name ?? "Участник",
      body: msg.body,
      createdAt: msg.createdAt.toISOString(),
    };

    const notifyUserId =
      userId === access.sellerId ? access.winnerId : access.sellerId;

    if (notifyUserId !== userId) {
      await createNotification(
        notifyUserId,
        auctionId,
        "message",
        `${sender?.name ?? "Участник"}: ${parsed.data.body.slice(0, 80)}${parsed.data.body.length > 80 ? "…" : ""}`,
      );
    }

    emitToAuction(auctionId, "message:new", { auctionId, message });

    return Response.json({ message });
  } catch (error) {
    return handleApiError(error);
  }
}
