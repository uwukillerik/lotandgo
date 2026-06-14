import Link from "next/link";
import Image from "next/image";
import { ChevronRight } from "lucide-react";
import type { AuctionListItem } from "@shared/api";
import { PromotionBadge } from "./promotion-badge";
import { PriceDisplay } from "./price-display";

export function PromotedShowcase({ auctions }: { auctions: AuctionListItem[] }) {
  const featured = auctions.filter(
    (a) => a.promotion?.tier === "premium" || a.promotion?.tier === "featured",
  );
  if (featured.length === 0) return null;

  return (
    <section className="mb-6">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="section-eyebrow">Рекомендуем</p>
          <h2 className="text-lg font-extrabold text-slate-900">Продвинутые лоты</h2>
        </div>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
        {featured.slice(0, 6).map((a) => (
          <Link
            key={a.id}
            href={`/auction/${a.id}`}
            className={`group relative w-[min(280px,78vw)] shrink-0 overflow-hidden rounded-2xl border bg-white transition hover:-translate-y-0.5 ${
              a.promotion?.tier === "premium"
                ? "promo-card-premium border-violet-300/80"
                : "promo-card-featured border-amber-300/80"
            }`}
          >
            <div className="relative h-36 bg-slate-100">
              {a.imageUrl ? (
                <Image src={a.imageUrl} alt="" fill className="object-cover" sizes="280px" />
              ) : null}
              {a.promotion && (
                <div className="absolute left-2.5 top-2.5">
                  <PromotionBadge tier={a.promotion.tier} />
                </div>
              )}
              {a.imageCount && a.imageCount > 1 && (
                <span className="absolute bottom-2 right-2 rounded-md bg-black/50 px-1.5 py-0.5 text-[10px] font-bold text-white">
                  {a.imageCount} фото
                </span>
              )}
            </div>
            <div className="p-3.5">
              <p className="text-[10px] font-bold uppercase tracking-wide text-amber-600">{a.category}</p>
              <p className="mt-0.5 line-clamp-2 text-sm font-bold text-slate-900">{a.title}</p>
              <div className="mt-2 flex items-center justify-between">
                <PriceDisplay value={a.currentPrice} className="text-base font-bold text-slate-900" amountClassName="text-base font-bold" />
                <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-amber-600 opacity-0 transition group-hover:opacity-100">
                  Открыть
                  <ChevronRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
