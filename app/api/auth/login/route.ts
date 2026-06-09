import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { loginSchema } from "@shared/schemas";
import {
  verifyPassword,
  signAccessToken,
  signRefreshToken,
  toPublicUser,
} from "@/lib/auth";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { jsonWithAuth } from "@/lib/cookies";
import { handleApiError } from "@/lib/auth-request";

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for") ?? "anonymous";
    if (!checkRateLimit(`auth:${ip}`, 5, 60_000)) {
      return rateLimitResponse("Слишком много попыток. Попробуйте через минуту.");
    }

    const body = await request.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: "Ошибка валидации", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { email, password } = parsed.data;

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()));

    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return Response.json({ error: "Неверный email или пароль" }, { status: 401 });
    }

    const accessToken = signAccessToken(user.id);
    const refreshToken = signRefreshToken(user.id);

    return jsonWithAuth(
      { user: toPublicUser(user), accessToken, refreshToken },
      accessToken,
      refreshToken,
    );
  } catch (error) {
    return handleApiError(error);
  }
}
