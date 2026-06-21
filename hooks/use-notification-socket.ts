"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { io, type Socket } from "socket.io-client";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("lotgo_token");
}

let sharedSocket: Socket | null = null;

function getSocket(): Socket {
  if (!sharedSocket) {
    sharedSocket = io({
      path: "/ws",
      auth: { token: getToken() ?? "" },
      transports: ["websocket", "polling"],
      autoConnect: false,
    });
  }
  return sharedSocket;
}

export function useNotificationSocket(userId: string | undefined) {
  const qc = useQueryClient();

  useEffect(() => {
    if (!userId) return;
    const socket = getSocket();
    socket.auth = { token: getToken() ?? "" };
    if (!socket.connected) socket.connect();

    const onNew = () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
    };

    socket.on("notification:new", onNew);
    return () => {
      socket.off("notification:new", onNew);
    };
  }, [userId, qc]);
}
