"use client";

import Link from "next/link";
import { AlertCircle, Inbox, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

export function EmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("surface-card flex flex-col items-center py-14 text-center", className)}>
      <Inbox className="mb-3 h-10 w-10 text-slate-300" />
      <p className="font-semibold text-slate-800">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({
  title = "Не удалось загрузить",
  description = "Проверьте подключение и попробуйте снова.",
  onRetry,
  className,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-rose-200 bg-rose-50 px-5 py-10 text-center",
        className,
      )}
    >
      <AlertCircle className="mx-auto mb-3 h-9 w-9 text-rose-500" />
      <p className="font-semibold text-rose-900">{title}</p>
      <p className="mt-1 text-sm text-rose-700">{description}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="btn-primary mt-4 inline-flex">
          <RefreshCw className="h-4 w-4" />
          Повторить
        </button>
      )}
    </div>
  );
}

export function NotFoundPage({ backHref = "/catalog", backLabel = "В каталог" }: {
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <div className="page-bg flex min-h-[70dvh] flex-col items-center justify-center px-4 text-center">
      <p className="text-6xl font-black text-amber-500/30">404</p>
      <h1 className="display-heading mt-2 text-2xl text-slate-900">Страница не найдена</h1>
      <p className="mt-2 max-w-md text-sm text-slate-500">
        Возможно, лот уже снят с торгов или ссылка устарела.
      </p>
      <Link href={backHref} className="btn-primary mt-6 inline-flex">
        {backLabel}
      </Link>
    </div>
  );
}
