import type { Request, Response } from "express";
import { NextRequest } from "next/server";

type RouteContext = { params: Promise<Record<string, string>> };

type NextHandler = (
  request: NextRequest,
  context?: RouteContext,
) => Promise<Response>;

export function fullUrl(req: Request): string {
  const proto = req.headers["x-forwarded-proto"] ?? "http";
  const host = req.headers.host ?? "localhost";
  return `${proto}://${host}${req.originalUrl}`;
}

export async function forwardResponse(res: Response, nextRes: Response) {
  res.status(nextRes.status);
  nextRes.headers.forEach((value, key) => {
    if (key.toLowerCase() === "transfer-encoding") return;
    res.setHeader(key, value);
  });
  const buf = Buffer.from(await nextRes.arrayBuffer());
  res.send(buf);
}

export function wrapJson(handler: NextHandler, params?: Record<string, string>) {
  return async (req: Request, res: Response) => {
    try {
      const init: RequestInit = {
        method: req.method,
        headers: req.headers as HeadersInit,
      };
      if (req.method !== "GET" && req.method !== "HEAD" && req.body !== undefined) {
        init.body = JSON.stringify(req.body);
        (init.headers as Record<string, string>)["content-type"] ??= "application/json";
      }
      const nextReq = new NextRequest(fullUrl(req), init);
      const ctx = params ?? req.params;
      const nextRes = await handler(nextReq, { params: Promise.resolve(ctx) });
      await forwardResponse(res, nextRes);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Внутренняя ошибка сервера" });
    }
  };
}

export function wrapStream(handler: NextHandler, params?: Record<string, string>) {
  return async (req: Request, res: Response) => {
    try {
      const nextReq = new NextRequest(fullUrl(req), {
        method: req.method,
        headers: req.headers as HeadersInit,
        body: req,
        duplex: "half",
      } as RequestInit);
      const ctx = params ?? req.params;
      const nextRes = await handler(nextReq, { params: Promise.resolve(ctx) });
      await forwardResponse(res, nextRes);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Внутренняя ошибка сервера" });
    }
  };
}

/** JSON (уже разобран express.json) или multipart stream */
export function wrapJsonOrStream(handler: NextHandler, params?: Record<string, string>) {
  return async (req: Request, res: Response) => {
    const contentType = String(req.headers["content-type"] ?? "");
    if (contentType.includes("multipart/form-data")) {
      return wrapStream(handler, params)(req, res);
    }
    return wrapJson(handler, params)(req, res);
  };
}
