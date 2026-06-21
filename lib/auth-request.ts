import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { verifyAccessToken } from "./auth";
import { db } from "./db";
import { users } from "./db/schema";

export function getUserId(request: NextRequest): string | null {
  const header = request.headers.get("authorization");
  const cookieToken = request.cookies.get("accessToken")?.value;
  const token = header?.startsWith("Bearer ")
    ? header.slice(7)
    : cookieToken;

  if (!token) return null;

  try {
    return verifyAccessToken(token);
  } catch {
    return null;
  }
}

export function requireUserId(request: NextRequest): string {
  const userId = getUserId(request);
  if (!userId) {
    throw new AuthError("Требуется авторизация", 401);
  }
  return userId;
}

export async function requireAdmin(request: NextRequest): Promise<string> {
  const userId = requireUserId(request);
  const [user] = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, userId));

  if (!user || user.role !== "admin") {
    throw new AuthError("Доступ только для администратора", 403);
  }
  return userId;
}

export class AuthError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "AuthError";
  }
}

export function handleApiError(error: unknown): Response {
  if (error instanceof AuthError) {
    return Response.json({ error: error.message }, { status: error.status });
  }
  if (error instanceof Error) {
    if (error.message.includes("Допустимы только")) {
      return Response.json({ error: error.message }, { status: 400 });
    }
    if (
      error.message.includes("SMTP не настроен") ||
      error.message.includes("Invalid login") ||
      error.message.includes("ECONNREFUSED") ||
      error.message.includes("ETIMEDOUT") ||
      error.message.includes("ESOCKET") ||
      error.message.includes("certificate")
    ) {
      return Response.json({ error: error.message }, { status: 502 });
    }
    return Response.json({ error: error.message }, { status: 500 });
  }
  return Response.json({ error: "Внутренняя ошибка сервера" }, { status: 500 });
}
