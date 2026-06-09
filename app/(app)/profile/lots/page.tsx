"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { InnerHeader } from "@/components/site-header";
import { getAuthHeaders } from "@/components/auth-provider";
import { formatPrice } from "@/lib/utils";
import { Loader2, Plus } from "lucide-react";

export default function ProfileLotsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["my-lots"],
    queryFn: async () => {
      const res = await fetch("/api/lots/mine", { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Ошибка");
      return (await res.json()).lots as Array<{
        id: string;
        title: string;
        category: string;
        status: string;
        auction: { id: string; status: string; currentPrice: number } | null;
      }>;
    },
  });

  return (
    <div className="min-h-screen">
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
        {!isLoading && (!data || data.length === 0) && (
          <div className="surface-card py-16 text-center">
            <p className="font-semibold text-slate-700">Лотов пока нет</p>
            <p className="mt-1 text-sm text-slate-500">Создайте первый лот за пару минут</p>
            <Link href="/sell" className="btn-primary mt-4 inline-flex">
              Выставить лот
            </Link>
          </div>
        )}
        {data && data.length > 0 && (
          <ul className="space-y-3">
            {data.map((lot) => (
              <li key={lot.id} className="surface-card p-4 sm:p-5">
                <p className="text-[11px] font-bold uppercase tracking-wider text-amber-600">{lot.category}</p>
                <p className="mt-1 font-bold text-slate-900">{lot.title}</p>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                  <span>{lot.status}</span>
                  {lot.auction && (
                    <>
                      <span>{formatPrice(lot.auction.currentPrice)}</span>
                      <Link href={`/auction/${lot.auction.id}`} className="font-semibold text-amber-600">
                        Открыть →
                      </Link>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
