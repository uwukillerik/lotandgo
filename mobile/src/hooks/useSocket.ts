import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { WS_URL } from "../config";
import { getAccessToken } from "../api/client";

let socket: Socket | null = null;

export function useSocket() {
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    let active = true;

    async function connect() {
      const token = await getAccessToken();
      if (!token || !active) return;

      socket?.disconnect();
      socket = io(WS_URL, {
        path: "/ws",
        auth: { token },
        transports: ["websocket"],
      });

      socket.on("connect", () => setConnected(true));
      socket.on("disconnect", () => setConnected(false));
    }

    connect();

    return () => {
      active = false;
      socket?.disconnect();
      socket = null;
      setConnected(false);
    };
  }, []);

  return { socket, connected };
}

export function getSocket(): Socket | null {
  return socket;
}

export function joinAuction(auctionId: string) {
  socket?.emit("join:auction", auctionId);
}

export function leaveAuction(auctionId: string) {
  socket?.emit("leave:auction", auctionId);
}
