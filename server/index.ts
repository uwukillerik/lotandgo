import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import path from "node:path";
import fs from "node:fs";
import authRoutes from "./routes/auth";
import lotsRoutes from "./routes/lots";
import auctionsRoutes from "./routes/auctions";
import bidsRoutes from "./routes/bids";
import notificationsRoutes from "./routes/notifications";
import { generalLimiter } from "./middleware/rateLimit";
import { uploadDir } from "./middleware/upload";

export function createApp() {
  const app = express();

  const corsOrigins = process.env.CORS_ORIGIN?.split(",").map((o) =>
    o.trim(),
  ) ?? ["http://localhost:8081", "http://localhost:8080", "http://localhost:19006"];

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
    }),
  );
  app.use(
    cors({
      origin: corsOrigins,
      credentials: true,
    }),
  );
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(generalLimiter);

  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  app.use("/uploads", express.static(path.resolve(uploadDir)));

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", service: "Lot&Go API" });
  });

  app.get("/api/ping", (_req, res) => {
    res.json({ message: process.env.PING_MESSAGE ?? "pong" });
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/lots", lotsRoutes);
  app.use("/api/auctions", auctionsRoutes);
  app.use("/api/bids", bidsRoutes);
  app.use("/api/notifications", notificationsRoutes);

  app.use(
    (
      err: Error,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction,
    ) => {
      console.error(err);
      if (err.message.includes("Допустимы только")) {
        res.status(400).json({ error: err.message });
        return;
      }
      res.status(500).json({ error: "Внутренняя ошибка сервера" });
    },
  );

  return app;
}

// Backwards compatibility for vite plugin
export function createServer() {
  return createApp();
}
