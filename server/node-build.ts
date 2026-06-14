import path from "node:path";
import http from "node:http";
import { createApp } from "./index";
import { setupSocket } from "./ws/socket";
import { startAuctionEngine } from "./services/auctionEngine";
import express from "express";

const app = createApp();
const httpServer = http.createServer(app);
setupSocket(httpServer);
startAuctionEngine();

const port = process.env.PORT || 3000;

const __dirname = import.meta.dirname;
const distPath = path.join(__dirname, "../spa");

app.use(express.static(distPath));

app.use((req, res) => {
  if (req.path.startsWith("/api/") || req.path.startsWith("/uploads")) {
    return res.status(404).json({ error: "API endpoint not found" });
  }
  res.sendFile(path.join(distPath, "index.html"));
});

httpServer.listen(port, () => {
  console.log(`Lot&Go server running on port ${port}`);
});

process.on("SIGTERM", () => {
  httpServer.close();
  process.exit(0);
});

process.on("SIGINT", () => {
  httpServer.close();
  process.exit(0);
});
