"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bot, Loader2, X } from "lucide-react";
import { getAuthHeaders } from "@/components/auth-provider";
import { formatPrice } from "@/lib/utils";
import { toast } from "sonner";

export function AutoBidPanel({
  auctionId,
  minBid,
  enabled,
}: {
  auctionId: string;
  minBid: number;
  enabled: boolean;
}) {
  const qc = useQueryClient();
  const [maxAmount, setMaxAmount] = useState("");

  const { data } = useQuery({
    queryKey: ["auto-bid", auctionId],
    queryFn: async () => {
      const res = await fetch(`/api/auctions/${auctionId}/auto-bid`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) return null;
      return (await res.json()).autoBid as { maxAmount: number; active: boolean } | null;
    },
    enabled,
  });

  const save = useMutation({
    mutationFn: async () => {
      const amount = parseInt(maxAmount, 10);
      if (isNaN(amount) || amount < minBid) {
        throw new Error(`Лимит не меньше ${formatPrice(minBid)}`);
      }
      const res = await fetch(`/api/auctions/${auctionId}/auto-bid`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ maxAmount: amount }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Ошибка");
      return json;
    },
    onSuccess: () => {
      toast.success("Автоставка включена");
      qc.invalidateQueries({ queryKey: ["auto-bid", auctionId] });
      qc.invalidateQueries({ queryKey: ["auction", auctionId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const disable = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/auctions/${auctionId}/auto-bid`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Ошибка");
    },
    onSuccess: () => {
      toast.success("Автоставка отключена");
      setMaxAmount("");
      qc.invalidateQueries({ queryKey: ["auto-bid", auctionId] });
    },
  });

  if (!enabled) return null;

  return (
    <div className="surface-card p-4 sm:p-5">
      <p className="flex items-center gap-2 text-sm font-bold text-slate-900">
        <Bot className="h-4 w-4 text-amber-500" />
        Автоставка
      </p>
      <p className="mt-1 text-xs text-slate-500">
        Укажите максимум — система перебьёт соперника до этой суммы
      </p>

      {data?.active ? (
        <div className="mt-3 flex items-center justify-between rounded-xl bg-amber-50 px-3 py-2.5">
          <span className="text-sm font-semibold text-amber-900">
            Лимит: {formatPrice(data.maxAmount)}
          </span>
          <button
            type="button"
            onClick={() => disable.mutate()}
            className="text-amber-700 hover:text-amber-900"
            aria-label="Отключить"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="mt-3 flex gap-2">
          <input
            type="number"
            inputMode="numeric"
            placeholder={`от ${minBid.toLocaleString("ru-RU")} ₽`}
            value={maxAmount}
            onChange={(e) => setMaxAmount(e.target.value)}
            className="input-field min-w-0 flex-1"
          />
          <button
            type="button"
            disabled={save.isPending}
            onClick={() => save.mutate()}
            className="btn-primary shrink-0 !px-4"
          >
            {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Вкл"}
          </button>
        </div>
      )}
    </div>
  );
}
