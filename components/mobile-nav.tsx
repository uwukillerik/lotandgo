"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  LayoutGrid,
  PlusCircle,
  UserCircle2,
  LogIn,
  Bell,
  MessageCircle,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getAuthHeaders } from "@/components/auth-provider";
import { useAuth } from "@/components/auth-provider";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const pathname = usePathname();
  const { user, loading } = useAuth();

  const { data: notifications } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await fetch("/api/notifications", { headers: getAuthHeaders() });
      if (!res.ok) return [];
      return (await res.json()).notifications as Array<{ read: boolean }>;
    },
    enabled: !!user,
    refetchInterval: 45_000,
  });
  const unreadCount = notifications?.filter((n) => !n.read).length ?? 0;

  const profileTab = user
    ? {
        href: "/profile",
        label: "Профиль",
        icon: UserCircle2,
        match: (p: string) =>
          p.startsWith("/profile") || p.startsWith("/admin"),
      }
    : {
        href: "/auth",
        label: "Вход",
        icon: LogIn,
        match: (p: string) => p.startsWith("/auth"),
      };

  const tabs = [
    { href: "/", label: "Главная", icon: Home, match: (p: string) => p === "/" },
    {
      href: "/catalog",
      label: "Аукционы",
      icon: LayoutGrid,
      match: (p: string) => p.startsWith("/catalog") || p.startsWith("/auction"),
    },
    {
      href: "/sell",
      label: "Продать",
      icon: PlusCircle,
      match: (p: string) => p.startsWith("/sell"),
    },
    ...(user
      ? [
          {
            href: "/messages",
            label: "Сообщения",
            icon: MessageCircle,
            match: (p: string) => p.startsWith("/messages"),
          },
          {
            href: "/notifications",
            label: "Уведомления",
            icon: Bell,
            match: (p: string) => p.startsWith("/notifications"),
            badge: unreadCount,
          },
        ]
      : []),
    profileTab,
  ];

  return (
    <nav className="liquid-glass-dock-wrap" aria-label="Мобильная навигация">
      <div className="liquid-glass-dock-outer">
        <div className="liquid-glass-dock-shadow" aria-hidden />

        <div className="liquid-glass-nav">
          <div className="liquid-glass-nav-ambient" aria-hidden>
            <span className="liquid-glass-orb liquid-glass-orb-1" />
            <span className="liquid-glass-orb liquid-glass-orb-2" />
            <span className="liquid-glass-orb liquid-glass-orb-3" />
          </div>
          <div className="liquid-glass-nav-shine" aria-hidden />
          <div className="liquid-glass-nav-frost" aria-hidden />
          <div className="liquid-glass-nav-rim" aria-hidden />

          {tabs.map((tab) => {
            const { href, label, icon: Icon, match } = tab;
            const badge = "badge" in tab ? (tab.badge as number) : 0;
            const active = match(pathname);

            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "liquid-glass-tab",
                  active ? "liquid-glass-tab-on" : "liquid-glass-tab-idle",
                )}
              >
                {active && (
                  <span className="liquid-glass-tab-active absolute inset-0 rounded-[1.25rem]" />
                )}
                <span className="relative flex h-8 w-8 items-center justify-center">
                  <Icon
                    className={cn(
                      "h-[22px] w-[22px] transition-all duration-300",
                      active
                        ? "scale-105 text-slate-900 drop-shadow-[0_1px_2px_rgba(15,23,42,0.12)]"
                        : "text-slate-500",
                    )}
                    strokeWidth={active ? 2.35 : 1.85}
                  />
                  {badge > 0 && (
                    <span className="absolute -right-2.5 -top-2 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-white bg-rose-500 px-0.5 text-[9px] font-bold text-white shadow-lg">
                      {badge > 9 ? "9+" : badge}
                    </span>
                  )}
                </span>
                <span
                  className={cn(
                    "relative max-w-full truncate px-0.5 text-[11px] font-semibold leading-none",
                    active && "font-bold",
                    tabs.length > 4 && "text-[9px]",
                  )}
                >
                  {loading && (href === "/profile" || href === "/auth") ? "…" : label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
