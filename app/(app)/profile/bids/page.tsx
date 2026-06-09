"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { InnerHeader } from "@/components/site-header";
import { getAuthHeaders } from "@/components/auth-provider";
import { formatPrice } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export default function ProfileBidsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["my-bids"],
    queryFn: async () => {
      const res = await fetch("/api/bids/mine", { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Ошибка");
      return (await res.json()).bids as Array<{
        auctionId: string;
        auctionTitle: string;
        amount: number;
        auctionStatus: string;
        isWinner: boolean;
        endsAt: string;
      }>;
    },
  });

  return (
    <div className="min-h-screen">
      <InnerHeader backHref="/profile" backLabel="Профиль" title="Мои ставки" right={null} />
      <main className="page-shell">
        {isLoading && (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
          </div>
        )}
        {!isLoading && (!data || data.length === 0) && (
          <div className="surface-card py-16 text-center">
            <p className="font-semibold text-slate-700">Ставок пока нет</p>
            <Link href="/catalog" className="btn-primary mt-4 inline-flex">
              Перейти в каталог
            </Link>
          </div>
        )}
        {data && data.length > 0 && (
          <ul className="space-y-3">
            {data.map((bid) => (
              <li key={bid.auctionId}>
                <Link
                  href={`/auction/${bid.auctionId}`}
                  className="surface-card block p-4 transition hover:-translate-y-0.5 sm:p-5"
                >
                  <p className="font-bold text-slate-900">{bid.auctionTitle}</p>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
                    <span>Ваша ставка: {formatPrice(bid.amount)}</span>
                    <span>{bid.auctionStatus === "active" ? "● Live" : bid.auctionStatus}</span>
                    {bid.isWinner && (
                      <span className="font-bold text-emerald-600">Победа</span>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
