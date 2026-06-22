import type { AuctionType } from "./auction-types";

/** Победитель только после завершения торгов. */
export function isAuctionWinner(
  auctionStatus: string,
  isWinner: boolean,
): boolean {
  return auctionStatus === "ended" && isWinner;
}

export function formatLotNumber(id: string): string {
  return id.replace(/-/g, "").slice(0, 8).toUpperCase();
}

export function auctionStatusLabel(status: string): string {
  const map: Record<string, string> = {
    active: "Live",
    scheduled: "Скоро",
    ended: "Завершён",
    ended_no_sale: "Не продан",
  };
  return map[status] ?? status;
}

const ANTI_SNIPE_THRESHOLD_MS = 2 * 60 * 1000;
const ANTI_SNIPE_EXTENSION_MS = 2 * 60 * 1000;

/** Нужно ли продлить аукцион (anti-snipe). */
export function shouldExtendAuction(
  endsAt: Date,
  now = new Date(),
  auctionType: AuctionType | string = "anti_snipe",
): boolean {
  if (auctionType !== "anti_snipe") return false;
  const remaining = endsAt.getTime() - now.getTime();
  return remaining > 0 && remaining < ANTI_SNIPE_THRESHOLD_MS;
}

export function extendedEndsAt(endsAt: Date): Date {
  return new Date(endsAt.getTime() + ANTI_SNIPE_EXTENSION_MS);
}

export type AuctionCountdownInput = {
  status: "scheduled" | "active" | "ended" | string;
  startsAt: string;
  endsAt: string;
  auctionType?: AuctionType | string;
  holdDurationSeconds?: number;
  leadingSince?: string | null;
};

/** ISO-время, до которого считаем обратный отсчёт. */
export function getAuctionCountdownTarget(auction: AuctionCountdownInput): string {
  if (auction.status === "scheduled") return auction.startsAt;

  const now = Date.now();
  const endsAtMs = new Date(auction.endsAt).getTime();

  if (
    auction.auctionType === "soft_close" &&
    auction.status === "active" &&
    now >= endsAtMs &&
    auction.leadingSince
  ) {
    const holdMs = (auction.holdDurationSeconds ?? 3600) * 1000;
    return new Date(new Date(auction.leadingSince).getTime() + holdMs).toISOString();
  }

  return auction.endsAt;
}

export function getAuctionCountdownPrefix(auction: AuctionCountdownInput): string {
  if (auction.status === "scheduled") return "Начнётся через";
  if (auction.status === "ended") return "Завершён";

  const now = Date.now();
  const endsAtMs = new Date(auction.endsAt).getTime();

  if (auction.auctionType === "soft_close" && now >= endsAtMs) {
    return "Лидер удерживает";
  }

  return "Осталось";
}

export function formatCountdown(seconds: number, full = false): string {
  if (seconds <= 0) return "00:00:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (full || h > 0) {
    return `${h}ч ${String(m).padStart(2, "0")}м ${String(s).padStart(2, "0")}с`;
  }
  if (m > 0) return `${m}м ${String(s).padStart(2, "0")}с`;
  return `${s}с`;
}

export function formatEndsIn(seconds: number): string {
  if (seconds <= 0) return "завершается";
  return `через ${formatCountdown(seconds, true)}`;
}
