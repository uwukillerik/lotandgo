"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Cookie } from "lucide-react";

const STORAGE_KEY = "lotgo_cookie_consent";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
  }, []);

  if (!visible) return null;

  const accept = () => {
    localStorage.setItem(STORAGE_KEY, new Date().toISOString());
    setVisible(false);
  };

  return (
    <div className="fixed inset-x-0 bottom-[calc(5.5rem+env(safe-area-inset-bottom,0px))] z-50 px-4 sm:bottom-4 sm:left-auto sm:right-4 sm:max-w-md sm:px-0">
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xl shadow-slate-900/10 sm:p-5">
        <div className="flex gap-3">
          <Cookie className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
          <div>
            <p className="text-sm font-bold text-slate-900">Мы используем cookie</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-600">
              Файлы cookie нужны для входа в аккаунт и работы сайта. Подробнее — в{" "}
              <Link href="/legal/cookies" className="font-semibold text-amber-700 hover:underline">
                политике cookie
              </Link>
              .
            </p>
            <button
              type="button"
              onClick={accept}
              className="btn-primary mt-3 h-9 px-4 text-xs"
            >
              Понятно
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
