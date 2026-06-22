"use client";

import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ExternalLink, Loader2, MessageSquare, Save, Trash2, X } from "lucide-react";
import { LOT_CATEGORIES } from "@shared/categories";
import { getAuthHeaders, getAuthUploadHeaders } from "@/components/auth-provider";
import { ImageUploader } from "@/components/sell/image-uploader";
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
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? "Не удалось обновить статус");
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-lot", id] });
      qc.invalidateQueries({ queryKey: ["admin-lots"] });
      toast.success("Статус обновлён");
    },
    onError: (e: Error) => toast.error(e.message),
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

  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
  const [removedImageIds, setRemovedImageIds] = useState<string[]>([]);

  useEffect(() => {
    if (!data) return;
    setEditTitle(data.title);
    setEditDescription(data.description);
    setEditCategory(data.category);
    setNewImageFiles([]);
    setRemovedImageIds([]);
  }, [data?.id]);

  const visibleImages = data?.images.filter((img) => !removedImageIds.includes(img.id)) ?? [];
  const totalImagesAfterSave = visibleImages.length + newImageFiles.length;

  const saveLot = useMutation({
    mutationFn: async () => {
      if (editTitle.trim().length < 3) throw new Error("Название минимум 3 символа");
      if (editDescription.trim().length < 10) throw new Error("Описание минимум 10 символов");
      if (totalImagesAfterSave > 5) throw new Error("Максимум 5 фото на лот");
      if (totalImagesAfterSave === 0) throw new Error("Должно остаться хотя бы одно фото");

      const formData = new FormData();
      formData.append("title", editTitle.trim());
      formData.append("description", editDescription.trim());
      formData.append("category", editCategory);
      if (removedImageIds.length) {
        formData.append("removeImageIds", JSON.stringify(removedImageIds));
      }
      for (const file of newImageFiles) {
        formData.append("images", file);
      }

      const res = await fetch(`/api/admin/lots/${id}`, {
        method: "PATCH",
        headers: getAuthUploadHeaders(),
        body: formData,
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error ?? "Ошибка сохранения");
      }
    },
    onSuccess: () => {
      setNewImageFiles([]);
      setRemovedImageIds([]);
      qc.invalidateQueries({ queryKey: ["admin-lot", id] });
      qc.invalidateQueries({ queryKey: ["admin-lots"] });
      toast.success("Лот сохранён");
    },
    onError: (e: Error) => toast.error(e.message),
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
  const cover = visibleImages[0]?.url;

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
          <AdminCard className="space-y-4">
            <h3 className="font-bold text-slate-900">Редактирование лота</h3>
            <label className="block text-sm">
              <span className="mb-1 block font-semibold text-slate-700">Название</span>
              <input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="input-field w-full"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-semibold text-slate-700">Категория</span>
              <select
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value)}
                className="input-field w-full"
              >
                {LOT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-semibold text-slate-700">Описание</span>
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={5}
                className="input-field w-full resize-y"
              />
            </label>

            <div className="space-y-3">
              <span className="text-sm font-semibold text-slate-700">
                Фотографии ({totalImagesAfterSave}/5)
              </span>

              {visibleImages.length > 0 && (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                  {visibleImages.map((img) => (
                    <div
                      key={img.id}
                      className="relative aspect-square overflow-hidden rounded-xl ring-1 ring-slate-200"
                    >
                      <Image src={img.url} alt="" fill className="object-cover" unoptimized />
                      <button
                        type="button"
                        onClick={() => setRemovedImageIds((ids) => [...ids, img.id])}
                        className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white"
                        aria-label="Удалить фото"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <ImageUploader
                files={newImageFiles}
                onChange={setNewImageFiles}
                max={Math.max(0, 5 - visibleImages.length)}
              />
            </div>

            <button
              type="button"
              onClick={() => saveLot.mutate()}
              disabled={saveLot.isPending}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-amber-600 disabled:opacity-60"
            >
              {saveLot.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Сохранить изменения
            </button>
          </AdminCard>

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
            <h3 className="font-bold text-slate-900">Описание (текущее)</h3>
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
