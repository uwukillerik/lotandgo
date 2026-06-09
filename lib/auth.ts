import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import type { UserPublic } from "@shared/api";
import type { users } from "./db/schema";

type UserRow = typeof users.$inferSelect;

const ACCESS_EXPIRES = "15m";
const REFRESH_EXPIRES = "7d";

function getSecrets() {
  const accessSecret = process.env.JWT_SECRET;
  const refreshSecret = process.env.JWT_REFRESH_SECRET;
  if (!accessSecret || !refreshSecret) {
    throw new Error("JWT_SECRET and JWT_REFRESH_SECRET must be set");
  }
  return { accessSecret, refreshSecret };
}

export function toPublicUser(user: UserRow): UserPublic {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    phone: user.phone,
    role: user.role,
    avatarUrl: user.avatarUrl ?? null,
    paymentVerified: user.paymentVerifiedAt != null,
    createdAt: user.createdAt.toISOString(),
  };
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signAccessToken(userId: string): string {
  const { accessSecret } = getSecrets();
  return jwt.sign({ sub: userId, type: "access" }, accessSecret, {
    expiresIn: ACCESS_EXPIRES,
  });
}

export function signRefreshToken(userId: string): string {
  const { refreshSecret } = getSecrets();
  return jwt.sign({ sub: userId, type: "refresh" }, refreshSecret, {
    expiresIn: REFRESH_EXPIRES,
  });
}

export function verifyAccessToken(token: string): string {
  const { accessSecret } = getSecrets();
  const payload = jwt.verify(token, accessSecret) as jwt.JwtPayload;
  if (payload.type !== "access" || !payload.sub) {
    throw new Error("Invalid token");
  }
  return payload.sub as string;
}

export function verifyRefreshToken(token: string): string {
  const { refreshSecret } = getSecrets();
  const payload = jwt.verify(token, refreshSecret) as jwt.JwtPayload;
  if (payload.type !== "refresh" || !payload.sub) {
    throw new Error("Invalid token");
  }
  return payload.sub as string;
}
