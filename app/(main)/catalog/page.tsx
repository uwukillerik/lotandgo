"use client";

import { useDeferredValue, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { SlidersHorizontal, Flame, Plus, Loader2 } from "lucide-react";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { CatalogFiltersPanel } from "@/components/catalog-filters";
import { AuctionCard } from "@/components/auction-card";
import { PromotedShowcase } from "@/components/promoted-showcase";
import { AuctionCardSkeleton } from "@/components/skeleton";
import { PwaInstallBanner } from "@/components/pwa-install-banner";
import { ErrorState } from "@/components/page-states";
import { getAuthHeaders, useAuth } from "@/components/auth-provider";
import {
  DEFAULT_CATALOG_FILTERS,
  type CatalogFilters,
} from "@shared/catalog-filters";
import type { AuctionListItem } from "@shared/api";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 24;

async function fetchAuctions(filters: CatalogFilters, page: number) {
  const params = new URLSearchParams({
    status: filters.status,
    limit: String(PAGE_SIZE),
    sort: filters.sort,
    page: String(page),
  });
  if (filters.search) params.set("search", filters.search);
  if (filters.category !== "Все") params.set("category", filters.category);
  if (filters.minPrice) params.set("minPrice", filters.minPrice);
  if (filters.maxPrice) params.set("maxPrice", filters.maxPrice);
  const res = await fetch(`/api/auctions?${params}`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error("Ошибка загрузки");
  return (await res.json()).auctions as AuctionListItem[];
}

export default function CatalogPage() {
  const { user } = useAuth();
  const [filters, setFilters] = useState<CatalogFilters>(DEFAULT_CATALOG_FILTERS);
  const deferredFilters = useDeferredValue(filters);

  const {
    data,
    isLoading,
    isFetching,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["auctions", deferredFilters],
    queryFn: ({ pageParam }) => fetchAuctions(deferredFilters, pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage, _pages, lastPageParam) =>
      lastPage.length < PAGE_SIZE ? undefined : lastPageParam + 1,
  });

  const auctions = data?.pages.flat() ?? [];
  const showSkeleton = isLoading && auctions.length === 0;
  const liveCount = auctions.filter((a) => a.status === "active").length;

  return (
    <div className="page-bg min-h-screen">
      <SiteHeader active="catalog" />

      <main className="page-shell">
        <PwaInstallBanner className="mb-6" />

        <div className="catalog-hero mb-6">
          <div className="absolute right-0 top-0 h-32 w-32 bg-[radial-gradient(circle,rgba(251,191,36,0.12),transparent_70%)]" />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
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
            {user && (
              <Link href="/sell" className="btn-primary inline-flex w-full shrink-0 justify-center sm:w-auto">
                <Plus className="h-4 w-4" />
                Выставить лот
              </Link>
            )}
          </div>
        </div>

        <CatalogFiltersPanel filters={filters} onChange={setFilters} />

        {isError && <ErrorState onRetry={() => refetch()} className="mt-6" />}

        {!isError && auctions.length > 0 && <PromotedShowcase auctions={auctions} />}

        {!isError && showSkeleton && (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <AuctionCardSkeleton key={i} />
            ))}
          </div>
        )}

        {!isError && !showSkeleton && auctions.length === 0 && (
          <div className="surface-card flex flex-col items-center border-dashed py-16 text-center">
            <SlidersHorizontal className="mb-3 h-10 w-10 text-slate-300" />
            <p className="font-semibold text-slate-700">Ничего не найдено</p>
            <p className="mt-1 text-sm text-slate-500">Смените фильтры или сбросьте их</p>
          </div>
        )}

        {!isError && auctions.length > 0 && (
          <>
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

            {hasNextPage && (
              <div className="mt-8 flex justify-center">
                <button
                  type="button"
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  className="btn-ghost inline-flex min-w-[12rem] justify-center"
                >
                  {isFetchingNextPage ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    "Показать ещё"
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
