import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  toPublicUser,
} from "@/lib/auth";
import { setAuthCookies } from "@/lib/cookies";
import { handleApiError } from "@/lib/auth-request";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const refreshToken =
      body.refreshToken ?? request.cookies.get("refreshToken")?.value;

    if (!refreshToken) {
      return Response.json({ error: "Refresh token required" }, { status: 401 });
    }

    const userId = verifyRefreshToken(refreshToken);
    const [user] = await db.select().from(users).where(eq(users.id, userId));

    if (!user) {
      return Response.json({ error: "User not found" }, { status: 401 });
    }

    const accessToken = signAccessToken(user.id);
    const newRefreshToken = signRefreshToken(user.id);

    const response = NextResponse.json({
      user: toPublicUser(user),
      accessToken,
      refreshToken: newRefreshToken,
    });
    return setAuthCookies(response, accessToken, newRefreshToken);
  } catch {
    return Response.json({ error: "Invalid refresh token" }, { status: 401 });
  }
}
