"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Gavel,
  LogOut,
  Shield,
  Package,
  TrendingUp,
  ChevronRight,
  Loader2,
  CreditCard,
  Wallet,
  Bell,
  MessageCircle,
  Camera,
  Pencil,
  Check,
  X,
  Settings,
  Trophy,
  Activity,
  Sparkles,
  Heart,
} from "lucide-react";
import { InnerHeader } from "@/components/site-header";
import { useAuth, getAuthHeaders, getAuthUploadHeaders } from "@/components/auth-provider";
import { formatPrice, cn } from "@/lib/utils";
import { isAuctionWinner } from "@shared/auction-helpers";
import { PwaInstallBanner } from "@/components/pwa-install-banner";
import { toast } from "sonner";

const MAX_AVATAR_MB = 2;

function QuickAction({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="surface-card-interactive flex flex-col items-center gap-2 p-4 text-center active:scale-[0.98]"
    >
      <span className="icon-ring !rounded-xl !p-2.5">
        <Icon className="h-5 w-5" />
      </span>
      <span className="text-xs font-bold text-slate-800">{label}</span>
    </Link>
  );
}

function MenuLink({
  href,
  icon: Icon,
  title,
  desc,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
}) {
  return (
    <Link
      href={href}
      className="surface-card-interactive flex items-center gap-3.5 p-4 active:scale-[0.99] sm:gap-4 sm:p-5"
    >
      <span className="icon-ring shrink-0 !rounded-xl !p-2.5">
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-bold text-slate-900">{title}</p>
        <p className="text-sm text-slate-500">{desc}</p>
      </div>
      <ChevronRight className="h-5 w-5 shrink-0 text-slate-300" />
    </Link>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading, logout, refresh } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setPhone(user.phone ?? "");
    }
  }, [user]);

  useEffect(() => {
    if (!loading && !user) router.replace("/auth");
  }, [loading, user, router]);

  const { data: bidsData } = useQuery({
    queryKey: ["my-bids"],
    queryFn: async () => {
      const res = await fetch("/api/bids/mine", { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Ошибка");
      return (await res.json()).bids as Array<{
        auctionId: string;
        auctionTitle: string;
        amount: number;
        auctionStatus: string;
        isWinner: boolean;
      }>;
    },
    enabled: !!user,
  });

  const { data: paymentStatus } = useQuery({
    queryKey: ["payment-status"],
    queryFn: async () => {
      const res = await fetch("/api/payments/status", { headers: getAuthHeaders() });
      return res.json();
    },
    enabled: !!user,
  });

  const saveProfile = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({ name, phone: phone || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      return data.user;
    },
    onSuccess: async () => {
      await refresh();
      setEditing(false);
      toast.success("Профиль обновлён");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const uploadAvatar = async (file: File) => {
    if (file.size > MAX_AVATAR_MB * 1024 * 1024) {
      toast.error(`Файл слишком большой (макс. ${MAX_AVATAR_MB} МБ)`);
      return;
    }
    if (!file.type.startsWith("image/") && !/\.(jpe?g|png|webp|gif|heic)$/i.test(file.name)) {
      toast.error("Выберите изображение (JPEG, PNG, WebP)");
      return;
    }

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("avatar", file);
      const res = await fetch("/api/auth/avatar", {
        method: "POST",
        headers: getAuthUploadHeaders(),
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Не удалось загрузить");
      await refresh();
      toast.success("Аватар обновлён");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка загрузки");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  if (loading || !user) {
    return (
      <div className="page-bg min-h-screen">
        <InnerHeader backHref="/catalog" backLabel="Каталог" title="Профиль" />
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
        </div>
      </div>
    );
  }

  const initial = user.name.charAt(0).toUpperCase();
  const activeBids = bidsData?.filter((b) => b.auctionStatus === "active").length ?? 0;
  const wins = bidsData?.filter((b) => isAuctionWinner(b.auctionStatus, b.isWinner)).length ?? 0;

  return (
    <div className="page-bg min-h-screen">
      <InnerHeader backHref="/catalog" backLabel="Каталог" title="Профиль" right={null} />

      <main className="page-shell space-y-5 sm:space-y-6">
        <PwaInstallBanner />

        {/* Шапка профиля */}
        <div className="surface-card overflow-hidden">
          <div className="relative bg-gradient-to-br from-amber-50/80 via-white to-orange-50/50 px-5 py-8 sm:px-8 sm:py-10">
            <div className="absolute right-0 top-0 h-32 w-32 bg-[radial-gradient(circle,rgba(251,191,36,0.15),transparent_70%)]" />

            <div className="relative flex flex-col items-center text-center">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="group relative"
                aria-label="Сменить аватар"
              >
                <div className="rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 p-[3px] shadow-lg shadow-amber-500/25">
                  <div className="relative h-24 w-24 overflow-hidden rounded-full bg-white sm:h-28 sm:w-28">
                    {user.avatarUrl ? (
                      <Image src={user.avatarUrl} alt="" fill className="object-cover" unoptimized />
                    ) : (
                      <span className="flex h-full items-center justify-center bg-gradient-to-br from-amber-100 to-orange-50 text-3xl font-black text-amber-700 sm:text-4xl">
                        {initial}
                      </span>
                    )}
                    <span className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition group-hover:opacity-100 group-active:opacity-100">
                      {uploading ? (
                        <Loader2 className="h-7 w-7 animate-spin text-white" />
                      ) : (
                        <Camera className="h-7 w-7 text-white" />
                      )}
                    </span>
                  </div>
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif,image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadAvatar(file);
                  }}
                />
              </button>

              {editing ? (
                <div className="mt-5 w-full max-w-xs space-y-3">
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="input-field"
                    placeholder="Имя"
                  />
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Телефон"
                    className="input-field"
                  />
                  <div className="flex justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => saveProfile.mutate()}
                      disabled={saveProfile.isPending}
                      className="btn-primary !py-2 !text-sm"
                    >
                      <Check className="h-4 w-4" /> Сохранить
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditing(false);
                        setName(user.name);
                        setPhone(user.phone ?? "");
                      }}
                      className="btn-ghost !py-2 !text-sm"
                    >
                      <X className="h-4 w-4" /> Отмена
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="mt-4 flex items-center justify-center gap-2">
                    <h1 className="display-heading text-xl sm:text-2xl">{user.name}</h1>
                    <button
                      type="button"
                      onClick={() => setEditing(true)}
                      className="rounded-xl border border-slate-200/80 bg-white/80 p-2 text-slate-500 shadow-sm transition hover:text-amber-600"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">{user.email}</p>
                  {user.phone && <p className="mt-0.5 text-sm text-slate-600">{user.phone}</p>}
                </>
              )}

              {user.role === "admin" && (
                <Link
                  href="/admin"
                  className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-4 py-1.5 text-xs font-bold text-amber-700 transition hover:bg-amber-100"
                >
                  <Shield className="h-3.5 w-3.5" />
                  Админ-панель
                </Link>
              )}
            </div>
          </div>

          {/* Статистика */}
          <div className="grid grid-cols-3 divide-x divide-slate-100 border-t border-slate-100 bg-white/60">
            {[
              { icon: Activity, label: "Ставок", value: bidsData?.length ?? "—" },
              { icon: TrendingUp, label: "Активных", value: activeBids },
              { icon: Trophy, label: "Побед", value: wins },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex flex-col items-center gap-1 py-4 sm:py-5">
                <Icon className="h-4 w-4 text-amber-500" />
                <p className="text-xl font-extrabold text-slate-900">{value}</p>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Быстрые действия */}
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-3">
          <QuickAction href="/sell" icon={Package} label="Продать" />
          <QuickAction href="/catalog" icon={Gavel} label="Каталог" />
          <QuickAction href="/profile/bids" icon={TrendingUp} label="Ставки" />
          <QuickAction href="/messages" icon={MessageCircle} label="Сообщения" />
          <QuickAction href="/profile/favorites" icon={Heart} label="Избранное" />
          <QuickAction href="/notifications" icon={Bell} label="Уведомления" />
        </div>

        {/* Кошелёк */}
        <Link
          href="/profile/wallet"
          className="surface-card-interactive flex items-center gap-4 p-4 sm:p-5"
        >
          <span className="icon-ring shrink-0 !rounded-xl !p-2.5">
            <Wallet className="h-5 w-5" />
          </span>
          <div className="flex-1">
            <p className="font-bold text-slate-900">Кошелёк</p>
            <p className="text-sm text-slate-500">Баланс, пополнение и вывод</p>
          </div>
          <ChevronRight className="h-5 w-5 shrink-0 text-slate-300" />
        </Link>

        {/* Оплата */}
        <Link
          href="/profile/payments"
          className={cn(
            "surface-card-interactive flex items-center gap-4 p-4 sm:p-5",
            !paymentStatus?.verified && "ring-2 ring-amber-300/60",
          )}
        >
          <span className="icon-ring shrink-0 !rounded-xl !p-2.5">
            <CreditCard className="h-5 w-5" />
          </span>
          <div className="flex-1">
            <p className="font-bold text-slate-900">Способ оплаты</p>
            <p className="text-sm text-slate-500">
              {paymentStatus?.verified
                ? paymentStatus.label ?? "Депозит подтверждён"
                : "Подтвердите депозит для ставок"}
            </p>
          </div>
          <ChevronRight className="h-5 w-5 shrink-0 text-slate-300" />
        </Link>

        {/* Меню */}
        <div className="space-y-2.5">
          <p className="section-eyebrow px-1">Аккаунт</p>
          <MenuLink href="/profile/favorites" icon={Heart} title="Избранное" desc="Сохранённые лоты для отслеживания" />
          <MenuLink href="/profile/lots" icon={Package} title="Мои лоты" desc="Ваши выставленные лоты" />
          <MenuLink href="/profile/promote" icon={Sparkles} title="Продвижение" desc="Поднять лот в топ каталога" />
          <MenuLink href="/profile/settings" icon={Settings} title="Настройки" desc="Смена пароля и безопасность" />
        </div>

        {/* Последние ставки */}
        {bidsData && bidsData.length > 0 && (
          <div className="surface-card p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-slate-900">Последние ставки</h2>
              <Link href="/profile/bids" className="text-xs font-semibold text-amber-600 hover:text-amber-700">
                Все →
              </Link>
            </div>
            <ul className="mt-3 divide-y divide-slate-100">
              {bidsData.slice(0, 5).map((bid) => (
                <li key={bid.auctionId}>
                  <Link
                    href={`/auction/${bid.auctionId}`}
                    className="flex items-center justify-between gap-3 py-3 text-sm transition hover:text-amber-700"
                  >
                    <span className="line-clamp-1 font-medium text-slate-800">{bid.auctionTitle}</span>
                    <span className="shrink-0 font-bold tabular-nums text-slate-900">
                      {formatPrice(bid.amount)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        <button
          type="button"
          onClick={() => logout().then(() => router.push("/"))}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-200/80 bg-rose-50/80 py-3.5 text-sm font-bold text-rose-700 transition hover:bg-rose-100 active:scale-[0.99]"
        >
          <LogOut className="h-4 w-4" />
          Выйти
        </button>
      </main>
    </div>
  );
}
