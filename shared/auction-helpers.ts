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

/** Нужно ли продлить аукцион (anti-snipe). */
export function shouldExtendAuction(endsAt: Date, now = new Date()): boolean {
  const remaining = endsAt.getTime() - now.getTime();
  return remaining > 0 && remaining < 2 * 60 * 1000;
}

export function extendedEndsAt(endsAt: Date): Date {
  return new Date(endsAt.getTime() + 2 * 60 * 1000);
}
