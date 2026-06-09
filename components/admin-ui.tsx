import Link from "next/link";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export function AdminPageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-600">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function AdminCard({
  children,
  className,
  href,
}: {
  children: React.ReactNode;
  className?: string;
  href?: string;
}) {
  const cls = cn(
    "rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5",
    href && "transition hover:border-amber-300 hover:shadow-md",
    className,
  );
  if (href) return <Link href={href} className={cls}>{children}</Link>;
  return <div className={cls}>{children}</div>;
}

export function AdminBadge({
  children,
  variant = "default",
}: {
  children: React.ReactNode;
  variant?: "default" | "live" | "success" | "warn" | "muted";
}) {
  const styles = {
    default: "bg-amber-50 text-amber-800 ring-amber-200",
    live: "bg-emerald-50 text-emerald-800 ring-emerald-200",
    success: "bg-sky-50 text-sky-800 ring-sky-200",
    warn: "bg-rose-50 text-rose-800 ring-rose-200",
    muted: "bg-slate-100 text-slate-600 ring-slate-200",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 ring-inset",
        styles[variant],
      )}
    >
      {children}
    </span>
  );
}

export function AdminStatCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <AdminCard>
      <Icon className="h-5 w-5 text-amber-500" />
      <p className="mt-3 text-2xl font-black tabular-nums text-slate-900">{value}</p>
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      {hint && <p className="mt-1 text-[10px] text-slate-400">{hint}</p>}
    </AdminCard>
  );
}

export function AdminEmpty({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <AdminCard className="py-12 text-center">
      <p className="font-semibold text-slate-600">{title}</p>
      {children && <div className="mt-3">{children}</div>}
    </AdminCard>
  );
}

export function AdminSearchInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="input-field h-11 w-full max-w-md pl-11"
    />
  );
}

export function AdminSectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-lg font-bold text-slate-900">{children}</h2>;
}

export function AdminBtn({
  children,
  variant = "default",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "danger" | "ghost";
}) {
  const styles = {
    default: "bg-slate-900 text-white hover:bg-slate-800",
    danger: "bg-rose-50 text-rose-700 ring-1 ring-rose-200 hover:bg-rose-100",
    ghost: "bg-slate-100 text-slate-700 hover:bg-slate-200",
  };
  return (
    <button
      type="button"
      className={cn(
        "rounded-xl px-4 py-2 text-sm font-semibold transition disabled:opacity-50",
        styles[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
