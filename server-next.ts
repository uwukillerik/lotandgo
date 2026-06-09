/**
 * Legacy Next.js dev server (медленнее).
 * Запуск: npm run dev:next
 */
import "dotenv/config";
import { createServer } from "node:http";
import { parse } from "node:url";
import next from "next";
import { setupSocket } from "./lib/ws/socket";
import { startAuctionEngine } from "./lib/services/auctionEngine";

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOST ?? "0.0.0.0";
const port = parseInt(process.env.PORT ?? "8081", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error(err);
      res.statusCode = 500;
      res.end("internal server error");
    }
  });

  setupSocket(server);
  startAuctionEngine();

  server.listen(port, () => {
    console.log(`Lot&Go (Next.js) → http://localhost:${port}`);
  });
});
