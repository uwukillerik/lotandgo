import { Router } from "express";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { users } from "../db/schema";
import { registerSchema, loginSchema } from "../../shared/schemas";
import {
  hashPassword,
  verifyPassword,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  toPublicUser,
} from "../lib/auth";
import { validateBody } from "../middleware/validate";
import { requireAuth, type AuthRequest } from "../middleware/auth";
import { authLimiter } from "../middleware/rateLimit";

const router = Router();

router.post(
  "/register",
  authLimiter,
  validateBody(registerSchema),
  async (req, res) => {
    const { email, password, name, phone } = req.body;

    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email.toLowerCase()));

    if (existing.length > 0) {
      res.status(409).json({ error: "Email уже зарегистрирован" });
      return;
    }

    const passwordHash = await hashPassword(password);
    const [user] = await db
      .insert(users)
      .values({
        email: email.toLowerCase(),
        passwordHash,
        name,
        phone: phone ?? null,
      })
      .returning();

    const accessToken = signAccessToken(user.id);
    const refreshToken = signRefreshToken(user.id);

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 15 * 60 * 1000,
    });
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      user: toPublicUser(user),
      accessToken,
      refreshToken,
    });
  },
);

router.post(
  "/login",
  authLimiter,
  validateBody(loginSchema),
  async (req, res) => {
    const { email, password } = req.body;

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()));

    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      res.status(401).json({ error: "Неверный email или пароль" });
      return;
    }

    const accessToken = signAccessToken(user.id);
    const refreshToken = signRefreshToken(user.id);

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 15 * 60 * 1000,
    });
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      user: toPublicUser(user),
      accessToken,
      refreshToken,
    });
  },
);

router.post("/refresh", async (req, res) => {
  const refreshToken =
    req.body.refreshToken ??
    (req as typeof req & { cookies?: { refreshToken?: string } }).cookies
      ?.refreshToken;

  if (!refreshToken) {
    res.status(401).json({ error: "Refresh token required" });
    return;
  }

  try {
    const userId = verifyRefreshToken(refreshToken);
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId));

    if (!user) {
      res.status(401).json({ error: "User not found" });
      return;
    }

    const accessToken = signAccessToken(user.id);
    const newRefreshToken = signRefreshToken(user.id);

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 15 * 60 * 1000,
    });

    res.json({
      user: toPublicUser(user),
      accessToken,
      refreshToken: newRefreshToken,
    });
  } catch {
    res.status(401).json({ error: "Invalid refresh token" });
  }
});

router.get("/me", requireAuth, async (req: AuthRequest, res) => {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, req.userId!));

  if (!user) {
    res.status(404).json({ error: "Пользователь не найден" });
    return;
  }

  res.json({ user: toPublicUser(user) });
});

router.post("/logout", (_req, res) => {
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");
  res.json({ ok: true });
});

export default router;
