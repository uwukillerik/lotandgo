"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { InnerHeader } from "@/components/site-header";
import { AuctionImage } from "@/components/auction-image";
import { getAuthHeaders } from "@/components/auth-provider";
import { formatPrice } from "@/lib/utils";
import { auctionStatusLabel } from "@shared/auction-helpers";
import { ErrorState, EmptyState } from "@/components/page-states";
import { Loader2, Plus } from "lucide-react";

export default function ProfileLotsPage() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["my-lots"],
    queryFn: async () => {
      const res = await fetch("/api/lots/mine", { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Ошибка");
      return (await res.json()).lots as Array<{
        id: string;
        title: string;
        category: string;
        status: string;
        images: Array<{ url: string }>;
        auction: { id: string; status: string; currentPrice: number } | null;
      }>;
    },
  });

  return (
    <div className="page-bg min-h-screen">
      <InnerHeader backHref="/profile" backLabel="Профиль" title="Мои лоты" right={null} />
      <main className="page-shell">
        <Link href="/sell" className="btn-primary mb-6 inline-flex w-full justify-center sm:w-auto">
          <Plus className="h-5 w-5" />
          Выставить лот
        </Link>

        {isLoading && (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
          </div>
        )}

        {isError && <ErrorState onRetry={() => refetch()} />}

        {!isLoading && !isError && (!data || data.length === 0) && (
          <EmptyState
            title="Лотов пока нет"
            description="Создайте первый лот за пару минут"
            action={
              <Link href="/sell" className="btn-primary inline-flex">
                Выставить лот
              </Link>
            }
          />
        )}

        {data && data.length > 0 && (
          <ul className="space-y-3">
            {data.map((lot) => {
              const thumb = lot.images[0]?.url;
              return (
                <li key={lot.id} className="surface-card flex gap-3 p-4 sm:p-5">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                    {thumb ? (
                      <AuctionImage src={thumb} alt="" fill className="object-cover" sizes="64px" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-slate-400">Нет фото</div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-amber-600">{lot.category}</p>
                    <p className="mt-1 font-bold text-slate-900">{lot.title}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                      <span>{auctionStatusLabel(lot.auction?.status ?? lot.status)}</span>
                      {lot.auction && (
                        <>
                          <span>{formatPrice(lot.auction.currentPrice)}</span>
                          <Link href={`/auction/${lot.auction.id}`} className="font-semibold text-amber-600">
                            Открыть →
                          </Link>
                        </>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
}
