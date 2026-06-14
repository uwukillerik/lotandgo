"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Loader2,
  Mail,
  Phone,
  Calendar,
  Package,
  Gavel,
  Trophy,
  Wallet,
} from "lucide-react";
import { getAuthHeaders } from "@/components/auth-provider";
import {
  AdminBadge,
  AdminBtn,
  AdminCard,
  AdminEmpty,
  AdminPageHeader,
  AdminSectionTitle,
} from "@/components/admin-ui";
import { AdminSendWelcomeButton } from "@/components/admin-email-panel";
import {
  dealStatusLabels,
  lotStatusLabels,
  roleLabels,
  walletTxLabels,
} from "@/lib/admin-labels";
import { formatPrice } from "@/lib/utils";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Trash2, KeyRound } from "lucide-react";

type UserDetail = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  avatarUrl: string | null;
  stripeCustomerId: string | null;
  paymentVerified: boolean;
  paymentVerifiedAt: string | null;
  termsAcceptedAt: string | null;
  privacyAcceptedAt: string | null;
  createdAt: string;
  walletRubles: number;
  stats: { lotsCount: number; bidsCount: number; winsCount: number };
  lots: Array<{
    id: string;
    title: string;
    status: string;
    category: string;
    auctionId: string | null;
    currentPrice: number | null;
  }>;
  bids: Array<{
    id: string;
    amount: number;
    auctionId: string;
    lotTitle: string;
    createdAt: string;
  }>;
  wonAuctions: Array<{
    id: string;
    title: string;
    currentPrice: number;
    dealStatus: string;
    endsAt: string;
  }>;
  transactions: Array<{
    id: string;
    type: string;
    amountRubles: number;
    createdAt: string;
  }>;
};

export default function AdminUserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const router = useRouter();
  const [newPassword, setNewPassword] = useState("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-user", id],
    queryFn: async () => {
      const res = await fetch(`/api/admin/users/${id}`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Не найден");
      return (await res.json()).user as UserDetail;
    },
    enabled: !!id,
  });

  const toggleRole = useMutation({
    mutationFn: async (role: string) => {
      const newRole = role === "admin" ? "user" : "admin";
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({ role: newRole }),
      });
      if (!res.ok) throw new Error("Ошибка");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-user", id] });
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("Роль обновлена");
    },
  });

  const changePassword = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({ password: newPassword }),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error ?? "Ошибка");
      }
    },
    onSuccess: () => {
      setNewPassword("");
      toast.success("Пароль обновлён");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteUser = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error ?? "Ошибка удаления");
      }
    },
    onSuccess: () => {
      toast.success("Пользователь удалён");
      router.push("/admin/users");
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
      <AdminEmpty title="Пользователь не найден">
        <Link href="/admin/users" className="text-sm font-semibold text-amber-600">
          ← К списку
        </Link>
      </AdminEmpty>
    );
  }

  const u = data;

  return (
    <div className="space-y-6">
      <Link
        href="/admin/users"
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Все пользователи
      </Link>

      <AdminPageHeader
        title={u.name}
        subtitle={`Зарегистрирован ${new Date(u.createdAt).toLocaleString("ru-RU")}`}
        action={
          <div className="flex flex-wrap gap-2">
            <AdminSendWelcomeButton userId={u.id} userName={u.name} />
            <AdminBtn variant="ghost" onClick={() => toggleRole.mutate(u.role)}>
              {u.role === "admin" ? "Снять админа" : "Назначить админом"}
            </AdminBtn>
            <AdminBtn
              variant="ghost"
              className="text-rose-600 hover:bg-rose-50"
              onClick={() => {
                if (confirm(`Удалить ${u.name}? Это необратимо.`)) {
                  deleteUser.mutate();
                }
              }}
            >
              <Trash2 className="h-4 w-4" />
              Удалить
            </AdminBtn>
          </div>
        }
      />

      <div className="flex flex-wrap gap-2">
        <AdminBadge variant={u.role === "admin" ? "default" : "muted"}>
          {roleLabels[u.role] ?? u.role}
        </AdminBadge>
        {u.paymentVerified && <AdminBadge variant="success">Карта подтверждена</AdminBadge>}
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <AdminCard>
          <Wallet className="h-5 w-5 text-emerald-500" />
          <p className="mt-2 text-xl font-black text-emerald-600">{formatPrice(u.walletRubles)}</p>
          <p className="text-xs text-slate-500">Баланс кошелька</p>
        </AdminCard>
        <AdminCard>
          <Package className="h-5 w-5 text-amber-500" />
          <p className="mt-2 text-xl font-black text-slate-900">{u.stats.lotsCount}</p>
          <p className="text-xs text-slate-500">Лотов выставлено</p>
        </AdminCard>
        <AdminCard>
          <Gavel className="h-5 w-5 text-sky-500" />
          <p className="mt-2 text-xl font-black text-slate-900">{u.stats.bidsCount}</p>
          <p className="text-xs text-slate-500">Ставок сделано</p>
        </AdminCard>
        <AdminCard>
          <Trophy className="h-5 w-5 text-violet-500" />
          <p className="mt-2 text-xl font-black text-slate-900">{u.stats.winsCount}</p>
          <p className="text-xs text-slate-500">Побед на аукционах</p>
        </AdminCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        <AdminCard className="space-y-4">
          <AdminSectionTitle>Контакты</AdminSectionTitle>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
              <div>
                <p className="text-xs text-slate-500">Email</p>
                <p className="font-semibold text-slate-900">{u.email}</p>
              </div>
            </div>
            {u.phone && (
              <div className="flex items-start gap-3">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                <div>
                  <p className="text-xs text-slate-500">Телефон</p>
                  <p className="font-semibold text-slate-900">{u.phone}</p>
                </div>
              </div>
            )}
            <div className="flex items-start gap-3">
              <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
              <div>
                <p className="text-xs text-slate-500">ID</p>
                <p className="break-all font-mono text-xs text-slate-600">{u.id}</p>
              </div>
            </div>
            {u.stripeCustomerId && (
              <div>
                <p className="text-xs text-slate-500">Stripe</p>
                <p className="font-mono text-xs text-slate-600">{u.stripeCustomerId}</p>
              </div>
            )}
            {u.paymentVerifiedAt && (
              <p className="text-xs text-emerald-600">
                Карта подтверждена: {new Date(u.paymentVerifiedAt).toLocaleString("ru-RU")}
              </p>
            )}
            {u.termsAcceptedAt && (
              <p className="text-xs text-slate-500">
                Соглашение принято: {new Date(u.termsAcceptedAt).toLocaleString("ru-RU")}
              </p>
            )}
            {u.privacyAcceptedAt && (
              <p className="text-xs text-slate-500">
                Согласие на ПДн: {new Date(u.privacyAcceptedAt).toLocaleString("ru-RU")}
              </p>
            )}
          </div>
          <div className="mt-6 border-t border-slate-100 pt-4">
            <AdminSectionTitle>Сменить пароль</AdminSectionTitle>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Новый пароль (мин. 8 символов)"
                className="input-field flex-1"
              />
              <AdminBtn
                onClick={() => changePassword.mutate()}
                disabled={newPassword.length < 8 || changePassword.isPending}
              >
                <KeyRound className="h-4 w-4" />
                Сохранить
              </AdminBtn>
            </div>
          </div>
        </AdminCard>

        <div className="space-y-6">
          <section className="space-y-3">
            <AdminSectionTitle>Лоты пользователя</AdminSectionTitle>
            {u.lots.length === 0 ? (
              <AdminEmpty title="Лотов нет" />
            ) : (
              <AdminCard className="overflow-hidden p-0">
                <ul className="divide-y divide-slate-100">
                  {u.lots.map((lot) => (
                    <li key={lot.id} className="flex items-center justify-between gap-3 px-5 py-3">
                      <div className="min-w-0">
                        <Link
                          href={`/admin/lots/${lot.id}`}
                          className="font-semibold text-slate-900 hover:text-amber-600"
                        >
                          {lot.title}
                        </Link>
                        <p className="text-xs text-slate-500">
                          {lot.category} · {lotStatusLabels[lot.status] ?? lot.status}
                        </p>
                      </div>
                      {lot.currentPrice != null && (
                        <span className="shrink-0 font-bold text-amber-600">
                          {formatPrice(lot.currentPrice)}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </AdminCard>
            )}
          </section>

          <section className="space-y-3">
            <AdminSectionTitle>Последние ставки</AdminSectionTitle>
            {u.bids.length === 0 ? (
              <AdminEmpty title="Ставок нет" />
            ) : (
              <AdminCard className="overflow-hidden p-0">
                <ul className="divide-y divide-slate-100">
                  {u.bids.map((b) => (
                    <li key={b.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                      <div className="min-w-0">
                        <Link
                          href={`/auction/${b.auctionId}`}
                          className="font-semibold text-slate-900 hover:text-amber-600"
                        >
                          {b.lotTitle}
                        </Link>
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
          </section>

          {u.wonAuctions.length > 0 && (
            <section className="space-y-3">
              <AdminSectionTitle>Выигранные аукционы</AdminSectionTitle>
              <AdminCard className="overflow-hidden p-0">
                <ul className="divide-y divide-slate-100">
                  {u.wonAuctions.map((a) => (
                    <li key={a.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                      <div>
                        <Link
                          href={`/auction/${a.id}`}
                          className="font-semibold text-slate-900 hover:text-amber-600"
                        >
                          {a.title}
                        </Link>
                        <p className="text-xs text-slate-500">
                          {dealStatusLabels[a.dealStatus] ?? a.dealStatus}
                        </p>
                      </div>
                      <span className="font-bold text-emerald-600">{formatPrice(a.currentPrice)}</span>
                    </li>
                  ))}
                </ul>
              </AdminCard>
            </section>
          )}

          {u.transactions.length > 0 && (
            <section className="space-y-3">
              <AdminSectionTitle>Транзакции кошелька</AdminSectionTitle>
              <AdminCard className="overflow-hidden p-0">
                <ul className="divide-y divide-slate-100">
                  {u.transactions.map((t) => (
                    <li key={t.id} className="flex items-center justify-between px-5 py-3 text-sm">
                      <div>
                        <p className="font-medium text-slate-900">
                          {walletTxLabels[t.type] ?? t.type}
                        </p>
                        <p className="text-xs text-slate-500">
                          {new Date(t.createdAt).toLocaleString("ru-RU")}
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
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
