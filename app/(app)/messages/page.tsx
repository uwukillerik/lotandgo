"use client";

import Link from "next/link";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { InnerHeader } from "@/components/site-header";
import { getAuthHeaders, useAuth } from "@/components/auth-provider";
import { formatPrice } from "@/lib/utils";
import { ErrorState, EmptyState } from "@/components/page-states";
import { Loader2, Package } from "lucide-react";

type Conversation = {
  auctionId: string;
  title: string;
  imageUrl: string | null;
  dealStatus: string;
  currentPrice: number;
  role: "seller" | "winner";
  counterpartName: string;
  lastMessage: {
    body: string;
    createdAt: string;
    isMine: boolean;
  } | null;
};

const DEAL_LABELS: Record<string, string> = {
  awaiting_payment: "Ожидает оплаты",
  paid: "Оплачено",
  shipped: "Отправлено",
  completed: "Завершено",
};

export default function MessagesPage() {
  const { user } = useAuth();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["message-conversations"],
    queryFn: async () => {
      const res = await fetch("/api/messages", { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Ошибка загрузки");
      return (await res.json()).conversations as Conversation[];
    },
    enabled: !!user,
    refetchInterval: 30_000,
  });

  if (!user) {
    return (
      <div className="page-bg min-h-screen">
        <InnerHeader backHref="/profile" backLabel="Профиль" title="Сообщения" right={null} />
        <main className="page-shell py-16 text-center">
          <p className="font-semibold text-slate-700">Войдите, чтобы видеть чаты</p>
          <Link href="/auth" className="btn-primary mt-4 inline-flex">
            Войти
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="page-bg min-h-screen">
      <InnerHeader backHref="/profile" backLabel="Профиль" title="Сообщения" right={null} />
      <main className="page-shell">
        {isLoading && (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
          </div>
        )}

        {isError && <ErrorState onRetry={() => refetch()} />}

        {!isLoading && !isError && (!data || data.length === 0) && (
          <EmptyState
            title="Чатов пока нет"
            description="Они появятся после завершения аукциона с победителем"
            action={
              <Link href="/catalog" className="btn-primary inline-flex">
                В каталог
              </Link>
            }
          />
        )}

        <ul className="space-y-2">
          {data?.map((c) => (
            <li key={c.auctionId}>
              <Link
                href={`/messages/${c.auctionId}`}
                className="surface-card-interactive flex gap-3 p-4"
              >
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                  {c.imageUrl ? (
                    <Image src={c.imageUrl} alt="" fill className="object-cover" sizes="56px" />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Package className="h-6 w-6 text-slate-300" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="truncate font-bold text-slate-900">{c.title}</p>
                    <span className="shrink-0 text-xs font-semibold text-amber-600">
                      {formatPrice(c.currentPrice)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    {c.role === "seller" ? "Покупатель" : "Продавец"}: {c.counterpartName}
                    {c.dealStatus !== "none" && (
                      <span className="text-slate-400">
                        {" "}
                        · {DEAL_LABELS[c.dealStatus] ?? c.dealStatus}
                      </span>
                    )}
                  </p>
                  {c.lastMessage ? (
                    <p className="mt-1 truncate text-sm text-slate-600">
                      {c.lastMessage.isMine ? "Вы: " : ""}
                      {c.lastMessage.body}
                    </p>
                  ) : (
                    <p className="mt-1 text-sm italic text-slate-400">Напишите первым</p>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
