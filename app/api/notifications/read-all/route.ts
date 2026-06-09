import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { notifications } from "@/lib/db/schema";
import { requireUserId, handleApiError } from "@/lib/auth-request";

export async function PATCH(request: NextRequest) {
  try {
    const userId = requireUserId(request);
    await db
      .update(notifications)
      .set({ read: true })
      .where(eq(notifications.userId, userId));

    return Response.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
