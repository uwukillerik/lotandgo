"use client";

import { useEffect } from "react";
import { io, type Socket } from "socket.io-client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { AuctionDetail, Bid } from "@shared/api";
import { upsertChatMessage } from "@/lib/chat-cache";
import { patchAuctionCache } from "@/lib/auction-cache";

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

export function useAuctionSocket(auctionId: string | undefined, userId?: string | null) {
  const qc = useQueryClient();

  useEffect(() => {
    if (!auctionId) return;

    const socket = getSocket();
    socket.auth = { token: getToken() ?? "" };
    if (!socket.connected) socket.connect();

    socket.emit("join:auction", auctionId);

    const onBid = (payload: {
      auctionId: string;
      bid: Bid;
      currentPrice: number;
    }) => {
      if (payload.auctionId !== auctionId) return;

      patchAuctionCache(qc, auctionId, (current) => {
        const prevBids = current.bids ?? [];
        const exists = prevBids.some((b) => b.id === payload.bid.id);
        const bids = exists ? prevBids : [payload.bid, ...prevBids].slice(0, 50);
        return {
          ...current,
          currentPrice: payload.currentPrice,
          bidsCount: exists ? current.bidsCount : current.bidsCount + 1,
          bids,
        };
      });

      qc.invalidateQueries({ queryKey: ["auctions"] });

      if (payload.bid.userId !== userId) {
        toast.info(`Новая ставка: ${payload.bid.amount.toLocaleString("ru-RU")} ₽`, {
          description: payload.bid.userName,
        });
      }
    };

    const onEnded = (payload: { auctionId: string }) => {
      if (payload.auctionId !== auctionId) return;
      qc.invalidateQueries({ queryKey: ["auction", auctionId] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
      toast.message("Аукцион завершён");
    };

    const onStarted = (payload: { auctionId: string }) => {
      if (payload.auctionId !== auctionId) return;
      qc.invalidateQueries({ queryKey: ["auction", auctionId] });
      toast.success("Торги начались!");
    };

    const onMessage = (payload: {
      auctionId: string;
      message: Parameters<typeof upsertChatMessage>[2];
    }) => {
      if (payload.auctionId !== auctionId) return;
      upsertChatMessage(qc, auctionId, payload.message, userId);
      qc.invalidateQueries({ queryKey: ["message-conversations"] });
      if (payload.message.senderId !== userId) {
        toast.message("Новое сообщение", { description: payload.message.body.slice(0, 60) });
      }
      qc.invalidateQueries({ queryKey: ["notifications"] });
    };

    const onDeal = (payload: { auctionId: string; dealStatus: string }) => {
      if (payload.auctionId !== auctionId) return;
      patchAuctionCache(qc, auctionId, {
        dealStatus: payload.dealStatus as AuctionDetail["dealStatus"],
      });
    };

    socket.on("bid:new", onBid);
    socket.on("auction:ended", onEnded);
    socket.on("auction:started", onStarted);
    socket.on("message:new", onMessage);
    socket.on("deal:updated", onDeal);

    return () => {
      socket.emit("leave:auction", auctionId);
      socket.off("bid:new", onBid);
      socket.off("auction:ended", onEnded);
      socket.off("auction:started", onStarted);
      socket.off("message:new", onMessage);
      socket.off("deal:updated", onDeal);
    };
  }, [auctionId, userId, qc]);
}
