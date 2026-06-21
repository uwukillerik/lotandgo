import type { Server as SocketServer } from "socket.io";

let io: SocketServer | null = null;

export function setSocketIo(socketIo: SocketServer): void {
  io = socketIo;
}

export function emitToAuction(auctionId: string, event: string, payload: unknown): void {
  io?.to(`auction:${auctionId}`).emit(event, payload);
}

export function emitToUser(userId: string, event: string, payload: unknown): void {
  io?.to(`user:${userId}`).emit(event, payload);
}
