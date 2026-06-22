export type AuctionType = "fixed" | "anti_snipe" | "soft_close";

export const AUCTION_TYPE_OPTIONS: {
  value: AuctionType;
  label: string;
  description: string;
  defaultHoldSeconds?: number;
}[] = [
  {
    value: "fixed",
    label: "Фиксированное время",
    description: "Торги завершаются ровно в указанный момент, без продления.",
  },
  {
    value: "anti_snipe",
    label: "С продлением (anti-snipe)",
    description:
      "Ставка в последние 2 минуты продлевает аукцион ещё на 2 минуты — защита от снайперских ставок.",
  },
  {
    value: "soft_close",
    label: "Лидер должен удержаться",
    description:
      "После минимального времени торги завершаются, когда текущий лидер удерживает лидерство заданное время без перебития.",
    defaultHoldSeconds: 3600,
  },
];

export function auctionTypeLabel(type: AuctionType | string | undefined): string {
  const found = AUCTION_TYPE_OPTIONS.find((o) => o.value === type);
  return found?.label ?? "Аукцион";
}

export function auctionTypeShortLabel(type: AuctionType | string | undefined): string {
  const map: Record<AuctionType, string> = {
    fixed: "Фикс.",
    anti_snipe: "Anti-snipe",
    soft_close: "Удержание",
  };
  return map[type as AuctionType] ?? "Аукцион";
}

export function durationToSeconds(hours: number, minutes: number, seconds: number): number {
  return Math.max(0, hours) * 3600 + Math.max(0, minutes) * 60 + Math.max(0, seconds);
}

export function parseDurationParts(totalSeconds: number): {
  hours: number;
  minutes: number;
  seconds: number;
} {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;
  return { hours, minutes, seconds };
}

export function formatDurationParts(hours: number, minutes: number, seconds: number): string {
  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours} ч`);
  if (minutes > 0) parts.push(`${minutes} мин`);
  if (seconds > 0 || parts.length === 0) parts.push(`${seconds} сек`);
  return parts.join(" ");
}
