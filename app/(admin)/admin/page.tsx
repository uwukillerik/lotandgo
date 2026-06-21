"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { getAuthHeaders } from "@/components/auth-provider";
import { formatPrice } from "@/lib/utils";
import { Users, Package, Gavel, TrendingUp, Wallet, ArrowRight, Download } from "lucide-react";
import { AdminBadge, AdminCard, AdminPageHeader, AdminStatCard } from "@/components/admin-ui";

export default function AdminDashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const res = await fetch("/api/admin/stats", { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Ошибка");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-8">
        <AdminPageHeader title="Обзор платформы" subtitle="Загрузка статистики…" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return <p className="text-rose-400">Не удалось загрузить данные</p>;
  }

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Обзор платформы"
        subtitle="Статистика Lot&Go в реальном времени"
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <AdminStatCard icon={Users} label="Пользователи" value={data.stats.usersCount} />
        <AdminStatCard icon={Package} label="Лоты" value={data.stats.lotsCount} />
        <AdminStatCard icon={Gavel} label="Live аукционы" value={data.stats.activeAuctions} hint="прямо сейчас" />
        <AdminStatCard icon={TrendingUp} label="Всего ставок" value={data.stats.totalBids} />
        <AdminStatCard
          icon={Wallet}
          label="Баланс кошельков"
          value={formatPrice(data.stats.totalWalletRubles ?? 0)}
          hint={`${data.stats.walletsCount ?? 0} кошельков`}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { href: "/admin/lots", label: "Управление лотами", desc: "Фото, описание, ставки" },
          { href: "/admin/auctions", label: "Аукционы", desc: "Завершить торги, сделки" },
          { href: "/admin/users", label: "Пользователи", desc: "Роли и верификация" },
          { href: "/admin/payments", label: "Финансы", desc: "Кошельки и депозиты" },
          { href: "/admin/tools", label: "Почта и CSV", desc: "Тестовые письма и выгрузка" },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="group flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition hover:border-amber-300 hover:shadow-md"
          >
            <div>
              <p className="font-bold text-slate-900">{item.label}</p>
              <p className="text-xs text-slate-500">{item.desc}</p>
            </div>
            <ArrowRight className="h-4 w-4 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-amber-500" />
          </Link>
        ))}
      </div>

      <Link
        href="/admin/tools"
        className="flex items-center justify-between rounded-2xl border border-amber-200/80 bg-gradient-to-r from-amber-50 to-white p-5 shadow-sm transition hover:border-amber-300 hover:shadow-md"
      >
        <div className="flex items-center gap-4">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-lg shadow-amber-500/25">
            <Download className="h-6 w-6" />
          </span>
          <div>
            <p className="font-bold text-slate-900">Почта и экспорт CSV</p>
            <p className="text-sm text-slate-500">
              Отправить тестовое письмо на любой email · выгрузить пользователей, лоты, аукционы
            </p>
          </div>
        </div>
        <ArrowRight className="h-5 w-5 text-amber-500" />
      </Link>

      <div className="grid gap-6 lg:grid-cols-2">
        <AdminCard className="overflow-hidden p-0">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="font-bold text-slate-900">Новые пользователи</h2>
          </div>
          <ul className="divide-y divide-slate-100">
            {data.recentUsers.map((u: { id: string; name: string; email: string; role: string }) => (
              <li key={u.id} className="flex items-center justify-between px-5 py-3 text-sm">
                <div>
                  <Link href={`/admin/users/${u.id}`} className="font-semibold text-slate-900 hover:text-amber-600">
                    {u.name}
                  </Link>
                  <p className="text-slate-500">{u.email}</p>
                </div>
                <AdminBadge variant={u.role === "admin" ? "default" : "muted"}>{u.role}</AdminBadge>
              </li>
            ))}
          </ul>
          <Link
            href="/admin/users"
            className="block border-t border-slate-100 px-5 py-3 text-sm font-semibold text-amber-600 hover:bg-slate-50"
          >
            Все пользователи →
          </Link>
        </AdminCard>

        <AdminCard className="overflow-hidden p-0">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="font-bold text-slate-900">Последние аукционы</h2>
          </div>
          <ul className="divide-y divide-slate-100">
            {data.recentAuctions.map(
              (a: { id: string; title: string; status: string; currentPrice: number }) => (
                <li key={a.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                  <div className="min-w-0">
                    <Link
                      href={`/auction/${a.id}`}
                      className="truncate font-semibold text-slate-900 hover:text-amber-600"
                    >
                      {a.title}
                    </Link>
                    <div className="mt-0.5">
                      <AdminBadge variant={a.status === "active" ? "live" : "muted"}>
                        {a.status === "active" ? "Торги" : a.status}
                      </AdminBadge>
                    </div>
                  </div>
                  <span className="shrink-0 font-bold text-amber-600">{formatPrice(a.currentPrice)}</span>
                </li>
              ),
            )}
          </ul>
          <Link
            href="/admin/auctions"
            className="block border-t border-slate-100 px-5 py-3 text-sm font-semibold text-amber-600 hover:bg-slate-50"
          >
            Все аукционы →
          </Link>
        </AdminCard>
      </div>
    </div>
  );
}
