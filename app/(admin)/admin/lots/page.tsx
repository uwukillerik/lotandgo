"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, ChevronRight, ExternalLink } from "lucide-react";
import { getAuthHeaders } from "@/components/auth-provider";
import {
  AdminBadge,
  AdminCard,
  AdminEmpty,
  AdminPageHeader,
  AdminSearchInput,
} from "@/components/admin-ui";
import { dealStatusLabels, lotStatusLabels } from "@/lib/admin-labels";
import { formatPrice } from "@/lib/utils";
import { toast } from "sonner";

type AdminLot = {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  sellerName: string;
  sellerEmail: string;
  imageUrl: string | null;
  auctionId: string | null;
  auctionStatus: string | null;
  currentPrice: number | null;
  dealStatus: string | null;
  createdAt: string;
};

function statusVariant(status: string): "live" | "success" | "warn" | "muted" | "default" {
  if (status === "active") return "live";
  if (status === "sold" || status === "ended") return "success";
  if (status === "draft") return "muted";
  return "default";
}

export default function AdminLotsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "ended" | "draft">("all");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-lots"],
    queryFn: async () => {
      const res = await fetch("/api/admin/lots", { headers: getAuthHeaders() });
      return (await res.json()).lots as AdminLot[];
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/lots/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Ошибка");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-lots"] });
      toast.success("Лот удалён");
    },
  });

  const filtered = (data ?? []).filter((lot) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      lot.title.toLowerCase().includes(q) ||
      lot.sellerName.toLowerCase().includes(q) ||
      lot.sellerEmail.toLowerCase().includes(q);
    const matchesFilter = filter === "all" || lot.status === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Лоты"
        subtitle={`${data?.length ?? 0} лотов на платформе — откройте карточку для полного описания, фото и ставок`}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <AdminSearchInput
            value={search}
            onChange={setSearch}
            placeholder="Поиск по названию или продавцу…"
          />
        </div>
        <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
          {(
            [
              ["all", "Все"],
              ["active", "Активные"],
              ["ended", "Завершённые"],
              ["draft", "Черновики"],
            ] as const
          ).map(([f, label]) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                filter === f ? "bg-white text-amber-700 shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {isLoading && <p className="text-slate-500">Загрузка…</p>}

      {!isLoading && filtered.length === 0 && (
        <AdminEmpty title="Лоты не найдены" />
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((lot) => (
          <AdminCard key={lot.id} className="flex flex-col p-0 overflow-hidden">
            <Link href={`/admin/lots/${lot.id}`} className="block">
              <div className="relative aspect-[16/10] bg-slate-100">
                {lot.imageUrl ? (
                  <Image src={lot.imageUrl} alt="" fill className="object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-slate-400">
                    Нет фото
                  </div>
                )}
                <div className="absolute left-3 top-3 flex gap-1.5">
                  <AdminBadge variant={statusVariant(lot.status)}>
                    {lotStatusLabels[lot.status] ?? lot.status}
                  </AdminBadge>
                  {lot.auctionStatus === "active" && <AdminBadge variant="live">Торги</AdminBadge>}
                </div>
              </div>
              <div className="p-4">
                <h3 className="line-clamp-2 font-bold text-slate-900">{lot.title}</h3>
                <p className="mt-1 text-xs text-slate-500">{lot.category} · {lot.sellerName}</p>
                <p className="mt-2 line-clamp-2 text-sm text-slate-600">{lot.description}</p>
                {lot.currentPrice != null && (
                  <p className="mt-2 font-bold text-amber-600">{formatPrice(lot.currentPrice)}</p>
                )}
                {lot.dealStatus && lot.dealStatus !== "none" && (
                  <p className="mt-1 text-xs text-sky-600">
                    {dealStatusLabels[lot.dealStatus] ?? lot.dealStatus}
                  </p>
                )}
              </div>
            </Link>
            <div className="mt-auto flex items-center justify-between border-t border-slate-100 px-4 py-3">
              <Link
                href={`/admin/lots/${lot.id}`}
                className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 hover:text-amber-700"
              >
                Подробнее
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
              <div className="flex gap-2">
                {lot.auctionId && (
                  <Link
                    href={`/auction/${lot.auctionId}`}
                    className="text-slate-400 hover:text-slate-900"
                    title="На сайте"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => {
                    if (confirm("Удалить лот?")) remove.mutate(lot.id);
                  }}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-700"
                >
                  Удалить
                </button>
              </div>
            </div>
          </AdminCard>
        ))}
      </div>
    </div>
  );
}
