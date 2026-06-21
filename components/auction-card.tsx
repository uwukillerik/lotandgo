"use client";

import Link from "next/link";
import { AuctionImage } from "@/components/auction-image";
import { PriceDisplay } from "@/components/price-display";
import { FavoriteButton } from "@/components/favorite-button";
import { Gavel, Images } from "lucide-react";
import type { AuctionListItem } from "@shared/api";
import { Countdown } from "./countdown";
import { cn } from "@/lib/utils";
import { PromotionBadge, promotionCardClass } from "./promotion-badge";

const statusMap = {
  active: { label: "Live", className: "bg-emerald-500/95 text-white shadow-emerald-500/30" },
  scheduled: { label: "Скоро", className: "bg-slate-700/90 text-white" },
  ended: { label: "Конец", className: "bg-slate-400/90 text-white" },
};

export function AuctionCard({ auction }: { auction: AuctionListItem }) {
  const status = statusMap[auction.status];
  const img = auction.imageUrl;
  const tier = auction.promotion?.tier;
  const isPremium = tier === "premium";

  return (
    <Link
      href={`/auction/${auction.id}`}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-[0_4px_20px_-6px_rgba(15,23,42,0.08)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_16px_40px_-10px_rgba(15,23,42,0.14)] active:scale-[0.99]",
        promotionCardClass(tier),
        isPremium && "sm:col-span-2 lg:row-span-1",
      )}
    >
      <div className={cn("relative overflow-hidden bg-slate-100", isPremium ? "h-44 sm:h-48" : "h-36 sm:h-40")}>
        {img ? (
          <AuctionImage
            src={img}
            alt={auction.title}
            fill
            sizes="(max-width:640px) 50vw, (max-width:1024px) 33vw, 25vw"
            className="transition duration-700 group-hover:scale-110"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-slate-100 to-slate-50">
            <Gavel className="h-9 w-9 text-slate-300" strokeWidth={1.5} />
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/20 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />

        <div className="absolute left-2.5 top-2.5 flex flex-col gap-1.5">
          <span
            className={cn(
              "inline-flex w-fit items-center gap-1 rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide shadow-sm",
              status.className,
            )}
          >
            {auction.status === "active" && (
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
            )}
            {status.label}
          </span>
          {tier && <PromotionBadge tier={tier} />}
        </div>

        <div className="absolute right-2 top-2 z-10">
          <FavoriteButton auctionId={auction.id} size="sm" />
        </div>

        {auction.imageCount && auction.imageCount > 1 && (
          <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-md bg-black/55 px-1.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
            <Images className="h-3 w-3" />
            {auction.imageCount}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-3.5 sm:p-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-amber-600">
          {auction.category}
        </p>
        <h3
          className={cn(
            "mt-1 line-clamp-2 font-bold leading-snug text-slate-900 transition-colors group-hover:text-amber-900",
            isPremium ? "text-base" : "text-sm",
          )}
        >
          {auction.title}
        </h3>

        <div className="mt-auto pt-3">
          <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">Ставка</p>
          <PriceDisplay
            value={auction.currentPrice}
            amountClassName={cn(isPremium ? "text-lg sm:text-xl" : "text-base sm:text-lg")}
          />
          <div className="mt-2 space-y-1.5">
            <div className="w-fit rounded-lg bg-slate-50 px-2 py-1 ring-1 ring-slate-100">
              <Countdown
                endsAt={auction.endsAt}
                className="text-[11px] font-semibold text-slate-600"
                urgentClassName="text-[11px] font-bold text-rose-500"
              />
            </div>
            <p className="text-xs text-slate-500">
              {auction.bidsCount}{" "}
              {auction.bidsCount === 1
                ? "ставка"
                : auction.bidsCount >= 2 && auction.bidsCount <= 4
                  ? "ставки"
                  : "ставок"}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}
