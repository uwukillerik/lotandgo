"use client";

import { Download } from "lucide-react";
import { getAuthHeaders } from "@/components/auth-provider";
import { AdminBtn, AdminCard, AdminSectionTitle } from "@/components/admin-ui";

const EXPORTS = [
  { type: "users", label: "Пользователи" },
  { type: "lots", label: "Лоты" },
  { type: "auctions", label: "Аукционы" },
  { type: "payments", label: "Платежи / кошелёк" },
] as const;

export function AdminExportPanel() {
  const download = async (type: string) => {
    const res = await fetch(`/api/admin/export/${type}`, { headers: getAuthHeaders() });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lotgo-${type}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AdminCard className="space-y-4">
      <AdminSectionTitle>Экспорт CSV</AdminSectionTitle>
      <p className="text-sm text-slate-500">Выгрузка данных для отчётности и диплома</p>
      <div className="flex flex-wrap gap-2">
        {EXPORTS.map(({ type, label }) => (
          <AdminBtn key={type} variant="ghost" onClick={() => download(type)}>
            <Download className="h-4 w-4" />
            {label}
          </AdminBtn>
        ))}
      </div>
    </AdminCard>
  );
}
