"use client";

import { useEffect } from "react";
import { io, type Socket } from "socket.io-client";
import { useQueryClient } from "@tanstack/react-query";
import { patchAuctionListFromBid } from "@/lib/auction-cache";

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

/** Глобальные обновления каталога и списков при ставках на любых лотах. */
export function useLiveAuctionsSocket() {
  const qc = useQueryClient();

  useEffect(() => {
    const socket = getSocket();
    socket.auth = { token: getToken() ?? "" };
    if (!socket.connected) socket.connect();

    const onBid = (payload: Parameters<typeof patchAuctionListFromBid>[1]) => {
      patchAuctionListFromBid(qc, payload);
    };

    const onEnded = (payload: { auctionId: string }) => {
      qc.invalidateQueries({ queryKey: ["auction", payload.auctionId] });
      qc.invalidateQueries({ queryKey: ["auctions"] });
      qc.invalidateQueries({ queryKey: ["home-live"] });
      qc.invalidateQueries({ queryKey: ["home-ending"] });
    };

    const onStarted = (payload: { auctionId: string }) => {
      qc.invalidateQueries({ queryKey: ["auction", payload.auctionId] });
      qc.invalidateQueries({ queryKey: ["auctions"] });
      qc.invalidateQueries({ queryKey: ["home-live"] });
    };

    socket.on("bid:new", onBid);
    socket.on("auction:ended", onEnded);
    socket.on("auction:started", onStarted);

    return () => {
      socket.off("bid:new", onBid);
      socket.off("auction:ended", onEnded);
      socket.off("auction:started", onStarted);
    };
  }, [qc]);
}
