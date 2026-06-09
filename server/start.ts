import "dotenv/config";
import http from "node:http";
import { createApp } from "./index";
import { setupSocket } from "./ws/socket";
import { startAuctionEngine } from "./services/auctionEngine";

const app = createApp();
const httpServer = http.createServer(app);
setupSocket(httpServer);
startAuctionEngine();

const port = Number(process.env.PORT) || 3000;

httpServer.listen(port, () => {
  console.log(`Lot&Go API running on http://localhost:${port}`);
  console.log(`WebSocket: ws://localhost:${port}/ws`);
});

process.on("SIGTERM", () => {
  httpServer.close();
  process.exit(0);
});

process.on("SIGINT", () => {
  httpServer.close();
  process.exit(0);
});

export { httpServer, app };
