"use client";

import Image from "next/image";
import { Users } from "lucide-react";
import { Countdown } from "@/components/countdown";
import { formatPrice } from "@/lib/utils";

const DEMO_LOT = {
  title: "Карманные часы Patek Philippe 1920 года",
  category: "Антиквариат",
  currentPrice: 127_000,
  bidsCount: 8,
  endsAt: new Date(Date.now() + 2 * 60 * 60 * 1000 + 14 * 60 * 1000).toISOString(),
  imageUrl: "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=560&q=85",
};

export function HeroLotPreview() {
  return (
    <div className="relative mx-auto w-full max-w-sm">
      <div
        aria-hidden
        className="absolute -inset-3 rounded-[2rem] bg-gradient-to-br from-amber-200/40 via-transparent to-orange-200/30 blur-2xl"
      />

      <div className="relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-[0_20px_50px_-12px_rgba(15,23,42,0.18)] ring-1 ring-slate-900/[0.04]">
        <div className="relative h-48 overflow-hidden sm:h-52">
          <Image
            src={DEMO_LOT.imageUrl}
            alt=""
            fill
            priority
            sizes="(max-width:1024px) 90vw, 400px"
            className="object-cover"
            draggable={false}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/30 via-transparent to-transparent" />
          <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-lg shadow-emerald-500/30">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
            Live
          </span>
        </div>

        <div className="p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-amber-600">
            {DEMO_LOT.category}
          </p>
          <p className="mt-1 line-clamp-2 text-base font-bold leading-snug text-slate-900">
            {DEMO_LOT.title}
          </p>
          <div className="mt-3 flex items-end justify-between gap-3">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">Текущая цена</p>
              <p className="price-tag text-2xl">{formatPrice(DEMO_LOT.currentPrice)}</p>
            </div>
            <div className="rounded-xl bg-amber-50 px-3 py-2 text-center ring-1 ring-amber-100">
              <p className="text-[9px] font-semibold uppercase tracking-wide text-amber-600">До конца</p>
              <Countdown
                endsAt={DEMO_LOT.endsAt}
                className="text-sm font-bold text-slate-800"
                urgentClassName="text-sm font-bold text-rose-500 animate-pulse"
              />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1 border-t border-slate-100 pt-3 text-xs text-slate-400">
            <Users className="h-3.5 w-3.5" />
            {DEMO_LOT.bidsCount} ставок
          </div>
        </div>
      </div>
    </div>
  );
}
