import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { verifyPassword, hashPassword } from "@/lib/auth";
import { requireUserId, handleApiError } from "@/lib/auth-request";
import { changePasswordSchema } from "@shared/schemas";

export async function POST(request: NextRequest) {
  try {
    const userId = requireUserId(request);
    const body = await request.json();
    const parsed = changePasswordSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: "Ошибка валидации", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) {
      return Response.json({ error: "Пользователь не найден" }, { status: 404 });
    }

    const valid = await verifyPassword(parsed.data.currentPassword, user.passwordHash);
    if (!valid) {
      return Response.json({ error: "Неверный текущий пароль" }, { status: 400 });
    }

    const passwordHash = await hashPassword(parsed.data.newPassword);
    await db.update(users).set({ passwordHash }).where(eq(users.id, userId));

    return Response.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
