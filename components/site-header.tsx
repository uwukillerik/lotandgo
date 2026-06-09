"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, LogIn, Plus } from "lucide-react";
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

function BrandLink({ showText = true }: { showText?: boolean }) {
  return (
    <Link href="/" className="group flex min-w-0 items-center gap-2 sm:gap-2.5">
      <HeaderLogo />
      {showText && (
        <span className="hidden truncate text-lg font-extrabold tracking-tight text-slate-900 sm:inline sm:text-xl">
          Lot&<span className="text-amber-500">Go</span>
        </span>
      )}
    </Link>
  );
}

function LiquidGlassHeader({
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
        <div className="liquid-glass-header-inner">{children}</div>
      </div>
    </header>
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

function DefaultHeaderActions({ dark = false }: { dark?: boolean }) {
  const { user } = useAuth();
  return (
    <div className="header-actions">
      <AdminLink />
      <SellButton />
      <NotificationBell variant={dark ? "light" : "dark"} />
      {user ? (
        <>
          <span className="sm:hidden">
            <HeaderAuthIcon variant={dark ? "light" : "dark"} />
          </span>
          <span className="hidden sm:inline">
            <HeaderAuthButton variant={dark ? "light" : "dark"} />
          </span>
        </>
      ) : (
        <>
          <span className="sm:hidden">
            <Link
              href="/auth"
              aria-label="Войти"
              className={cn("header-icon-btn", dark && "header-icon-btn-dark")}
            >
              <LogIn className="h-[18px] w-[18px]" strokeWidth={2.25} />
            </Link>
          </span>
          <Link href="/auth" className="header-login-pill">
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
    <LiquidGlassHeader>
      <BrandLink />
      <HeaderNavLinks active={active} />
      <DefaultHeaderActions />
    </LiquidGlassHeader>
  );
}

/** Внутренние страницы */
export function InnerHeader({
  backHref,
  backLabel,
  title,
  right,
  theme = "light",
}: {
  backHref: string;
  backLabel: string;
  title?: string;
  right?: React.ReactNode;
  theme?: "light" | "dark";
}) {
  const isDark = theme === "dark";

  return (
    <LiquidGlassHeader dark={isDark}>
      <Link
        href={backHref}
        className={cn("header-back-btn", isDark && "header-icon-btn-dark")}
        aria-label={backLabel}
      >
        <ArrowLeft className="h-[18px] w-[18px] shrink-0" strokeWidth={2.25} />
        <span className="hidden max-w-[7rem] truncate text-sm font-semibold sm:inline">
          {backLabel}
        </span>
      </Link>

      <div className="header-center">
        {title ? (
          <div className="flex min-w-0 items-center gap-2">
            <Link href="/" className="shrink-0 sm:hidden" aria-label="Lot&Go">
              <HeaderLogo size="sm" />
            </Link>
            <h1 className={cn("header-title", isDark && "header-title-dark")}>{title}</h1>
          </div>
        ) : (
          <BrandLink showText={false} />
        )}
      </div>

      {right !== undefined ? (
        <div className="header-actions">{right}</div>
      ) : (
        <DefaultHeaderActions dark={isDark} />
      )}
    </LiquidGlassHeader>
  );
}
