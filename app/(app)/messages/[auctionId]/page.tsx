"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { InnerHeader } from "@/components/site-header";
import { getAuthHeaders, useAuth } from "@/components/auth-provider";
import { useAuctionSocket } from "@/hooks/use-auction-socket";
import { AuctionChat } from "@/components/auction-chat";
import { AuctionDealPanel } from "@/components/auction-deal-panel";
import { Skeleton } from "@/components/skeleton";
import { formatPrice } from "@/lib/utils";
import type { AuctionDetail } from "@shared/api";
import { ExternalLink } from "lucide-react";

export default function MessageThreadPage() {
  const params = useParams();
  const auctionId = params.auctionId as string;
  const { user } = useAuth();

  useAuctionSocket(auctionId, user?.id);

  const { data, isLoading, error } = useQuery({
    queryKey: ["auction", auctionId],
    queryFn: async () => {
      const res = await fetch(`/api/auctions/${auctionId}`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Не найден");
      return (await res.json()).auction as AuctionDetail;
    },
    enabled: !!user,
  });

  if (!user) {
    return (
      <div className="page-bg min-h-screen">
        <InnerHeader backHref="/messages" backLabel="Сообщения" title="Чат" right={null} />
        <main className="page-shell py-16 text-center">
          <Link href="/auth" className="btn-primary inline-flex">
            Войти
          </Link>
        </main>
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="page-bg min-h-screen">
        <InnerHeader backHref="/messages" backLabel="Сообщения" title="Загрузка…" right={null} />
        <div className="page-shell space-y-4">
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (!data.canChat) {
    return (
      <div className="page-bg min-h-screen">
        <InnerHeader backHref="/messages" backLabel="Сообщения" title="Чат" right={null} />
        <main className="page-shell py-16 text-center">
          <p className="font-semibold text-slate-700">Чат недоступен для этого лота</p>
          <p className="mt-1 text-sm text-slate-500">
            {error instanceof Error ? error.message : "Только после завершения аукциона с победителем"}
          </p>
          <Link href={`/auction/${auctionId}`} className="btn-primary mt-4 inline-flex">
            К лоту
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="page-bg flex min-h-screen flex-col">
      <InnerHeader
        backHref="/messages"
        backLabel="Сообщения"
        title={data.title.length > 28 ? `${data.title.slice(0, 28)}…` : data.title}
        right={null}
      />
      <main className="page-shell flex flex-1 flex-col gap-4 pb-4">
        <div className="surface-card flex items-center justify-between gap-3 p-4">
          <div className="min-w-0">
            <p className="truncate font-bold text-slate-900">{data.title}</p>
            <p className="text-sm text-slate-500">
              {formatPrice(data.currentPrice)} · {data.isSeller ? "Вы продавец" : "Вы победитель"}
            </p>
          </div>
          <Link
            href={`/auction/${auctionId}`}
            className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-amber-600"
          >
            Лот
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>

        {data.dealStatus !== "none" && (
          <AuctionDealPanel
            auctionId={data.id}
            dealStatus={data.dealStatus}
            isWinner={data.isWinner}
            isSeller={data.isSeller}
          />
        )}

        <div className="flex min-h-0 flex-1 flex-col">
          <AuctionChat auctionId={data.id} className="min-h-[min(70dvh,32rem)] flex-1" />
        </div>
      </main>
    </div>
  );
}
