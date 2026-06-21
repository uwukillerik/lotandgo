import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { toPublicUser, verifyPassword, hashPassword } from "@/lib/auth";
import { requireUserId, handleApiError } from "@/lib/auth-request";
import { updateProfileSchema } from "@shared/schemas";

export async function GET(request: NextRequest) {
  try {
    const userId = requireUserId(request);
    const [user] = await db.select().from(users).where(eq(users.id, userId));

    if (!user) {
      return Response.json({ error: "Пользователь не найден" }, { status: 404 });
    }

    return Response.json({ user: toPublicUser(user) });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const userId = requireUserId(request);
    const body = await request.json();
    const parsed = updateProfileSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: "Ошибка валидации", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const updates: Partial<{
      name: string;
      phone: string | null;
      emailNotifications: boolean;
    }> = {};
    if (parsed.data.name !== undefined) updates.name = parsed.data.name;
    if (parsed.data.phone !== undefined) updates.phone = parsed.data.phone;
    if (parsed.data.emailNotifications !== undefined) {
      updates.emailNotifications = parsed.data.emailNotifications;
    }

    if (Object.keys(updates).length === 0) {
      return Response.json({ error: "Нет данных для обновления" }, { status: 400 });
    }

    const [user] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, userId))
      .returning();

    return Response.json({ user: toPublicUser(user) });
  } catch (error) {
    return handleApiError(error);
  }
}
