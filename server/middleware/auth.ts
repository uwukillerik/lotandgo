import type { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../lib/auth";

export interface AuthRequest extends Request {
  userId?: string;
}

export function requireAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): void {
  const header = req.headers.authorization;
  const cookieToken = (req as Request & { cookies?: { accessToken?: string } })
    .cookies?.accessToken;
  const token = header?.startsWith("Bearer ")
    ? header.slice(7)
    : cookieToken;

  if (!token) {
    res.status(401).json({ error: "Требуется авторизация" });
    return;
  }

  try {
    req.userId = verifyAccessToken(token);
    next();
  } catch {
    res.status(401).json({ error: "Недействительный токен" });
  }
}

export function optionalAuth(
  req: AuthRequest,
  _res: Response,
  next: NextFunction,
): void {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;
  if (token) {
    try {
      req.userId = verifyAccessToken(token);
    } catch {
      // ignore invalid token for optional auth
    }
  }
  next();
}
