"use client";

import { AdminEmailPanel } from "@/components/admin-email-panel";
import { AdminExportPanel } from "@/components/admin-export-panel";
import { AdminPageHeader } from "@/components/admin-ui";

export default function AdminToolsPage() {
  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Почта и экспорт"
        subtitle="Тестовые письма на любой адрес и выгрузка данных в CSV"
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <AdminEmailPanel />
        <AdminExportPanel />
      </div>
    </div>
  );
}
