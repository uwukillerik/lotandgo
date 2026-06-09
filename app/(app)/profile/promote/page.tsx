"use client";

import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { InnerHeader } from "@/components/site-header";
import { getAuthHeaders } from "@/components/auth-provider";
import { PromotionBadge } from "@/components/promotion-badge";
import { formatPrice, cn } from "@/lib/utils";
import type { PromotionTier } from "@shared/api";
import { Loader2, Sparkles, Wallet, Check } from "lucide-react";
import { toast } from "sonner";

type Plan = {
  tier: PromotionTier;
  name: string;
  tagline: string;
  priceRubles: number;
  days: number;
  perks: string[];
};

type MyLot = {
  id: string;
  title: string;
  status: string;
  auction: { id: string; status: string; currentPrice: number } | null;
  promotion: { tier: PromotionTier; expiresAt: string } | null;
};

export default function ProfilePromotePage() {
  const qc = useQueryClient();
  const { data: plans, isLoading: plansLoading } = useQuery({
    queryKey: ["promotion-plans"],
    queryFn: async () => {
      const res = await fetch("/api/promotions/plans");
      return (await res.json()).plans as Plan[];
    },
  });

  const { data: lots, isLoading: lotsLoading } = useQuery({
    queryKey: ["my-lots"],
    queryFn: async () => {
      const res = await fetch("/api/lots/mine", { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Ошибка");
      return (await res.json()).lots as MyLot[];
    },
  });

  const { data: wallet } = useQuery({
    queryKey: ["wallet"],
    queryFn: async () => {
      const res = await fetch("/api/wallet", { headers: getAuthHeaders() });
      if (!res.ok) return { balanceRubles: 0 };
      return res.json() as Promise<{ balanceRubles: number }>;
    },
  });

  const promote = useMutation({
    mutationFn: async ({ lotId, tier }: { lotId: string; tier: PromotionTier }) => {
      const res = await fetch(`/api/lots/${lotId}/promote`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ tier }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Ошибка");
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-lots"] });
      qc.invalidateQueries({ queryKey: ["wallet"] });
      qc.invalidateQueries({ queryKey: ["auctions"] });
      toast.success("Лот продвинут!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const promotableLots = (lots ?? []).filter(
    (l) => l.auction && l.auction.status !== "ended",
  );

  return (
    <div className="min-h-screen">
      <InnerHeader backHref="/profile" backLabel="Профиль" title="Продвижение лотов" right={null} />

      <main className="page-shell space-y-8">
        <div className="surface-card p-5">
          <div className="flex items-start gap-3">
            <span className="icon-ring shrink-0">
              <Sparkles className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-bold text-slate-900">Поднять лот в каталоге</h2>
              <p className="mt-1 text-sm text-slate-600">
                Оплата с внутреннего кошелька (тестовый режим). Продвинутые лоты показываются выше,
                с красивой рамкой и бейджем.
              </p>
              <Link
                href="/profile/wallet"
                className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-amber-700 hover:underline"
              >
                <Wallet className="h-4 w-4" />
                Баланс: {formatPrice(wallet?.balanceRubles ?? 0)}
              </Link>
            </div>
          </div>
        </div>

        {plansLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
          </div>
        ) : (
          <section className="grid gap-4 sm:grid-cols-3">
            {plans?.map((plan) => (
              <div
                key={plan.tier}
                className={cn(
                  "surface-card flex flex-col p-5",
                  plan.tier === "premium" && "ring-2 ring-violet-200 promo-card-premium",
                  plan.tier === "featured" && "ring-2 ring-amber-200 promo-card-featured",
                )}
              >
                <PromotionBadge tier={plan.tier} size="md" />
                <h3 className="mt-3 text-lg font-extrabold text-slate-900">{plan.name}</h3>
                <p className="text-sm text-slate-500">{plan.tagline}</p>
                <p className="mt-3 text-2xl font-black text-slate-900">
                  {formatPrice(plan.priceRubles)}
                </p>
                <p className="text-xs text-slate-400">{plan.days} дней</p>
                <ul className="mt-4 flex-1 space-y-1.5 text-sm text-slate-600">
                  {plan.perks.map((perk) => (
                    <li key={perk} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                      {perk}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </section>
        )}

        <section>
          <h2 className="text-lg font-bold text-slate-900">Выберите лот</h2>
          <p className="mt-1 text-sm text-slate-500">Затем нажмите тариф — списание с кошелька</p>

          {lotsLoading && (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
            </div>
          )}

          {!lotsLoading && promotableLots.length === 0 && (
            <div className="surface-card mt-4 py-12 text-center">
              <p className="font-semibold text-slate-700">Нет лотов для продвижения</p>
              <Link href="/sell" className="btn-primary mt-4 inline-flex">
                Выставить лот
              </Link>
            </div>
          )}

          <ul className="mt-4 space-y-3">
            {promotableLots.map((lot) => (
              <li key={lot.id} className="surface-card p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-slate-900">{lot.title}</p>
                    {lot.auction && (
                      <p className="mt-1 text-sm text-slate-500">
                        {formatPrice(lot.auction.currentPrice)} · {lot.auction.status}
                      </p>
                    )}
                    {lot.promotion && (
                      <div className="mt-2 flex items-center gap-2">
                        <PromotionBadge tier={lot.promotion.tier} />
                        <span className="text-xs text-slate-400">
                          до {new Date(lot.promotion.expiresAt).toLocaleDateString("ru-RU")}
                        </span>
                      </div>
                    )}
                  </div>
                  {lot.auction && (
                    <Link
                      href={`/auction/${lot.auction.id}`}
                      className="text-sm font-semibold text-amber-600"
                    >
                      Открыть →
                    </Link>
                  )}
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {plans?.map((plan) => (
                    <button
                      key={plan.tier}
                      type="button"
                      disabled={promote.isPending}
                      onClick={() => {
                        if (
                          !confirm(
                            `Подключить «${plan.name}» за ${formatPrice(plan.priceRubles)} на ${plan.days} дн.?`,
                          )
                        ) {
                          return;
                        }
                        promote.mutate({ lotId: lot.id, tier: plan.tier });
                      }}
                      className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-bold text-white transition hover:bg-slate-800 disabled:opacity-50"
                    >
                      {plan.name} · {formatPrice(plan.priceRubles)}
                    </button>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
