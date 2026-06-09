"use client";

import Link from "next/link";
import Image from "next/image";
import { LogIn, UserCircle2 } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { cn } from "@/lib/utils";

function AvatarBubble({
  user,
  variant,
}: {
  user: { name: string; avatarUrl: string | null };
  variant: "light" | "dark";
}) {
  const initial = user.name.charAt(0).toUpperCase();
  return (
    <span
      className={cn(
        "relative flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-lg text-xs font-extrabold",
        !user.avatarUrl && "bg-amber-500 text-slate-900",
      )}
    >
      {user.avatarUrl ? (
        <Image src={user.avatarUrl} alt="" fill className="object-cover" unoptimized />
      ) : (
        initial
      )}
    </span>
  );
}

export function HeaderAuthButton({ variant = "light" }: { variant?: "light" | "dark" }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div
        className={cn(
          "h-9 w-20 animate-pulse rounded-xl",
          variant === "light" ? "bg-white/10" : "bg-slate-200",
        )}
      />
    );
  }

  if (user) {
    return (
      <Link
        href="/profile"
        className={cn(
          "inline-flex max-w-[140px] items-center gap-2 rounded-[0.9rem] border px-2 py-1.5 text-sm font-bold transition active:scale-[0.97] sm:px-2.5 sm:py-1.5",
          variant === "light"
            ? "border-white/15 bg-white/10 text-white hover:bg-white/15"
            : "border-white/80 bg-gradient-to-b from-white/90 to-white/55 text-slate-900 shadow-sm hover:from-white hover:to-white/70",
        )}
      >
        <AvatarBubble user={user} variant={variant} />
        <span className="hidden truncate sm:inline">{user.name.split(" ")[0]}</span>
      </Link>
    );
  }

  return (
    <Link
      href="/auth"
      className={cn(
        "inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-bold transition active:scale-[0.97] sm:gap-2 sm:px-4",
        variant === "light"
          ? "bg-amber-500 text-slate-900 hover:bg-amber-400"
          : "bg-amber-500 text-slate-900 shadow-md shadow-amber-500/25 hover:bg-amber-400",
      )}
    >
      <LogIn className="h-4 w-4" />
      Войти
    </Link>
  );
}

export function HeaderAuthIcon({ variant = "dark" }: { variant?: "light" | "dark" }) {
  const { user, loading } = useAuth();

  if (loading) return null;

  if (user) {
    return (
      <Link
        href="/profile"
        aria-label="Профиль"
        className={cn(
          "header-icon-btn relative overflow-hidden p-0 text-sm font-extrabold",
          variant === "light" && "header-icon-btn-dark",
          !user.avatarUrl &&
            variant !== "light" &&
            "bg-gradient-to-br from-amber-400 to-amber-500 text-slate-900",
        )}
      >
        {user.avatarUrl ? (
          <Image src={user.avatarUrl} alt="" fill className="object-cover" unoptimized />
        ) : (
          user.name.charAt(0).toUpperCase()
        )}
      </Link>
    );
  }

  return (
    <Link
      href="/auth"
      aria-label="Войти"
      className={cn("header-icon-btn", variant === "light" && "header-icon-btn-dark")}
    >
      <UserCircle2 className="h-[18px] w-[18px]" strokeWidth={2.1} />
    </Link>
  );
}
