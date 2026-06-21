import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { registerSchema } from "@shared/schemas";
import {
  hashPassword,
  signAccessToken,
  signRefreshToken,
  toPublicUser,
} from "@/lib/auth";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { jsonWithAuth } from "@/lib/cookies";
import { handleApiError } from "@/lib/auth-request";
import { sendMail, buildWelcomeEmailHtml, isSmtpConfigured } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for") ?? "anonymous";
    if (!checkRateLimit(`auth:${ip}`, 5, 60_000)) {
      return rateLimitResponse("Слишком много попыток. Попробуйте через минуту.");
    }

    const body = await request.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: "Ошибка валидации", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { email, password, name, phone } = parsed.data;

    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email.toLowerCase()));

    if (existing.length > 0) {
      return Response.json({ error: "Email уже зарегистрирован" }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    const now = new Date();
    const [user] = await db
      .insert(users)
      .values({
        email: email.toLowerCase(),
        passwordHash,
        name,
        phone: phone ?? null,
        termsAcceptedAt: now,
        privacyAcceptedAt: now,
      })
      .returning();

    const accessToken = signAccessToken(user.id);
    const refreshToken = signRefreshToken(user.id);

    if (isSmtpConfigured()) {
      void sendMail({
        to: user.email,
        subject: "Добро пожаловать в Lot&Go",
        html: buildWelcomeEmailHtml({ userName: user.name }),
      }).catch((err) => console.error("Welcome email failed:", err));
    }

    return jsonWithAuth(
      { user: toPublicUser(user), accessToken, refreshToken },
      accessToken,
      refreshToken,
      201,
    );
  } catch (error) {
    return handleApiError(error);
  }
}
