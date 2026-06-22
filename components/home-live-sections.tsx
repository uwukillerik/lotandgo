"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Layers, Clock, Gavel, Users, ArrowRight, Radio } from "lucide-react";
import { AuctionCard } from "@/components/auction-card";
import { AuctionImage } from "@/components/auction-image";
import { AuctionCardSkeleton } from "@/components/skeleton";
import { AuctionCountdown } from "@/components/countdown";
import { HeroLotPreview } from "@/components/hero-lot-preview";
import { getAuthHeaders } from "@/components/auth-provider";
import { formatPrice } from "@/lib/utils";
import type { AuctionListItem } from "@shared/api";
import { LOT_CATEGORIES } from "@shared/categories";

async function fetchAuctions(params: Record<string, string>) {
  const q = new URLSearchParams(params);
  const res = await fetch(`/api/auctions?${q}`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error("Ошибка загрузки");
  return (await res.json()).auctions as AuctionListItem[];
}

export function HomePublicStats() {
  const { data } = useQuery({
    queryKey: ["public-stats"],
    queryFn: async () => {
      const res = await fetch("/api/stats/public");
      if (!res.ok) throw new Error("stats");
      return (await res.json()).stats as {
        activeAuctions: number;
        totalLots: number;
        totalUsers: number;
        totalBids: number;
      };
    },
    staleTime: 60_000,
  });

  const items = [
    { icon: Layers, value: data ? String(data.totalLots) : "—", label: "лотов в каталоге" },
    { icon: Clock, value: data ? String(data.activeAuctions) : "—", label: "live сейчас" },
    { icon: Gavel, value: data ? String(data.totalBids) : "—", label: "ставок всего" },
    { icon: Users, value: data ? String(data.totalUsers) : "—", label: "участников" },
  ];

  return (
    <section className="home-stats-bar">
      <div className="home-stats-grid">
          {items.map(({ icon: Icon, value, label }) => (
            <div key={label} className="home-stat-item">
              <span className="icon-ring !rounded-xl !p-2">
                <Icon className="h-4 w-4" strokeWidth={2} />
              </span>
              <div className="min-w-0">
                <p className="text-lg font-extrabold tabular-nums text-slate-900 sm:text-xl">{value}</p>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 sm:text-xs">
                  {label}
                </p>
              </div>
            </div>
          ))}
      </div>
    </section>
  );
}

export function HomeLiveAuctions() {
  const { data: live = [], isLoading } = useQuery({
    queryKey: ["home-live"],
    queryFn: () => fetchAuctions({ status: "active", limit: "8", sort: "bids_desc" }),
    refetchInterval: 15_000,
  });

  const { data: ending = [] } = useQuery({
    queryKey: ["home-ending"],
    queryFn: () => fetchAuctions({ status: "active", limit: "6", sort: "ending_soon" }),
    refetchInterval: 15_000,
  });

  if (!isLoading && live.length === 0 && ending.length === 0) {
    return (
      <section className="py-12 sm:py-16">
        <div className="page-shell !py-0">
          <div className="surface-card flex flex-col items-center border-dashed py-14 text-center">
            <Gavel className="mb-3 h-10 w-10 text-amber-400" />
            <h2 className="display-heading text-xl">Скоро здесь появятся live-торги</h2>
            <p className="mt-2 max-w-md text-sm text-slate-500">
              Выставьте первый лот или загляните в каталог — аукционы обновляются в реальном времени.
            </p>
            <Link href="/catalog" className="btn-primary mt-5 inline-flex">
              Открыть каталог
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="py-12 sm:py-16">
        <div className="page-shell !py-0">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="section-eyebrow">Сейчас в торгах</p>
              <h2 className="display-heading mt-1 text-2xl sm:text-3xl">Live-аукционы</h2>
            </div>
            <Link href="/catalog" className="text-sm font-bold text-amber-600 hover:text-amber-700">
              Все лоты →
            </Link>
          </div>
          {isLoading ? (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="w-[min(280px,70vw)] shrink-0">
                  <AuctionCardSkeleton />
                </div>
              ))}
            </div>
          ) : live.length > 0 ? (
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
              {live.map((a) => (
                <div key={a.id} className="w-[min(280px,70vw)] shrink-0">
                  <AuctionCard auction={a} />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">Сейчас нет активных торгов — загляните позже</p>
          )}
        </div>
      </section>

      {ending.length > 0 && (
        <section className="pb-12 sm:pb-16">
          <div className="page-shell !py-0">
            <div className="mb-6">
              <p className="section-eyebrow">Заканчиваются скоро</p>
              <h2 className="display-heading mt-1 text-2xl sm:text-3xl">Успейте сделать ставку</h2>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 sm:gap-4">
              {ending.map((a) => (
                <AuctionCard key={`end-${a.id}`} auction={a} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}

export function HomeCategoryChips() {
  const cats = ["Все", ...LOT_CATEGORIES.slice(0, 5)];
  return (
    <div className="flex flex-wrap gap-2">
      {cats.map((cat) => (
        <Link
          key={cat}
          href={cat === "Все" ? "/catalog" : `/catalog?category=${encodeURIComponent(cat)}`}
          className="rounded-full border border-slate-200/80 bg-white/70 px-3.5 py-1.5 text-xs font-medium text-slate-600 shadow-sm backdrop-blur transition hover:border-amber-200 hover:bg-amber-50/50 hover:text-amber-800"
        >
          {cat}
        </Link>
      ))}
    </div>
  );
}

export function HomeHeroFeatured() {
  const { data: lot, isLoading } = useQuery({
    queryKey: ["home-featured"],
    queryFn: async () => {
      let items = await fetchAuctions({ status: "active", limit: "1", sort: "bids_desc" });
      if (!items.length) {
        items = await fetchAuctions({ status: "active", limit: "1", sort: "ending_soon" });
      }
      if (!items.length) {
        items = await fetchAuctions({ limit: "1", sort: "newest" });
      }
      return items[0] ?? null;
    },
    staleTime: 30_000,
  });

  if (isLoading) {
    return (
      <div className="relative mx-auto w-full max-w-md">
        <div className="hero-showcase-glow" aria-hidden />
        <div className="hero-showcase-card animate-pulse">
          <div className="h-52 bg-slate-100" />
          <div className="space-y-3 p-5">
            <div className="h-3 w-24 rounded bg-slate-100" />
            <div className="h-6 w-full rounded bg-slate-100" />
            <div className="h-8 w-32 rounded bg-slate-100" />
          </div>
        </div>
      </div>
    );
  }

  if (!lot) {
    return (
      <div className="relative mx-auto w-full max-w-md">
        <HeroLotPreview />
      </div>
    );
  }

  const isLive = lot.status === "active";

  return (
    <div className="relative mx-auto w-full max-w-md">
      <div className="hero-showcase-glow" aria-hidden />
      <Link href={`/auction/${lot.id}`} className="hero-showcase-card block transition hover:-translate-y-1">
        <div className="relative h-48 overflow-hidden sm:h-56">
          {lot.imageUrl ? (
            <AuctionImage
              src={lot.imageUrl}
              alt={lot.title}
              fill
              priority
              sizes="(max-width:1024px) 90vw, 420px"
              className="object-cover transition duration-700 hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-slate-100 to-amber-50">
              <Gavel className="h-14 w-14 text-slate-300" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 via-transparent to-transparent" />
          <div className="absolute left-3 top-3 flex flex-col gap-1.5">
            {isLive ? (
              <span className="inline-flex w-fit items-center gap-1.5 rounded-lg bg-emerald-500 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-lg">
                <span className="live-pulse" />
                Live
              </span>
            ) : (
              <span className="rounded-lg bg-slate-800/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white backdrop-blur">
                {lot.status === "scheduled" ? "Скоро" : "Аукцион"}
              </span>
            )}
            <span className="w-fit rounded-lg bg-amber-500 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-900">
              {isLive ? "Горячий лот" : "Пример лота"}
            </span>
          </div>
        </div>

        <div className="p-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-amber-600">
            {lot.category}
          </p>
          <p className="mt-1 line-clamp-2 text-lg font-bold leading-snug text-slate-900">
            {lot.title}
          </p>
          <div className="mt-4 flex items-end justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                Текущая цена
              </p>
              <p className="price-tag text-2xl">{formatPrice(lot.currentPrice)}</p>
              <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                <Radio className="h-3 w-3 text-emerald-500" />
                {lot.bidsCount} ставок
              </p>
            </div>
            {isLive && (
              <div className="rounded-xl bg-amber-50 px-3 py-2 text-right ring-1 ring-amber-100">
                <AuctionCountdown
                  auction={lot}
                  className="text-sm font-bold text-slate-800"
                  urgentClassName="text-sm font-bold text-rose-500 animate-pulse"
                  prefixClassName="text-[9px]"
                />
              </div>
            )}
          </div>
          <p className="mt-4 flex items-center justify-center gap-1.5 text-sm font-bold text-amber-700">
            Смотреть торги
            <ArrowRight className="h-4 w-4" />
          </p>
        </div>
      </Link>
    </div>
  );
}
