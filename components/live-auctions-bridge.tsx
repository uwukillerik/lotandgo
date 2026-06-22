"use client";

import { useLiveAuctionsSocket } from "@/hooks/use-live-auctions-socket";

export function LiveAuctionsBridge() {
  useLiveAuctionsSocket();
  return null;
}
