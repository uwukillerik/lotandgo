"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { InnerHeader } from "@/components/site-header";
import { getAuthHeaders, useAuth } from "@/components/auth-provider";
import { Loader2, CreditCard, ShieldCheck, Wallet, Sparkles } from "lucide-react";
import { toast } from "sonner";

type PaymentStatus = {
  provider: "local" | "stripe" | "none";
  verified: boolean;
  configured: boolean;
  brand?: string | null;
  last4?: string | null;
  label?: string;
};

export default function PaymentsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: status, isLoading } = useQuery({
    queryKey: ["payment-status"],
    queryFn: async () => {
      const res = await fetch("/api/payments/status", { headers: getAuthHeaders() });
      return res.json() as Promise<PaymentStatus>;
    },
    enabled: !!user,
  });

  const verifyLocal = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/payments/verify-local", {
        method: "POST",
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Ошибка");
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payment-status"] });
      toast.success("Депозит подтверждён — можно делать ставки");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const provider = status?.provider ?? "local";

  return (
    <div className="page-bg min-h-screen">
      <InnerHeader backHref="/profile" backLabel="Профиль" title="Участие в торгах" right={null} />
      <main className="page-shell mx-auto max-w-md space-y-5">
        <div className="surface-card border-amber-200/60 bg-gradient-to-br from-amber-50 to-white p-5">
          <div className="flex items-start gap-3">
            <Wallet className="mt-0.5 h-6 w-6 shrink-0 text-amber-600" />
            <div>
              <h2 className="font-bold text-slate-900">Гарантийный депозит</h2>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">
                Для участия в аукционах нужно подтвердить способ оплаты (депозит). Оплата выигранного
                лота — с <Link href="/profile/wallet" className="font-semibold text-amber-700 underline">кошелька</Link>.
                Сейчас тестовый режим, позже — ЮKassa.
              </p>
            </div>
          </div>
        </div>

        {isLoading && (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
          </div>
        )}

        {status?.verified && (
          <div className="surface-card flex items-center gap-3 border-emerald-200 bg-emerald-50 p-5">
            <ShieldCheck className="h-8 w-8 text-emerald-600" />
            <div>
              <p className="font-bold text-emerald-900">Участие разрешено</p>
              <p className="text-sm text-emerald-700">
                {provider === "local"
                  ? status.label ?? "Тестовый депозит активен"
                  : `${status.brand ?? "Карта"} •••• ${status.last4 ?? "****"}`}
              </p>
            </div>
          </div>
        )}

        {!isLoading && provider === "none" && (
          <div className="surface-card p-5 text-sm text-slate-600">
            Оплата не требуется — все пользователи могут делать ставки.
          </div>
        )}

        {!isLoading && provider === "local" && !status?.verified && (
          <div className="surface-card space-y-4 border-amber-200/50 p-5">
            <div className="flex items-center gap-2 text-amber-700">
              <Sparkles className="h-5 w-5" />
              <span className="text-sm font-bold uppercase tracking-wide">Тестовая оплата</span>
            </div>
            <p className="text-sm text-slate-600">
              Нажмите кнопку ниже, чтобы симулировать привязку карты / депозита. Это нужно один раз на
              каждый аккаунт.
            </p>
            <button
              type="button"
              disabled={verifyLocal.isPending}
              onClick={() => verifyLocal.mutate()}
              className="btn-primary h-12 w-full"
            >
              {verifyLocal.isPending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <CreditCard className="h-5 w-5" />
                  Подтвердить тестовый депозит
                </>
              )}
            </button>
          </div>
        )}

        {provider === "stripe" && !status?.verified && (
          <div className="surface-card p-5 text-sm text-slate-600">
            Stripe включён через <code className="text-amber-700">PAYMENT_PROVIDER=stripe</code>.
            По умолчанию используется локальный тест.
          </div>
        )}

        <p className="text-center text-xs text-slate-500">
          ЮKassa · скоро. Stripe отключён по умолчанию.
        </p>
      </main>
    </div>
  );
}
