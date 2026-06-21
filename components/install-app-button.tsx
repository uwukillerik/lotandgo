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
  layout = "row",
  showHints = true,
  className,
}: {
  variant?: "primary" | "secondary" | "footer";
  layout?: "row" | "stack";
  showHints?: boolean;
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

  const canPwa = !!installPrompt || isIOS();
  const isFooter = variant === "footer";

  const pwaClass =
    variant === "footer"
      ? "btn-footer-pwa"
      : variant === "secondary"
        ? "btn-secondary"
        : "btn-primary";

  const apkClass =
    variant === "footer"
      ? "btn-footer-apk"
      : "btn-apk";

  return (
    <div
      className={cn(
        layout === "stack" ? "flex flex-col gap-2.5" : "flex flex-col gap-2.5 sm:flex-row sm:flex-wrap",
        className,
      )}
    >
      <div
        className={cn(
          layout === "stack" ? "flex flex-col gap-2.5" : "flex flex-col gap-2.5 sm:flex-row sm:items-center",
        )}
      >
        {canPwa && (
          <button
            type="button"
            onClick={installPwa}
            className={cn(pwaClass, "w-full sm:w-auto")}
          >
            <Smartphone className="h-5 w-5 shrink-0" />
            {isFooter ? "Установить PWA" : "Установить приложение"}
          </button>
        )}
        <a
          href={APK_DOWNLOAD_PATH}
          download="lotgo.apk"
          className={cn(apkClass, "w-full sm:w-auto")}
        >
          <Download className="h-5 w-5 shrink-0" />
          Скачать APK
        </a>
      </div>

      {showHints && showIosHint && (
        <p className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <Share className="mt-0.5 h-4 w-4 shrink-0" />
          На iPhone: «Поделиться» → «На экран Домой» в Safari.
        </p>
      )}

      {showHints && !canPwa && isAndroid() && (
        <p className="text-sm text-slate-600">
          Скачайте APK и установите Lot&Go на телефон — торги всегда под рукой.
        </p>
      )}
    </div>
  );
}
