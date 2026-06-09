"use client";

import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAuthHeaders } from "@/components/auth-provider";
import { formatPrice } from "@/lib/utils";
import { toast } from "sonner";
import { AdminBadge, AdminBtn, AdminCard, AdminEmpty, AdminPageHeader } from "@/components/admin-ui";
import { auctionStatusLabels, dealStatusLabels } from "@/lib/admin-labels";

export default function AdminAuctionsPage() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-auctions"],
    queryFn: async () => {
      const res = await fetch("/api/admin/auctions", { headers: getAuthHeaders() });
      return (await res.json()).auctions as Array<{
        id: string;
        title: string;
        status: string;
        currentPrice: number;
        bidsCount: number;
        winnerId: string | null;
        winnerName: string | null;
        dealStatus: string;
        endsAt?: string;
      }>;
    },
  });

  const forceEnd = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/auctions/${id}/end`, {
        method: "POST",
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Ошибка");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-auctions"] });
      toast.success("Аукцион завершён");
    },
  });

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Аукционы"
        subtitle="Все торги на платформе — откройте лот на сайте или завершите досрочно"
      />

      {isLoading && <p className="text-slate-500">Загрузка…</p>}

      {!isLoading && (!data || data.length === 0) && (
        <AdminEmpty title="Аукционов пока нет" />
      )}

      <div className="space-y-3">
        {data?.map((a) => (
          <AdminCard key={a.id} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={`/auction/${a.id}`}
                  className="font-bold text-slate-900 hover:text-amber-600"
                >
                  {a.title}
                </Link>
                <AdminBadge variant={a.status === "active" ? "live" : "muted"}>
                  {auctionStatusLabels[a.status] ?? a.status}
                </AdminBadge>
                {a.dealStatus && a.dealStatus !== "none" && (
                  <AdminBadge variant="success">{dealStatusLabels[a.dealStatus] ?? a.dealStatus}</AdminBadge>
                )}
              </div>
              <p className="mt-2 text-sm text-slate-600">
                {a.bidsCount} ставок · текущая цена{" "}
                <span className="font-bold text-amber-600">{formatPrice(a.currentPrice)}</span>
                {a.winnerName && (
                  <>
                    {" "}
                    · победитель: <span className="font-medium text-slate-800">{a.winnerName}</span>
                  </>
                )}
              </p>
              {a.endsAt && (
                <p className="mt-1 text-xs text-slate-500">
                  Окончание: {new Date(a.endsAt).toLocaleString("ru-RU")}
                </p>
              )}
            </div>
            <div className="flex shrink-0 gap-2">
              <Link href={`/auction/${a.id}`}>
                <AdminBtn variant="ghost">Открыть</AdminBtn>
              </Link>
              {a.status === "active" && (
                <AdminBtn
                  variant="danger"
                  onClick={() => {
                    if (confirm("Завершить торги досрочно?")) forceEnd.mutate(a.id);
                  }}
                >
                  Завершить
                </AdminBtn>
              )}
            </div>
          </AdminCard>
        ))}
      </div>
    </div>
  );
}
