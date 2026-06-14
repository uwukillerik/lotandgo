"use client";

import { useDeferredValue, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { SlidersHorizontal, Flame } from "lucide-react";
import { InnerHeader, HeaderSellButton } from "@/components/site-header";
import { CatalogFiltersPanel } from "@/components/catalog-filters";
import { AuctionCard } from "@/components/auction-card";
import { PromotedShowcase } from "@/components/promoted-showcase";
import { AuctionCardSkeleton } from "@/components/skeleton";
import { getAuthHeaders } from "@/components/auth-provider";
import {
  DEFAULT_CATALOG_FILTERS,
  type CatalogFilters,
} from "@shared/catalog-filters";
import type { AuctionListItem } from "@shared/api";
import { cn } from "@/lib/utils";

async function fetchAuctions(filters: CatalogFilters) {
  const params = new URLSearchParams({ status: filters.status, limit: "50", sort: filters.sort });
  if (filters.search) params.set("search", filters.search);
  if (filters.category !== "Все") params.set("category", filters.category);
  if (filters.minPrice) params.set("minPrice", filters.minPrice);
  if (filters.maxPrice) params.set("maxPrice", filters.maxPrice);
  const res = await fetch(`/api/auctions?${params}`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error("Ошибка загрузки");
  return (await res.json()).auctions as AuctionListItem[];
}

export default function CatalogPage() {
  const [filters, setFilters] = useState<CatalogFilters>(DEFAULT_CATALOG_FILTERS);
  const deferredFilters = useDeferredValue(filters);

  const { data: auctions = [], isLoading, isFetching, error } = useQuery({
    queryKey: ["auctions", deferredFilters],
    queryFn: () => fetchAuctions(deferredFilters),
    placeholderData: (prev) => prev,
  });

  const showSkeleton = isLoading && auctions.length === 0;
  const liveCount = auctions.filter((a) => a.status === "active").length;

  return (
    <div className="page-bg min-h-screen">
      <InnerHeader
        backHref="/"
        backLabel="Главная"
        title="Аукционы"
        right={<HeaderSellButton />}
      />

      <main className="page-shell">
        <div className="catalog-hero mb-6">
          <div className="absolute right-0 top-0 h-32 w-32 bg-[radial-gradient(circle,rgba(251,191,36,0.12),transparent_70%)]" />
          <div className="relative flex items-start gap-3">
            <span className="icon-ring shrink-0">
              <Flame className="h-5 w-5" strokeWidth={2} />
            </span>
            <div>
              <p className="section-eyebrow">Торговый зал</p>
              <h2 className="display-heading mt-1 text-xl sm:text-2xl">Каталог аукционов</h2>
              <p className="mt-1.5 text-sm text-slate-500">
                {isFetching && !isLoading
                  ? "Обновляем…"
                  : liveCount > 0
                    ? `${auctions.length} лотов · ${liveCount} с активными торгами`
                    : `${auctions.length} лотов`}
              </p>
            </div>
          </div>
        </div>

        <CatalogFiltersPanel filters={filters} onChange={setFilters} />

        {!error && auctions.length > 0 && <PromotedShowcase auctions={auctions} />}

        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-10 text-center">
            <p className="font-semibold text-rose-800">Не удалось загрузить</p>
            <p className="mt-1 text-sm text-rose-600">Проверьте подключение к базе данных</p>
          </div>
        )}

        {!error && showSkeleton && (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <AuctionCardSkeleton key={i} />
            ))}
          </div>
        )}

        {!error && !showSkeleton && auctions.length === 0 && (
          <div className="surface-card flex flex-col items-center border-dashed py-16 text-center">
            <SlidersHorizontal className="mb-3 h-10 w-10 text-slate-300" />
            <p className="font-semibold text-slate-700">Ничего не найдено</p>
            <p className="mt-1 text-sm text-slate-500">Смените фильтры или сбросьте их</p>
          </div>
        )}

        {!error && auctions.length > 0 && (
          <div
            className={cn(
              "grid grid-cols-2 gap-3 transition-opacity sm:gap-4 lg:grid-cols-3 xl:grid-cols-4",
              isFetching && !isLoading && "opacity-60",
            )}
          >
            {auctions.map((auction) => (
              <AuctionCard key={auction.id} auction={auction} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
