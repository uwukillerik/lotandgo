import type { LotCategory } from "./categories";
import type { AuctionType } from "./auction-types";

export type UserRole = "user" | "admin";

export interface UserPublic {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: UserRole;
  avatarUrl: string | null;
  paymentVerified: boolean;
  emailNotifications: boolean;
  createdAt: string;
}

export interface AuthResponse {
  user: UserPublic;
  accessToken: string;
  refreshToken: string;
}

export interface LotImage {
  id: string;
  url: string;
  sortOrder: number;
}

export interface Lot {
  id: string;
  sellerId: string;
  title: string;
  description: string;
  category: LotCategory;
  status: "draft" | "active" | "ended" | "sold";
  images: LotImage[];
  createdAt: string;
}

export interface Bid {
  id: string;
  auctionId: string;
  userId: string;
  userName: string;
  amount: number;
  createdAt: string;
}

export type PromotionTier = "boost" | "featured" | "premium";

export interface LotPromotionInfo {
  tier: PromotionTier;
  expiresAt: string;
}

export interface AuctionListItem {
  id: string;
  lotId: string;
  title: string;
  category: LotCategory;
  imageUrl: string | null;
  imageCount?: number;
  startPrice: number;
  currentPrice: number;
  bidStep: number;
  bidsCount: number;
  status: "scheduled" | "active" | "ended";
  startsAt: string;
  endsAt: string;
  auctionType?: AuctionType;
  holdDurationSeconds?: number;
  leadingSince?: string | null;
  sellerId: string;
  sellerName: string;
  promotion?: LotPromotionInfo | null;
}

export type DealStatus =
  | "none"
  | "awaiting_payment"
  | "paid"
  | "shipped"
  | "completed";

export interface AuctionDetail extends AuctionListItem {
  description: string;
  images: LotImage[];
  bids: Bid[];
  winnerId: string | null;
  winnerName?: string | null;
  dealStatus: DealStatus;
  isWinner: boolean;
  isSeller: boolean;
  canChat: boolean;
  sellerAvatarUrl?: string | null;
  sellerEndedLots?: number;
  sellerRating?: number;
  sellerReviewCount?: number;
}

export interface Notification {
  id: string;
  type: "outbid" | "auction_start" | "auction_end" | "won" | "message" | "deal_update";
  auctionId: string;
  auctionTitle: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface SellerContact {
  name: string;
  email: string;
  phone: string | null;
}

export interface ApiError {
  error: string;
  details?: unknown;
}
