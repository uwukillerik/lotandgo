"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import {
  formatCountdown,
  getAuctionCountdownPrefix,
  getAuctionCountdownTarget,
  type AuctionCountdownInput,
} from "@shared/auction-helpers";

export function useCountdown(endsAt: string) {
  const [seconds, setSeconds] = useState(() => getRemaining(endsAt));

  useEffect(() => {
    setSeconds(getRemaining(endsAt));
    const t = setInterval(() => setSeconds(getRemaining(endsAt)), 1000);
    return () => clearInterval(t);
  }, [endsAt]);

  return seconds;
}

function getRemaining(endsAt: string): number {
  return Math.max(0, Math.floor((new Date(endsAt).getTime() - Date.now()) / 1000));
}

export { formatCountdown, getAuctionCountdownTarget, getAuctionCountdownPrefix };

export function Countdown({
  endsAt,
  className,
  urgentClassName,
  full = false,
  endedLabel = "Завершён",
}: {
  endsAt: string;
  className?: string;
  urgentClassName?: string;
  full?: boolean;
  endedLabel?: string;
}) {
  const remaining = useCountdown(endsAt);
  const urgent = remaining > 0 && remaining < 300;

  return (
    <span
      className={cn(
        "tabular-nums font-semibold",
        urgent ? (urgentClassName ?? "text-rose-500") : className,
      )}
    >
      {remaining <= 0 ? endedLabel : formatCountdown(remaining, full)}
    </span>
  );
}

export function AuctionCountdown({
  auction,
  className,
  urgentClassName,
  prefixClassName,
  showPrefix = true,
  full = true,
}: {
  auction: AuctionCountdownInput;
  className?: string;
  urgentClassName?: string;
  prefixClassName?: string;
  showPrefix?: boolean;
  full?: boolean;
}) {
  const target = getAuctionCountdownTarget(auction);
  const prefix = getAuctionCountdownPrefix(auction);
  const remaining = useCountdown(target);
  const urgent = remaining > 0 && remaining < 300;

  if (auction.status === "ended") {
    return (
      <span className={cn("text-sm font-semibold text-slate-500", className)}>
        Завершён
      </span>
    );
  }

  return (
    <span className="inline-flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
      {showPrefix && (
        <span className={cn("text-[11px] font-semibold uppercase tracking-wide text-slate-500", prefixClassName)}>
          {prefix}
        </span>
      )}
      <span
        className={cn(
          "tabular-nums font-bold",
          urgent ? (urgentClassName ?? "text-rose-500") : className,
        )}
      >
        {remaining <= 0 ? "сейчас" : formatCountdown(remaining, full)}
      </span>
    </span>
  );
}
