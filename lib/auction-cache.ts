import type { QueryClient } from "@tanstack/react-query";
import type { AuctionDetail, AuctionListItem } from "@shared/api";

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

type BidPayload = {
  auctionId: string;
  bid: AuctionDetail["bids"][number];
  currentPrice: number;
  endsAt?: string;
  leadingSince?: string;
  leadingBidderId?: string;
};

function patchListItem(item: AuctionListItem, payload: BidPayload): AuctionListItem {
  return {
    ...item,
    currentPrice: payload.currentPrice,
    ...(payload.endsAt ? { endsAt: payload.endsAt } : {}),
    ...(payload.leadingSince ? { leadingSince: payload.leadingSince } : {}),
  };
}

function patchListQueries(qc: QueryClient, payload: BidPayload): void {
  const keys = [
    ["auctions"],
    ["home-live"],
    ["home-ending"],
    ["home-featured"],
  ] as const;

  for (const key of keys) {
    qc.setQueriesData(
      { queryKey: [...key] },
      (old: AuctionListItem[] | { pages: AuctionListItem[][] } | undefined) => {
        if (!old) return old;
        if (Array.isArray(old)) {
          return old.map((item) =>
            item.id === payload.auctionId ? patchListItem(item, payload) : item,
          );
        }
        if ("pages" in old && Array.isArray(old.pages)) {
          return {
            ...old,
            pages: old.pages.map((page) =>
              page.map((item) =>
                item.id === payload.auctionId ? patchListItem(item, payload) : item,
              ),
            ),
          };
        }
        return old;
      },
    );
  }
}

export function patchAuctionListFromBid(qc: QueryClient, payload: BidPayload): void {
  patchListQueries(qc, payload);
}
