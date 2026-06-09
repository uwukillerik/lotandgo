import type { Server as HttpServer } from "node:http";
import { Server as SocketServer } from "socket.io";
import { verifyAccessToken } from "../lib/auth";
import { setAuctionEngineIo } from "../services/auctionEngine";

export function setupSocket(httpServer: HttpServer): SocketServer {
  const corsOrigin = process.env.CORS_ORIGIN?.split(",") ?? [
    "http://localhost:8081",
    "http://localhost:8080",
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
      next(new Error("Authentication required"));
      return;
    }
    try {
      socket.data.userId = verifyAccessToken(token);
      next();
    } catch {
      next(new Error("Invalid token"));
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
  return io;
}
