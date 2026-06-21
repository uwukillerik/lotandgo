"use client";

import { useState, useEffect } from "react";
import { X, Smartphone } from "lucide-react";
import { InstallAppButton } from "@/components/install-app-button";
import { cn } from "@/lib/utils";

const DISMISS_KEY = "lotgo_pwa_banner_dismissed";

export function PwaInstallBanner({ className }: { className?: string }) {
  const [dismissed, setDismissed] = useState(true);
  const [standalone, setStandalone] = useState(false);

  useEffect(() => {
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone;
    setStandalone(!!isStandalone);
    setDismissed(localStorage.getItem(DISMISS_KEY) === "1");
  }, []);

  if (standalone || dismissed) return null;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-amber-200/90 bg-gradient-to-br from-amber-50 via-white to-yellow-50 p-4 shadow-md shadow-amber-500/10 sm:p-5",
        className,
      )}
    >
      <button
        type="button"
        onClick={() => {
          localStorage.setItem(DISMISS_KEY, "1");
          setDismissed(true);
        }}
        className="absolute right-2 top-2 rounded-lg p-1.5 text-slate-400 transition hover:bg-white/80 hover:text-slate-600"
        aria-label="Закрыть"
      >
        <X className="h-4 w-4" />
      </button>
      <div className="flex flex-col gap-4 pr-8 sm:flex-row sm:items-center">
        <span className="icon-ring shrink-0 self-start !p-3">
          <Smartphone className="h-6 w-6" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-slate-900">Возьмите Lot&Go с собой</p>
          <p className="mt-1 text-sm text-slate-600">
            Установите PWA или скачайте APK — торги и уведомления всегда на экране.
          </p>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
          <InstallAppButton variant="secondary" layout="stack" showHints={false} className="!gap-2" />
        </div>
      </div>
    </div>
  );
}
