"use client";

import { useCallback, useEffect, useState } from "react";
import { Download, Smartphone, Share } from "lucide-react";
import { APK_DOWNLOAD_PATH } from "@shared/site-url";
import { cn } from "@/lib/utils";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function isAndroid(): boolean {
  return /Android/i.test(navigator.userAgent);
}

function isIOS(): boolean {
  return /iPad|iPhone|iPod/i.test(navigator.userAgent);
}

export function InstallAppButton({
  variant = "primary",
  className,
}: {
  variant?: "primary" | "ghost";
  className?: string;
}) {
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [showIosHint, setShowIosHint] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone;
    setInstalled(!!standalone);

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  const installPwa = useCallback(async () => {
    if (isIOS()) {
      setShowIosHint(true);
      return;
    }
    if (!installPrompt) return;
    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === "accepted") setInstalled(true);
    setInstallPrompt(null);
  }, [installPrompt]);

  if (installed) return null;

  const base =
    variant === "primary"
      ? "btn-primary"
      : "inline-flex items-center justify-center gap-2 rounded-xl border border-white/30 px-7 py-4 font-bold text-white backdrop-blur-sm transition-all hover:bg-white/10";

  const canPwa = !!installPrompt || isIOS();

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        {canPwa && (
          <button type="button" onClick={installPwa} className={cn(base, "w-full sm:w-auto")}>
            <Smartphone className="h-5 w-5" />
            Установить приложение
          </button>
        )}
        <a
          href={APK_DOWNLOAD_PATH}
          download="lotgo.apk"
          className={cn(
            variant === "primary" ? "btn-ghost" : base,
            "w-full sm:w-auto",
          )}
        >
          <Download className="h-5 w-5" />
          Скачать APK (Android)
        </a>
      </div>

      {showIosHint && (
        <p className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <Share className="mt-0.5 h-4 w-4 shrink-0" />
          На iPhone: «Поделиться» → «На экран Домой» в Safari.
        </p>
      )}

      {!canPwa && !isAndroid() && (
        <p className="text-xs text-slate-500">
          PWA: откройте сайт в Chrome и нажмите «Установить». Или скачайте APK на Android.
        </p>
      )}
    </div>
  );
}
