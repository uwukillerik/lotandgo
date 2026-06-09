import type { QueryClient } from "@tanstack/react-query";
import type { AuctionDetail } from "@shared/api";

function normalizeAuction(
  old: AuctionDetail | { auction: AuctionDetail } | undefined,
): AuctionDetail | undefined {
  if (!old) return undefined;
  if ("auction" in old && old.auction) return old.auction;
  return old as AuctionDetail;
}

export function patchAuctionCache(
  qc: QueryClient,
  auctionId: string,
  patch: Partial<AuctionDetail> | ((current: AuctionDetail) => AuctionDetail),
): void {
  qc.setQueryData(["auction", auctionId], (old: AuctionDetail | { auction: AuctionDetail } | undefined) => {
    const current = normalizeAuction(old);
    if (!current) return old;
    return typeof patch === "function" ? patch(current) : { ...current, ...patch };
  });
}
