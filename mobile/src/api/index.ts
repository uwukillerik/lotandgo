import { apiFetch } from "./client";
import type {
  AuthResponse,
  UserPublic,
  AuctionListItem,
  AuctionDetail,
  Lot,
  Notification,
  SellerContact,
} from "../../../shared/api";

export const authApi = {
  register: (body: {
    email: string;
    password: string;
    confirmPassword: string;
    name: string;
    phone?: string;
  }) => apiFetch<AuthResponse>("/api/auth/register", { method: "POST", body: JSON.stringify(body) }),

  login: (body: { email: string; password: string }) =>
    apiFetch<AuthResponse>("/api/auth/login", { method: "POST", body: JSON.stringify(body) }),

  me: () => apiFetch<{ user: UserPublic }>("/api/auth/me"),

  logout: () => apiFetch<{ ok: boolean }>("/api/auth/logout", { method: "POST" }),
};

export const auctionsApi = {
  list: (params?: { search?: string; category?: string; status?: string }) => {
    const q = new URLSearchParams();
    if (params?.search) q.set("search", params.search);
    if (params?.category) q.set("category", params.category);
    if (params?.status) q.set("status", params.status);
    const qs = q.toString();
    return apiFetch<{ auctions: AuctionListItem[]; page: number; limit: number }>(
      `/api/auctions${qs ? `?${qs}` : ""}`,
    );
  },

  get: (id: string) =>
    apiFetch<{ auction: AuctionDetail }>(`/api/auctions/${id}`),

  create: (body: {
    lotId: string;
    startPrice: number;
    bidStep: number;
    startsAt: string;
    endsAt: string;
  }) =>
    apiFetch("/api/auctions", { method: "POST", body: JSON.stringify(body) }),

  bid: (id: string, amount: number) =>
    apiFetch<{ bidId: string; newPrice: number }>(`/api/auctions/${id}/bids`, {
      method: "POST",
      body: JSON.stringify({ amount }),
    }),

  sellerContact: (id: string) =>
    apiFetch<{ contact: SellerContact }>(`/api/auctions/${id}/seller-contact`),
};

export const lotsApi = {
  create: (formData: FormData) =>
    apiFetch<{ lot: Lot }>("/api/lots", { method: "POST", body: formData }),

  mine: () =>
    apiFetch<{
      lots: Array<
        Lot & {
          auction: {
            id: string;
            status: string;
            startPrice: number;
            currentPrice: number;
            startsAt: string;
            endsAt: string;
            winnerId: string | null;
          } | null;
        }
      >;
    }>("/api/lots/mine"),
};

export const bidsApi = {
  mine: () =>
    apiFetch<{
      bids: Array<{
        id: string;
        auctionId: string;
        amount: number;
        createdAt: string;
        auctionTitle: string;
        auctionStatus: string;
        currentPrice: number;
        endsAt: string;
        isWinner: boolean;
      }>;
    }>("/api/bids/mine"),
};

export const notificationsApi = {
  list: () => apiFetch<{ notifications: Notification[] }>("/api/notifications"),
  markRead: (id: string) =>
    apiFetch<{ ok: boolean }>(`/api/notifications/${id}/read`, { method: "PATCH" }),
  markAllRead: () =>
    apiFetch<{ ok: boolean }>("/api/notifications/read-all", { method: "PATCH" }),
};
