"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { InnerHeader } from "@/components/site-header";
import { getAuthHeaders, useAuth } from "@/components/auth-provider";
import { formatPrice } from "@/lib/utils";
import { Loader2, Wallet, ArrowDownToLine, ArrowUpFromLine, History } from "lucide-react";
import { toast } from "sonner";

const TX_LABELS: Record<string, string> = {
  deposit: "Пополнение",
  withdraw: "Вывод",
  purchase: "Покупка",
  sale: "Продажа",
  fee: "Комиссия",
  refund: "Возврат",
};

export default function WalletPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [withdrawAmount, setWithdrawAmount] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["wallet"],
    queryFn: async () => {
      const res = await fetch("/api/wallet", { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Ошибка");
      return res.json() as Promise<{
        wallet: { balanceRubles: number; mode: string };
        transactions: Array<{
          id: string;
          type: string;
          amountRubles: number;
          balanceAfterRubles: number;
          description: string;
          createdAt: string;
        }>;
      }>;
    },
    enabled: !!user,
  });

  const deposit = useMutation({
    mutationFn: async (amount: number) => {
      const res = await fetch("/api/wallet/deposit", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ amount }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Ошибка");
      return json.balanceRubles as number;
    },
    onSuccess: (balance) => {
      qc.invalidateQueries({ queryKey: ["wallet"] });
      toast.success(`Баланс: ${formatPrice(balance)}`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const withdraw = useMutation({
    mutationFn: async (amount: number) => {
      const res = await fetch("/api/wallet/withdraw", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ amount }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Ошибка");
      return json.balanceRubles as number;
    },
    onSuccess: (balance) => {
      setWithdrawAmount("");
      qc.invalidateQueries({ queryKey: ["wallet"] });
      toast.success(`Вывод оформлен. Баланс: ${formatPrice(balance)}`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!user) {
    return (
      <div className="page-bg min-h-screen">
        <InnerHeader backHref="/profile" backLabel="Профиль" title="Кошелёк" right={null} />
        <main className="page-shell py-16 text-center">
          <Link href="/auth" className="btn-primary inline-flex">
            Войти
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="page-bg min-h-screen">
      <InnerHeader backHref="/profile" backLabel="Профиль" title="Кошелёк" right={null} />
      <main className="page-shell mx-auto max-w-md space-y-5">
        <div className="surface-card border-amber-200/50 bg-gradient-to-br from-amber-50/80 to-white p-6">
          <div className="flex items-center gap-3">
            <span className="icon-ring !rounded-xl !p-3">
              <Wallet className="h-6 w-6 text-amber-600" />
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Баланс</p>
              {isLoading ? (
                <Loader2 className="mt-1 h-6 w-6 animate-spin text-amber-500" />
              ) : (
                <p className="text-3xl font-extrabold tabular-nums text-slate-900">
                  {formatPrice(data?.wallet.balanceRubles ?? 0)}
                </p>
              )}
            </div>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-slate-600">
            Сейчас <strong>тестовый кошелёк</strong>: пополняйте виртуально, оплачивайте выигранные
            лоты кнопкой «Я оплатил». Продавцу деньги зачисляются на баланс — оттуда можно вывести.
            Позже подключим ЮKassa.
          </p>
        </div>

        <div className="surface-card space-y-3 p-5">
          <p className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <ArrowDownToLine className="h-4 w-4 text-emerald-600" />
            Пополнить (тест)
          </p>
          <div className="flex flex-wrap gap-2">
            {[10_000, 50_000, 100_000].map((amount) => (
              <button
                key={amount}
                type="button"
                disabled={deposit.isPending}
                onClick={() => deposit.mutate(amount)}
                className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-800 transition hover:bg-emerald-100"
              >
                +{formatPrice(amount)}
              </button>
            ))}
          </div>
        </div>

        <div className="surface-card space-y-3 p-5">
          <p className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <ArrowUpFromLine className="h-4 w-4 text-slate-600" />
            Вывести (тест)
          </p>
          <div className="flex gap-2">
            <input
              type="number"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              placeholder="Сумма в ₽"
              className="input-field h-11 min-w-0 flex-1"
            />
            <button
              type="button"
              disabled={withdraw.isPending || !withdrawAmount}
              onClick={() => withdraw.mutate(parseInt(withdrawAmount, 10))}
              className="btn-primary h-11 shrink-0 px-4"
            >
              Вывести
            </button>
          </div>
        </div>

        <div className="surface-card p-5">
          <p className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <History className="h-4 w-4" />
            История операций
          </p>
          {isLoading && (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
            </div>
          )}
          {!isLoading && (!data?.transactions.length) && (
            <p className="mt-3 text-sm text-slate-500">Операций пока нет</p>
          )}
          <ul className="mt-3 divide-y divide-slate-100">
            {data?.transactions.map((t) => (
              <li key={t.id} className="flex items-start justify-between gap-3 py-3 text-sm">
                <div className="min-w-0">
                  <p className="font-medium text-slate-800">{t.description}</p>
                  <p className="text-xs text-slate-400">
                    {TX_LABELS[t.type] ?? t.type} ·{" "}
                    {new Date(t.createdAt).toLocaleString("ru-RU")}
                  </p>
                </div>
                <span
                  className={
                    t.amountRubles >= 0
                      ? "shrink-0 font-bold text-emerald-600"
                      : "shrink-0 font-bold text-rose-600"
                  }
                >
                  {t.amountRubles >= 0 ? "+" : ""}
                  {formatPrice(t.amountRubles)}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-center text-xs text-slate-400">
          Комиссия платформы при оплате лота — 5%. ЮKassa — в разработке.
        </p>
      </main>
    </div>
  );
}
