"use client";

import { useQuery } from "@tanstack/react-query";
import { Download, Smartphone, AlertCircle, CheckCircle2 } from "lucide-react";
import { APK_DOWNLOAD_PATH } from "@shared/site-url";
import { AdminCard, AdminSectionTitle } from "@/components/admin-ui";

export function AdminApkPanel() {
  const { data, isLoading } = useQuery({
    queryKey: ["apk-status"],
    queryFn: async () => {
      const res = await fetch("/api/app/download");
      if (!res.ok) throw new Error("Ошибка");
      return res.json() as Promise<{
        apk: { available: boolean; sizeMb: number | null; buildHint: string | null };
      }>;
    },
  });

  const apk = data?.apk;

  return (
    <AdminCard className="space-y-4">
      <AdminSectionTitle>Android APK</AdminSectionTitle>

      {isLoading && <p className="text-sm text-slate-500">Проверка…</p>}

      {apk?.available ? (
        <>
          <p className="flex items-center gap-2 text-sm text-emerald-700">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            APK на сервере{apk.sizeMb ? ` · ${apk.sizeMb} МБ` : ""}
          </p>
          <a
            href={APK_DOWNLOAD_PATH}
            download
            className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-amber-600"
          >
            <Download className="h-4 w-4" />
            Скачать lotgo.apk
          </a>
        </>
      ) : apk ? (
        <>
          <p className="flex items-center gap-2 text-sm text-amber-800">
            <AlertCircle className="h-4 w-4 shrink-0" />
            APK не загружен на сервер
          </p>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
            <p className="flex items-center gap-2 font-semibold text-slate-800">
              <Smartphone className="h-3.5 w-3.5" />
              Как вернуть APK
            </p>
            <ol className="mt-2 list-decimal space-y-1 pl-4">
              <li>На ПК с Android Studio: <code className="rounded bg-white px-1">pnpm build:apk</code></li>
              <li>Загрузка: <code className="rounded bg-white px-1">pnpm upload:apk</code></li>
            </ol>
            <p className="mt-2 text-slate-500">
              Файл не в git — только в <code className="rounded bg-white px-1">public/downloads/</code> на сервере.
            </p>
          </div>
        </>
      ) : null}
    </AdminCard>
  );
}
