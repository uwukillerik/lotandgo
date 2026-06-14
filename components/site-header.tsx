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
  showMobileBrand = false,
}: {
  showText?: boolean;
  showMobileBrand?: boolean;
}) {
  const showBrandBlock = showMobileBrand || showText;

  return (
    <Link href="/" className="group flex min-w-0 items-center gap-2 sm:gap-2.5">
      <HeaderLogo size={showMobileBrand ? "sm" : "md"} />
      {showBrandBlock && (
        <span
          className={cn(
            "min-w-0 flex-col",
            showMobileBrand ? "flex sm:flex" : "hidden sm:flex",
          )}
        >
          <span className="truncate text-[15px] font-extrabold leading-tight tracking-tight text-slate-900 sm:text-xl">
            Lot&<span className="text-amber-500">Go</span>
          </span>
          {showMobileBrand && (
            <span className="truncate text-[10px] font-semibold leading-tight text-slate-500 sm:text-xs">
              Аукционы в реальном времени
            </span>
          )}
        </span>
      )}
    </Link>
  );
}

function LiquidGlassHeader({
  children,
  dark = false,
  stacked = false,
  innerPage = false,
}: {
  children: React.ReactNode;
  dark?: boolean;
  stacked?: boolean;
  innerPage?: boolean;
}) {
  return (
    <header className="liquid-glass-header-wrap">
      <div className={cn("liquid-glass-header", dark && "liquid-glass-header-dark")}>
        {!dark && <div className="liquid-glass-header-shine" aria-hidden />}
        <div
          className={cn(
            "liquid-glass-header-inner",
            stacked && "liquid-glass-header-inner-stacked",
            innerPage && "liquid-glass-header-inner-page",
          )}
        >
          {children}
        </div>
      </div>
    </header>
  );
}

export function HeaderSellButton() {
  const { user } = useAuth();
  if (!user) return null;
  return (
    <Link href="/sell" className="header-sell-chip">
      <Plus className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} />
      <span className="text-xs font-semibold">Выставить лот</span>
    </Link>
  );
}

function SellButton() {
  const { user } = useAuth();
  if (!user) return null;
  return (
    <Link href="/sell" className="btn-primary hidden !rounded-xl !py-2 !text-sm sm:inline-flex">
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
    <nav className="hidden items-center gap-0.5 sm:flex">
      <Link
        href="/"
        className={active === "home" ? "header-nav-pill-active" : "header-nav-pill-idle"}
      >
        Главная
      </Link>
      <Link
        href="/catalog"
        className={active === "catalog" ? "header-nav-pill-active" : "header-nav-pill-idle"}
      >
        Аукционы
      </Link>
    </nav>
  );
}

function MobileHeaderQuickNav({ active }: { active?: "home" | "catalog" | "auth" }) {
  const { user } = useAuth();

  return (
    <nav className="mobile-header-quick-nav" aria-label="Разделы сайта">
      <Link
        href="/"
        className={cn(
          "mobile-header-chip",
          active === "home" && "mobile-header-chip-active",
        )}
      >
        <Home className="h-3.5 w-3.5 shrink-0" strokeWidth={2.25} />
        Главная
      </Link>
      <Link
        href="/catalog"
        className={cn(
          "mobile-header-chip",
          active === "catalog" && "mobile-header-chip-active",
        )}
      >
        <LayoutGrid className="h-3.5 w-3.5 shrink-0" strokeWidth={2.25} />
        Аукционы
      </Link>
      {!user && (
        <Link
          href="/auth"
          className={cn(
            "mobile-header-chip",
            active === "auth" && "mobile-header-chip-active",
          )}
        >
          <LogIn className="h-3.5 w-3.5 shrink-0" strokeWidth={2.25} />
          Войти
        </Link>
      )}
    </nav>
  );
}

function DefaultHeaderActions({
  dark = false,
  showMobileLogin = false,
  compactInner = false,
}: {
  dark?: boolean;
  showMobileLogin?: boolean;
  compactInner?: boolean;
}) {
  const { user } = useAuth();
  const mobileIconsOnly = compactInner || !showMobileLogin;

  return (
    <div className={cn("header-actions", compactInner && "header-actions-compact")}>
      {!compactInner && <AdminLink />}
      {!compactInner && <SellButton />}
      <NotificationBell variant={dark ? "light" : "dark"} />
      {user ? (
        <>
          <span className={cn(mobileIconsOnly ? "inline-flex" : showMobileLogin ? "hidden" : "sm:hidden")}>
            <HeaderAuthIcon variant={dark ? "light" : "dark"} />
          </span>
          <span className={cn(mobileIconsOnly ? "hidden" : showMobileLogin ? "inline-flex" : "hidden sm:inline")}>
            <HeaderAuthButton variant={dark ? "light" : "dark"} showNameOnMobile={showMobileLogin} />
          </span>
        </>
      ) : (
        <>
          {!showMobileLogin && !compactInner && (
            <span className="sm:hidden">
              <Link
                href="/auth"
                aria-label="Войти"
                className={cn("header-icon-btn", dark && "header-icon-btn-dark")}
              >
                <LogIn className="h-[18px] w-[18px]" strokeWidth={2.25} />
              </Link>
            </span>
          )}
          <Link
            href="/auth"
            className={cn(
              "header-login-pill",
              showMobileLogin && "header-login-pill-mobile",
              compactInner && "hidden",
            )}
          >
            <LogIn className="h-4 w-4" />
            Войти
          </Link>
        </>
      )}
    </div>
  );
}

/** Главная шапка — landing и публичные страницы */
export function SiteHeader({ active }: { active?: "home" | "catalog" | "auth" }) {
  return (
    <LiquidGlassHeader stacked>
      <div className="header-top-row">
        <BrandLink showMobileBrand />
        <HeaderNavLinks active={active} />
        <DefaultHeaderActions showMobileLogin />
      </div>
      <MobileHeaderQuickNav active={active} />
    </LiquidGlassHeader>
  );
}

/** Внутренние страницы */
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
  right?: React.ReactNode;
  theme?: "light" | "dark";
}) {
  const isDark = theme === "dark";

  return (
    <LiquidGlassHeader dark={isDark} innerPage>
      <Link
        href={backHref}
        className={cn(
          "header-back-btn header-back-btn-icon-only",
          isDark && "header-icon-btn-dark",
        )}
        aria-label={backLabel}
      >
        <ArrowLeft className="h-[18px] w-[18px] shrink-0" strokeWidth={2.25} />
      </Link>

      <div className="header-center header-center-page">
        {title ? (
          <div className="flex min-w-0 flex-col items-center sm:items-start">
            <h1 className={cn("header-title", isDark && "header-title-dark")}>
              {title}
            </h1>
            {subtitle && (
              <p
                className={cn(
                  "hidden max-w-[14rem] truncate text-[10px] font-semibold text-slate-500 sm:block",
                  isDark && "text-slate-400",
                )}
              >
                {subtitle}
              </p>
            )}
          </div>
        ) : (
          <BrandLink showMobileBrand />
        )}
      </div>

      <div className="header-actions-slot">
        {right !== undefined ? (
          <div className="header-actions">{right}</div>
        ) : (
          <DefaultHeaderActions dark={isDark} compactInner />
        )}
      </div>
    </LiquidGlassHeader>
  );
}
