"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Home, LayoutGrid, LogIn, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { HeaderAuthButton, HeaderAuthIcon } from "./header-auth-button";
import { NotificationBell } from "./notification-bell";
import { useAuth } from "./auth-provider";

function HeaderLogo({ size = "md" }: { size?: "sm" | "md" }) {
  const slot = size === "sm" ? "h-8 w-8 sm:h-9 sm:w-9" : "h-9 w-9 sm:h-10 sm:w-10";
  const img = size === "sm" ? "h-11 w-11 sm:h-12 sm:w-12" : "h-14 w-14 sm:h-16 sm:w-16";
  return (
    <span aria-hidden className={cn("header-brand-mark", slot)}>
      <Image
        src="/logo.png"
        alt=""
        width={80}
        height={80}
        className={cn(
          "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 scale-[1.4] object-contain",
          img,
        )}
      />
    </span>
  );
}

function BrandLink({
  showText = true,
  showTagline = false,
  className,
}: {
  showText?: boolean;
  showTagline?: boolean;
  className?: string;
}) {
  return (
    <Link href="/" className={cn("group flex min-w-0 shrink-0 items-center gap-2.5", className)}>
      <HeaderLogo size={showTagline ? "sm" : "md"} />
      {showText && (
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-extrabold leading-tight tracking-tight text-slate-900 sm:text-[15px] lg:text-lg">
            Lot&<span className="text-amber-500">Go</span>
          </span>
          {showTagline && (
            <span className="hidden truncate text-[10px] font-semibold leading-tight text-slate-500 min-[380px]:block lg:text-xs">
              Аукционы в реальном времени
            </span>
          )}
        </span>
      )}
    </Link>
  );
}

function AppHeaderShell({
  children,
  dark = false,
}: {
  children: React.ReactNode;
  dark?: boolean;
}) {
  return (
    <header className="liquid-glass-header-wrap">
      <div className={cn("liquid-glass-header", dark && "liquid-glass-header-dark")}>
        {!dark && <div className="liquid-glass-header-shine" aria-hidden />}
        <div className="liquid-glass-header-inner header-bar-inner">{children}</div>
      </div>
    </header>
  );
}

export function HeaderSellButton() {
  const { user } = useAuth();
  if (!user) return null;
  return (
    <Link href="/sell" className="header-sell-chip lg:hidden">
      <Plus className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} />
      <span className="text-xs font-semibold">Выставить</span>
    </Link>
  );
}

function SellButton() {
  const { user } = useAuth();
  if (!user) return null;
  return (
    <Link href="/sell" className="btn-primary hidden !rounded-xl !py-2 !text-sm lg:inline-flex">
      <Plus className="h-4 w-4" />
      Выставить лот
    </Link>
  );
}

function AdminLink() {
  const { user } = useAuth();
  if (!user || user.role !== "admin") return null;
  return (
    <Link
      href="/admin"
      className="header-nav-pill-idle !border !border-amber-200/70 !bg-amber-50/60 !text-amber-700 hover:!bg-amber-50"
    >
      Админ
    </Link>
  );
}

function HeaderNavLinks({ active }: { active?: "home" | "catalog" | "auth" }) {
  return (
    <nav className="flex items-center gap-1 rounded-2xl bg-slate-100/80 p-1 ring-1 ring-slate-200/60">
      <Link
        href="/"
        className={active === "home" ? "header-nav-pill-active" : "header-nav-pill-idle"}
      >
        <Home className="mr-1.5 hidden h-4 w-4 lg:inline" strokeWidth={2.25} />
        Главная
      </Link>
      <Link
        href="/catalog"
        className={active === "catalog" ? "header-nav-pill-active" : "header-nav-pill-idle"}
      >
        <LayoutGrid className="mr-1.5 hidden h-4 w-4 lg:inline" strokeWidth={2.25} />
        Аукционы
      </Link>
    </nav>
  );
}

function DefaultHeaderActions({ dark = false }: { dark?: boolean }) {
  const { user } = useAuth();
  return (
    <div className="header-actions shrink-0">
      <AdminLink />
      <SellButton />
      <HeaderSellButton />
      <span className="max-sm:hidden">
        <NotificationBell variant={dark ? "light" : "dark"} />
      </span>
      {user ? (
        <>
          <span className="max-sm:hidden lg:hidden">
            <HeaderAuthIcon variant={dark ? "light" : "dark"} />
          </span>
          <span className="hidden lg:inline">
            <HeaderAuthButton variant={dark ? "light" : "dark"} />
          </span>
        </>
      ) : (
        <>
          <Link
            href="/auth"
            aria-label="Войти"
            className={cn("header-icon-btn max-sm:hidden lg:hidden", dark && "header-icon-btn-dark")}
          >
            <LogIn className="h-[18px] w-[18px]" strokeWidth={2.25} />
          </Link>
          <Link href="/auth" className="header-login-pill hidden lg:inline-flex">
            <LogIn className="h-4 w-4" />
            Войти
          </Link>
        </>
      )}
    </div>
  );
}

function HeaderBackLink({
  href,
  label,
  dark = false,
}: {
  href: string;
  label: string;
  dark?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn("header-back-btn shrink-0", dark && "header-icon-btn-dark")}
      aria-label={label}
    >
      <ArrowLeft className="h-[18px] w-[18px] shrink-0" strokeWidth={2.25} />
      <span className="max-w-[7rem] truncate text-sm font-semibold sm:max-w-[10rem]">{label}</span>
    </Link>
  );
}

/** Главная и публичные лендинги — на телефоне навигация только в нижнем доке */
export function SiteHeader({ active }: { active?: "home" | "catalog" | "auth" }) {
  return (
    <AppHeaderShell>
      <div className="header-bar-row header-bar-row-main header-bar-row-compact">
        <BrandLink showTagline className="min-w-0 justify-self-start" />
        <div className="header-bar-nav hidden sm:flex">
          <HeaderNavLinks active={active} />
        </div>
        <DefaultHeaderActions />
      </div>
    </AppHeaderShell>
  );
}

/** Внутренние страницы — назад + крошки, без дубля навигации */
export function InnerHeader({
  backHref,
  backLabel,
  title,
  subtitle,
  right,
  theme = "light",
}: {
  backHref: string;
  backLabel: string;
  title?: string;
  subtitle?: string;
  right?: React.ReactNode | null;
  theme?: "light" | "dark";
}) {
  const isDark = theme === "dark";

  return (
    <AppHeaderShell dark={isDark}>
      <div className="header-bar-row">
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
          <HeaderBackLink href={backHref} label={backLabel} dark={isDark} />
          <span className="hidden h-5 w-px shrink-0 bg-slate-200 sm:block" aria-hidden />
          <div className="min-w-0 flex-1">
            {title ? (
              <>
                <h1 className={cn("header-page-title truncate", isDark && "text-white")}>
                  {title}
                </h1>
                {subtitle && (
                  <p className="truncate text-[11px] font-medium text-slate-500 sm:text-xs">
                    {subtitle}
                  </p>
                )}
              </>
            ) : (
              <BrandLink showText className="!flex sm:!flex" />
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          {right}
          <DefaultHeaderActions dark={isDark} />
        </div>
      </div>
    </AppHeaderShell>
  );
}
