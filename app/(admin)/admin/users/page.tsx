"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, ChevronRight } from "lucide-react";
import { getAuthHeaders } from "@/components/auth-provider";
import {
  AdminBadge,
  AdminCard,
  AdminEmpty,
  AdminPageHeader,
  AdminSearchInput,
} from "@/components/admin-ui";
import { roleLabels } from "@/lib/admin-labels";
import { toast } from "sonner";

export default function AdminUsersPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users", search],
    queryFn: async () => {
      const params = search ? `?search=${encodeURIComponent(search)}` : "";
      const res = await fetch(`/api/admin/users${params}`, { headers: getAuthHeaders() });
      return (await res.json()).users as Array<{
        id: string;
        name: string;
        email: string;
        role: string;
        paymentVerified: boolean;
        createdAt: string;
      }>;
    },
  });

  const toggleRole = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: string }) => {
      const newRole = role === "admin" ? "user" : "admin";
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({ role: newRole }),
      });
      if (!res.ok) throw new Error("Ошибка");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("Роль обновлена");
    },
  });

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Пользователи"
        subtitle="Нажмите на карточку, чтобы открыть профиль с лотами, ставками и кошельком"
      />

      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <AdminSearchInput
          value={search}
          onChange={setSearch}
          placeholder="Поиск по имени или email…"
        />
      </div>

      {isLoading && <p className="text-slate-500">Загрузка…</p>}

      {!isLoading && (!data || data.length === 0) && (
        <AdminEmpty title="Пользователи не найдены" />
      )}

      <div className="space-y-2">
        {data?.map((u) => (
          <AdminCard key={u.id} className="flex flex-col gap-3 p-0 sm:flex-row sm:items-center sm:justify-between">
            <Link href={`/admin/users/${u.id}`} className="min-w-0 flex-1 p-4 sm:p-5">
              <p className="font-bold text-slate-900">{u.name}</p>
              <p className="text-sm text-slate-500">{u.email}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <AdminBadge variant={u.role === "admin" ? "default" : "muted"}>
                  {roleLabels[u.role] ?? u.role}
                </AdminBadge>
                {u.paymentVerified && <AdminBadge variant="success">оплата ✓</AdminBadge>}
              </div>
              <p className="mt-2 text-xs text-slate-400">
                с {new Date(u.createdAt).toLocaleDateString("ru-RU")}
              </p>
            </Link>
            <div className="flex items-center gap-2 border-t border-slate-100 px-4 py-3 sm:border-0 sm:pr-5">
              <Link
                href={`/admin/users/${u.id}`}
                className="inline-flex items-center gap-1 text-sm font-semibold text-amber-600 hover:text-amber-700"
              >
                Профиль
                <ChevronRight className="h-4 w-4" />
              </Link>
              <button
                type="button"
                onClick={() => toggleRole.mutate({ id: u.id, role: u.role })}
                className="ml-auto rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 sm:ml-2"
              >
                {u.role === "admin" ? "− admin" : "+ admin"}
              </button>
            </div>
          </AdminCard>
        ))}
      </div>
    </div>
  );
}
