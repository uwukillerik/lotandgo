"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { InnerHeader } from "@/components/site-header";
import { AuctionCard } from "@/components/auction-card";
import { AuctionCardSkeleton } from "@/components/skeleton";
import { EmptyState, ErrorState } from "@/components/page-states";
import { getAuthHeaders } from "@/components/auth-provider";
import type { AuctionListItem } from "@shared/api";

export default function ProfileFavoritesPage() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["favorites"],
    queryFn: async () => {
      const res = await fetch("/api/favorites", { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Ошибка загрузки");
      return (await res.json()).favorites as AuctionListItem[];
    },
  });

  return (
    <div className="page-bg min-h-screen">
      <InnerHeader backHref="/profile" backLabel="Профиль" title="Избранное" right={null} />
      <main className="page-shell">
        {isLoading && (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <AuctionCardSkeleton key={i} />
            ))}
          </div>
        )}

        {isError && <ErrorState onRetry={() => refetch()} />}

        {!isLoading && !isError && (!data || data.length === 0) && (
          <EmptyState
            title="Избранного пока нет"
            description="Нажмите на сердечко на карточке лота, чтобы сохранить его здесь"
            action={
              <Link href="/catalog" className="btn-primary inline-flex">
                В каталог
              </Link>
            }
          />
        )}

        {!isLoading && !isError && data && data.length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
            {data.map((auction) => (
              <AuctionCard key={auction.id} auction={auction} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
