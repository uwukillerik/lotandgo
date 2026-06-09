import type { Server as HttpServer } from "node:http";
import { Server as SocketServer } from "socket.io";
import { verifyAccessToken } from "../auth";
import { setAuctionEngineIo } from "../services/auctionEngine";
import { setSocketIo } from "./emit";

export function setupSocket(httpServer: HttpServer): SocketServer {
  const corsOrigin = process.env.CORS_ORIGIN?.split(",") ?? [
    "http://localhost:8081",
    "http://localhost:19006",
  ];

  const io = new SocketServer(httpServer, {
    cors: {
      origin: corsOrigin,
      credentials: true,
    },
    path: "/ws",
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth.token as string | undefined;
    if (!token) {
      socket.data.userId = null;
      next();
      return;
    }
    try {
      socket.data.userId = verifyAccessToken(token);
      next();
    } catch {
      socket.data.userId = null;
      next();
    }
  });

  io.on("connection", (socket) => {
    socket.on("join:auction", (auctionId: string) => {
      socket.join(`auction:${auctionId}`);
    });

    socket.on("leave:auction", (auctionId: string) => {
      socket.leave(`auction:${auctionId}`);
    });
  });

  setAuctionEngineIo(io);
  setSocketIo(io);
  return io;
}
