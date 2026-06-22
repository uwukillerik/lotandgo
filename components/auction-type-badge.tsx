"use client";

import { cn } from "@/lib/utils";
import { auctionTypeShortLabel, type AuctionType } from "@shared/auction-types";
import { Clock, Shield, Timer } from "lucide-react";

const typeStyles: Record<
  AuctionType,
  { className: string; icon: typeof Clock }
> = {
  fixed: {
    className: "bg-slate-100 text-slate-700 ring-slate-200",
    icon: Clock,
  },
  anti_snipe: {
    className: "bg-sky-50 text-sky-800 ring-sky-200",
    icon: Shield,
  },
  soft_close: {
    className: "bg-violet-50 text-violet-800 ring-violet-200",
    icon: Timer,
  },
};

export function AuctionTypeBadge({
  type = "anti_snipe",
  className,
}: {
  type?: AuctionType | string;
  className?: string;
}) {
  const key = (type as AuctionType) in typeStyles ? (type as AuctionType) : "anti_snipe";
  const { className: style, icon: Icon } = typeStyles[key];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold ring-1",
        style,
        className,
      )}
      title={auctionTypeShortLabel(key)}
    >
      <Icon className="h-3 w-3 shrink-0" strokeWidth={2.25} />
      {auctionTypeShortLabel(key)}
    </span>
  );
}
