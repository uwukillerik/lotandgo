import "dotenv/config";
import { createServer } from "node:http";
import path from "node:path";
import fs from "node:fs";
import express from "express";
import { createServer as createViteServer } from "vite";
import { setupSocket } from "./lib/ws/socket";
import { startAuctionEngine } from "./lib/services/auctionEngine";
import { registerApiRoutes } from "./lib/register-api-routes";
import { registerPublicRoutes } from "./lib/public-routes";
import { freePorts } from "./lib/kill-port";

const dev = process.env.NODE_ENV !== "production";
const port = parseInt(process.env.PORT ?? "8081", 10);
const host = process.env.HOST ?? "0.0.0.0";
const VITE_HMR_PORT = 24678;

async function start() {
  await freePorts(dev ? [port, VITE_HMR_PORT] : [port]);

  const app = express();
  registerApiRoutes(app);
  registerPublicRoutes(app);

  if (dev) {
    const vite = await createViteServer({
      configFile: path.resolve(import.meta.dirname, "vite.config.ts"),
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const dist = path.resolve(import.meta.dirname, "dist/spa");

    app.use(express.static(dist, { index: false }));

    app.use((req, res, next) => {
      if (req.path.startsWith("/api") || req.path.startsWith("/uploads")) {
        return next();
      }
      if (req.method !== "GET" && req.method !== "HEAD") {
        return next();
      }
      const assetPath = path.join(dist, req.path);
      if (req.path !== "/" && fs.existsSync(assetPath) && fs.statSync(assetPath).isFile()) {
        return res.sendFile(assetPath);
      }
      if (!path.extname(req.path)) {
        return res.sendFile(path.join(dist, "index.html"));
      }
      return res.status(404).end();
    });
  }

  const httpServer = createServer(app);
  setupSocket(httpServer);
  startAuctionEngine();

  httpServer.on("error", (err: NodeJS.ErrnoException) => {
    if (err.code === "EADDRINUSE") {
      console.error(`Порт ${port} занят. Перезапустите: npm run dev`);
    } else {
      console.error(err);
    }
    process.exit(1);
  });

  httpServer.listen(port, host, () => {
    console.log(`Lot&Go (Node + Vite) → http://localhost:${port}`);
    console.log(`WebSocket: ws://localhost:${port}/ws`);
  });
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
