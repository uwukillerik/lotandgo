"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, CreditCard, Package, Truck } from "lucide-react";
import { getAuthHeaders } from "@/components/auth-provider";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { patchAuctionCache } from "@/lib/auction-cache";

type DealStatus = "none" | "awaiting_payment" | "paid" | "shipped" | "completed";

const STEPS: { key: DealStatus; label: string; icon: typeof CreditCard }[] = [
  { key: "awaiting_payment", label: "Ожидает оплаты", icon: CreditCard },
  { key: "paid", label: "Оплачено", icon: CheckCircle2 },
  { key: "shipped", label: "Отправлено", icon: Truck },
  { key: "completed", label: "Завершено", icon: Package },
];

export function AuctionDealPanel({
  auctionId,
  dealStatus,
  isWinner,
  isSeller,
}: {
  auctionId: string;
  dealStatus: DealStatus;
  isWinner: boolean;
  isSeller: boolean;
}) {
  const qc = useQueryClient();

  const update = useMutation({
    mutationFn: async (status: "paid" | "shipped" | "completed") => {
      const res = await fetch(`/api/auctions/${auctionId}/deal`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({ status }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Ошибка");
      return json as {
        dealStatus: DealStatus;
        payment?: { amountRubles: number; sellerReceivesRubles: number };
      };
    },
    onSuccess: (data) => {
      patchAuctionCache(qc, auctionId, { dealStatus: data.dealStatus });
      qc.invalidateQueries({ queryKey: ["wallet"] });
      if (data.payment) {
        toast.success(
          `Оплачено ${data.payment.amountRubles.toLocaleString("ru-RU")} ₽. Продавец получит ${data.payment.sellerReceivesRubles.toLocaleString("ru-RU")} ₽`,
        );
      } else {
        toast.success("Статус сделки обновлён");
      }
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const currentIdx = STEPS.findIndex((s) => s.key === dealStatus);

  return (
    <div className="surface-card p-4 sm:p-5">
      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Сделка</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {STEPS.map((step, i) => {
          const done = currentIdx >= 0 && i <= currentIdx;
          const active = step.key === dealStatus;
          const Icon = step.icon;
          return (
            <div
              key={step.key}
              className={cn(
                "flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold",
                done ? "bg-emerald-50 text-emerald-800" : "bg-slate-50 text-slate-400",
                active && "ring-2 ring-emerald-400/50",
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {step.label}
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {dealStatus === "awaiting_payment" && isWinner && (
          <button
            type="button"
            disabled={update.isPending}
            onClick={() => update.mutate("paid")}
            className="btn-primary h-10 px-4 text-sm"
          >
            Я оплатил с кошелька
          </button>
        )}
        {dealStatus === "paid" && isSeller && (
          <button
            type="button"
            disabled={update.isPending}
            onClick={() => update.mutate("shipped")}
            className="btn-primary h-10 px-4 text-sm"
          >
            Отправил покупателю
          </button>
        )}
        {dealStatus === "shipped" && isWinner && (
          <button
            type="button"
            disabled={update.isPending}
            onClick={() => update.mutate("completed")}
            className="btn-primary h-10 px-4 text-sm"
          >
            Получил, сделка закрыта
          </button>
        )}
        {dealStatus === "completed" && (
          <p className="text-sm font-semibold text-emerald-700">Сделка успешно завершена</p>
        )}
      </div>
    </div>
  );
}
