"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  LayoutDashboard,
  Users,
  Package,
  Gavel,
  CreditCard,
  ArrowLeft,
  Loader2,
  Download,
} from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { cn } from "@/lib/utils";

const links = [
  { href: "/admin", label: "Обзор", icon: LayoutDashboard, exact: true },
  { href: "/admin/users", label: "Пользователи", icon: Users },
  { href: "/admin/lots", label: "Лоты", icon: Package },
  { href: "/admin/auctions", label: "Аукционы", icon: Gavel },
  { href: "/admin/payments", label: "Финансы", icon: CreditCard },
  { href: "/admin/tools", label: "Почта и CSV", icon: Download },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) router.replace("/auth");
    if (!loading && user && user.role !== "admin") router.replace("/profile");
  }, [loading, user, router]);

  if (loading || !user || user.role !== "admin") {
    return (
      <div className="page-bg flex min-h-dvh items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="page-bg min-h-dvh text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:h-16">
          <div className="flex items-center gap-3">
            <Link
              href="/catalog"
              className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-semibold text-slate-500 hover:text-slate-900"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">На сайт</span>
            </Link>
            <span className="font-extrabold text-slate-900">
              Lot&<span className="text-amber-500">Go</span>
              <span className="ml-2 rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                Admin
              </span>
            </span>
          </div>
          <p className="truncate text-sm font-medium text-slate-600">{user.name}</p>
        </div>
        <nav className="overflow-x-auto border-t border-slate-100 scrollbar-none">
          <div className="mx-auto flex max-w-7xl gap-1 px-2 py-2 sm:px-4">
            {links.map(({ href, label, icon: Icon, exact }) => {
              const active = exact ? pathname === href : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition",
                    active
                      ? "bg-amber-500 text-white shadow-sm shadow-amber-500/25"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              );
            })}
          </div>
        </nav>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>
    </div>
  );
}
