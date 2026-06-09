"use client";

import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ExternalLink, Loader2, MessageSquare, Trash2 } from "lucide-react";
import { getAuthHeaders } from "@/components/auth-provider";
import { AdminBadge, AdminBtn, AdminCard, AdminPageHeader } from "@/components/admin-ui";
import {
  auctionStatusLabels,
  dealStatusLabels,
  lotStatusLabels,
} from "@/lib/admin-labels";
import { formatPrice } from "@/lib/utils";
import { toast } from "sonner";

type LotDetail = {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  createdAt: string;
  sellerId: string;
  sellerName: string;
  sellerEmail: string;
  sellerPhone: string | null;
  sellerWalletRubles: number;
  images: Array<{ id: string; url: string; sortOrder: number }>;
  auction: {
    id: string;
    status: string;
    startPrice: number;
    currentPrice: number;
    bidStep: number;
    dealStatus: string;
    startsAt: string;
    endsAt: string;
    winnerName: string | null;
    winnerEmail: string | null;
    bidsCount: number;
    messagesCount: number;
    bids: Array<{ id: string; amount: number; userName: string; createdAt: string }>;
  } | null;
};

function statusVariant(status: string): "live" | "success" | "warn" | "muted" | "default" {
  if (status === "active") return "live";
  if (status === "sold" || status === "ended") return "success";
  if (status === "draft") return "muted";
  return "default";
}

export default function AdminLotDetailPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-lot", id],
    queryFn: async () => {
      const res = await fetch(`/api/admin/lots/${id}`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Не найден");
      return (await res.json()).lot as LotDetail;
    },
    enabled: !!id,
  });

  const setStatus = useMutation({
    mutationFn: async (status: string) => {
      const res = await fetch(`/api/admin/lots/${id}`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Ошибка");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-lot", id] });
      qc.invalidateQueries({ queryKey: ["admin-lots"] });
      toast.success("Статус обновлён");
    },
  });

  const remove = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/admin/lots/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Ошибка");
    },
    onSuccess: () => {
      toast.success("Лот удалён");
      window.location.href = "/admin/lots";
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <AdminCard className="py-16 text-center">
        <p className="text-slate-600">Лот не найден</p>
        <Link href="/admin/lots" className="mt-4 inline-block text-sm font-semibold text-amber-600">
          ← К списку лотов
        </Link>
      </AdminCard>
    );
  }

  const lot = data;
  const cover = lot.images[0]?.url;

  return (
    <div className="space-y-6">
      <Link
        href="/admin/lots"
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Все лоты
      </Link>

      <AdminPageHeader
        title={lot.title}
        subtitle={`${lot.category} · создан ${new Date(lot.createdAt).toLocaleString("ru-RU")}`}
        action={
          <div className="flex flex-wrap gap-2">
            {lot.auction && (
              <Link
                href={`/auction/${lot.auction.id}`}
                className="inline-flex items-center gap-2 rounded-xl bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800 ring-1 ring-amber-200 hover:bg-amber-100"
              >
                <ExternalLink className="h-4 w-4" />
                На сайте
              </Link>
            )}
            <button
              type="button"
              onClick={() => {
                if (confirm("Удалить лот безвозвратно?")) remove.mutate();
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 ring-1 ring-rose-200 hover:bg-rose-100"
            >
              <Trash2 className="h-4 w-4" />
              Удалить
            </button>
          </div>
        }
      />

      <div className="flex flex-wrap gap-2">
        <AdminBadge variant={statusVariant(lot.status)}>{lotStatusLabels[lot.status] ?? lot.status}</AdminBadge>
        {lot.auction && (
          <AdminBadge variant={statusVariant(lot.auction.status)}>
            {auctionStatusLabels[lot.auction.status] ?? lot.auction.status}
          </AdminBadge>
        )}
        {lot.auction?.dealStatus && lot.auction.dealStatus !== "none" && (
          <AdminBadge variant="success">{dealStatusLabels[lot.auction.dealStatus] ?? lot.auction.dealStatus}</AdminBadge>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          {cover && (
            <AdminCard className="overflow-hidden p-0">
              <div className="relative aspect-[16/9] w-full bg-slate-900">
                <Image src={cover} alt="" fill className="object-cover" />
              </div>
              {lot.images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto p-3">
                  {lot.images.map((img) => (
                    <div key={img.id} className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg">
                      <Image src={img.url} alt="" fill className="object-cover" />
                    </div>
                  ))}
                </div>
              )}
            </AdminCard>
          )}

          <AdminCard>
            <h3 className="font-bold text-slate-900">Описание</h3>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
              {lot.description || "—"}
            </p>
          </AdminCard>

          {lot.auction && lot.auction.bids.length > 0 && (
            <AdminCard>
              <h3 className="font-bold text-slate-900">Ставки ({lot.auction.bidsCount})</h3>
              <ul className="mt-4 divide-y divide-slate-100">
                {lot.auction.bids.map((b) => (
                  <li key={b.id} className="flex items-center justify-between py-3 text-sm">
                    <div>
                      <p className="font-semibold text-slate-900">{b.userName}</p>
                      <p className="text-xs text-slate-500">
                        {new Date(b.createdAt).toLocaleString("ru-RU")}
                      </p>
                    </div>
                    <span className="font-bold text-amber-600">{formatPrice(b.amount)}</span>
                  </li>
                ))}
              </ul>
            </AdminCard>
          )}
        </div>

        <div className="space-y-4">
          <AdminCard>
            <h3 className="font-bold text-slate-900">Продавец</h3>
            <p className="mt-2 font-semibold text-slate-800">
              <Link href={`/admin/users/${lot.sellerId}`} className="hover:text-amber-600">{lot.sellerName}</Link>
            </p>
            <p className="text-sm text-slate-500">{lot.sellerEmail}</p>
            {lot.sellerPhone && <p className="text-sm text-slate-500">{lot.sellerPhone}</p>}
            <p className="mt-3 text-sm text-slate-500">
              Кошелёк: <span className="font-bold text-emerald-600">{formatPrice(lot.sellerWalletRubles)}</span>
            </p>
          </AdminCard>

          {lot.auction && (
            <AdminCard>
              <h3 className="font-bold text-slate-900">Аукцион</h3>
              <dl className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-slate-500">Старт</dt>
                  <dd className="font-semibold text-slate-900">{formatPrice(lot.auction.startPrice)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Текущая цена</dt>
                  <dd className="font-bold text-amber-600">{formatPrice(lot.auction.currentPrice)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Шаг</dt>
                  <dd className="text-slate-900">{formatPrice(lot.auction.bidStep)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Окончание</dt>
                  <dd className="text-slate-900">{new Date(lot.auction.endsAt).toLocaleString("ru-RU")}</dd>
                </div>
                {lot.auction.winnerName && (
                  <div className="border-t border-slate-100 pt-2">
                    <dt className="text-slate-500">Победитель</dt>
                    <dd className="mt-1 font-semibold text-slate-900">{lot.auction.winnerName}</dd>
                    <dd className="text-xs text-slate-500">{lot.auction.winnerEmail}</dd>
                  </div>
                )}
              </dl>
              {lot.auction.messagesCount > 0 && (
                <p className="mt-3 flex items-center gap-2 text-xs text-slate-400">
                  <MessageSquare className="h-3.5 w-3.5" />
                  {lot.auction.messagesCount} сообщений в чате
                </p>
              )}
            </AdminCard>
          )}

          <AdminCard>
            <h3 className="font-bold text-slate-900">Статус лота</h3>
            <p className="mt-1 text-xs text-slate-500">Изменить статус вручную (для модерации)</p>
            <select
              value={lot.status}
              onChange={(e) => {
                if (e.target.value !== lot.status) setStatus.mutate(e.target.value);
              }}
              className="input-field mt-3 h-11 w-full"
            >
              {(["draft", "active", "ended", "sold"] as const).map((s) => (
                <option key={s} value={s}>
                  {lotStatusLabels[s]}
                </option>
              ))}
            </select>
          </AdminCard>
        </div>
      </div>
    </div>
  );
}
