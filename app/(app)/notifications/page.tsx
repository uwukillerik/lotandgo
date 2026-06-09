"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { InnerHeader } from "@/components/site-header";
import { getAuthHeaders } from "@/components/auth-provider";
import { Loader2, Bell, Gavel, Trophy, Clock, TrendingDown, MessageCircle, Package } from "lucide-react";
import { cn } from "@/lib/utils";

type Notification = {
  id: string;
  type: string;
  auctionId: string;
  auctionTitle: string;
  message: string;
  read: boolean;
  createdAt: string;
};

const typeMeta: Record<string, { icon: typeof Bell; color: string }> = {
  outbid: { icon: TrendingDown, color: "text-rose-600 bg-rose-50" },
  auction_start: { icon: Gavel, color: "text-amber-600 bg-amber-50" },
  auction_end: { icon: Clock, color: "text-slate-500 bg-slate-100" },
  won: { icon: Trophy, color: "text-emerald-600 bg-emerald-50" },
  message: { icon: MessageCircle, color: "text-blue-600 bg-blue-50" },
  deal_update: { icon: Package, color: "text-violet-600 bg-violet-50" },
};

export default function NotificationsPage() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await fetch("/api/notifications", { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Ошибка");
      return (await res.json()).notifications as Notification[];
    },
    refetchInterval: 20_000,
  });

  const markAll = useMutation({
    mutationFn: async () => {
      await fetch("/api/notifications/read-all", {
        method: "PATCH",
        headers: getAuthHeaders(),
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const unread = data?.filter((n) => !n.read).length ?? 0;

  return (
    <div className="page-bg min-h-screen">
      <InnerHeader backHref="/profile" backLabel="Профиль" title="Уведомления" right={null} />
      <main className="page-shell">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-slate-500">
            {unread > 0 ? `${unread} непрочитанных` : "Все прочитаны"}
          </p>
          {unread > 0 && (
            <button
              type="button"
              onClick={() => markAll.mutate()}
              className="text-sm font-semibold text-amber-600 hover:text-amber-700"
            >
              Прочитать все
            </button>
          )}
        </div>

        {isLoading && (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
          </div>
        )}

        {!isLoading && (!data || data.length === 0) && (
          <div className="surface-card py-14 text-center">
            <Bell className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-3 font-semibold text-slate-700">Уведомлений пока нет</p>
            <p className="mt-1 text-sm text-slate-500">
              Здесь появятся перебитые ставки, новые торги и победы
            </p>
          </div>
        )}

        <ul className="space-y-2">
          {data?.map((n) => {
            const meta = typeMeta[n.type] ?? typeMeta.auction_end;
            const Icon = meta.icon;
            return (
              <li key={n.id}>
                <Link
                  href={`/auction/${n.auctionId}`}
                  className={cn(
                    "surface-card-interactive flex gap-3 p-3.5 sm:gap-4 sm:p-4",
                    !n.read && "border-amber-300/80 bg-amber-50/40 ring-1 ring-amber-100",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg sm:h-10 sm:w-10",
                      meta.color,
                    )}
                  >
                    <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">{n.auctionTitle}</p>
                    <p className="mt-0.5 text-sm text-slate-500">{n.message}</p>
                    <p className="mt-1.5 text-xs text-slate-400">
                      {new Date(n.createdAt).toLocaleString("ru-RU")}
                    </p>
                  </div>
                  {!n.read && (
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-amber-500" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </main>
    </div>
  );
}
