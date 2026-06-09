import { NextRequest } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { notifications } from "@/lib/db/schema";
import { requireUserId, handleApiError } from "@/lib/auth-request";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(_request: NextRequest, { params }: Params) {
  try {
    const userId = requireUserId(_request);
    const { id: notifId } = await params;

    const [notif] = await db
      .select()
      .from(notifications)
      .where(
        and(eq(notifications.id, notifId), eq(notifications.userId, userId)),
      );

    if (!notif) {
      return Response.json({ error: "Уведомление не найдено" }, { status: 404 });
    }

    await db
      .update(notifications)
      .set({ read: true })
      .where(eq(notifications.id, notif.id));

    return Response.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
