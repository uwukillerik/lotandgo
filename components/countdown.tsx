"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function useCountdown(endsAt: string) {
  const [seconds, setSeconds] = useState(() => getRemaining(endsAt));

  useEffect(() => {
    const t = setInterval(() => setSeconds(getRemaining(endsAt)), 1000);
    return () => clearInterval(t);
  }, [endsAt]);

  return seconds;
}

function getRemaining(endsAt: string): number {
  return Math.max(0, Math.floor((new Date(endsAt).getTime() - Date.now()) / 1000));
}

export function formatCountdown(seconds: number): string {
  if (seconds <= 0) return "Завершён";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}ч ${String(m).padStart(2, "0")}м`;
  if (m > 0) return `${m}м ${String(s).padStart(2, "0")}с`;
  return `${s}с`;
}

export function Countdown({
  endsAt,
  className,
  urgentClassName,
}: {
  endsAt: string;
  className?: string;
  urgentClassName?: string;
}) {
  const remaining = useCountdown(endsAt);
  const urgent = remaining > 0 && remaining < 300;

  return (
    <span
      className={cn(
        "tabular-nums font-semibold",
        urgent ? urgentClassName ?? "text-rose-500" : className,
      )}
    >
      {formatCountdown(remaining)}
    </span>
  );
}
