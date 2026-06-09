"use client";

import { useQuery } from "@tanstack/react-query";
import { getAuthHeaders } from "@/components/auth-provider";
import { formatPrice } from "@/lib/utils";
import { AdminBadge, AdminCard, AdminEmpty, AdminPageHeader, AdminSectionTitle } from "@/components/admin-ui";
import { walletTxLabels } from "@/lib/admin-labels";

export default function AdminPaymentsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-payments"],
    queryFn: async () => {
      const res = await fetch("/api/admin/payments", { headers: getAuthHeaders() });
      return res.json() as Promise<{
        wallets: Array<{
          id: string;
          name: string;
          email: string;
          balanceRubles: number;
          paymentVerifiedAt: string | null;
        }>;
        payments: Array<{
          id: string;
          name: string;
          email: string;
          stripeCustomerId: string | null;
          paymentVerifiedAt: string | null;
          balanceRubles: number;
        }>;
        recentTransactions: Array<{
          id: string;
          userName: string;
          type: string;
          amountRubles: number;
          createdAt: string;
        }>;
      }>;
    },
  });

  const totalBalance = (data?.wallets ?? []).reduce((s, w) => s + w.balanceRubles, 0);

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Финансы"
        subtitle="Кошельки пользователей, верифицированные депозиты и последние транзакции"
      />

      {isLoading && <p className="text-slate-500">Загрузка…</p>}

      {data && (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <AdminCard>
              <p className="text-xs font-semibold text-slate-500">Сумма на кошельках</p>
              <p className="mt-2 text-2xl font-black text-emerald-600">{formatPrice(totalBalance)}</p>
            </AdminCard>
            <AdminCard>
              <p className="text-xs font-semibold text-slate-500">Активных кошельков</p>
              <p className="mt-2 text-2xl font-black text-slate-900">{data.wallets.length}</p>
            </AdminCard>
            <AdminCard>
              <p className="text-xs font-semibold text-slate-500">Верифицированных карт</p>
              <p className="mt-2 text-2xl font-black text-slate-900">{data.payments.length}</p>
            </AdminCard>
          </div>

          <section className="space-y-3">
            <AdminSectionTitle>Кошельки</AdminSectionTitle>
            {data.wallets.length === 0 ? (
              <AdminEmpty title="Кошельков пока нет" />
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {data.wallets.map((w) => (
                  <AdminCard key={w.id}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-bold text-slate-900">{w.name}</p>
                        <p className="text-sm text-slate-500">{w.email}</p>
                      </div>
                      <p className="font-black text-emerald-600">{formatPrice(w.balanceRubles)}</p>
                    </div>
                    {w.paymentVerifiedAt && <AdminBadge variant="success">карта ✓</AdminBadge>}
                  </AdminCard>
                ))}
              </div>
            )}
          </section>

          <section className="space-y-3">
            <AdminSectionTitle>Последние транзакции</AdminSectionTitle>
            {data.recentTransactions.length === 0 ? (
              <AdminEmpty title="Транзакций пока нет" />
            ) : (
              <AdminCard className="overflow-hidden p-0">
                <ul className="divide-y divide-slate-100">
                  {data.recentTransactions.map((t) => (
                    <li key={t.id} className="flex items-center justify-between px-5 py-3 text-sm">
                      <div>
                        <p className="font-semibold text-slate-900">{t.userName}</p>
                        <p className="text-xs text-slate-500">
                          {walletTxLabels[t.type] ?? t.type} · {new Date(t.createdAt).toLocaleString("ru-RU")}
                        </p>
                      </div>
                      <span
                        className={`font-bold ${t.amountRubles >= 0 ? "text-emerald-600" : "text-rose-600"}`}
                      >
                        {t.amountRubles >= 0 ? "+" : ""}
                        {formatPrice(t.amountRubles)}
                      </span>
                    </li>
                  ))}
                </ul>
              </AdminCard>
            )}
          </section>
        </>
      )}
    </div>
  );
}
